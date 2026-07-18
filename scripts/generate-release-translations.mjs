import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const catalogPath = path.join(root, "src/game/i18n.ts");
const curatedPath = path.join(root, "src/game/localization/releaseTranslations.ts");
const outputPath = path.join(root, "src/game/localization/generatedReleaseTranslations.json");
const locales = ["es", "pt-BR", "de", "fr", "ja", "ko"];
const googleLocales = { "pt-BR": "pt" };

function findObject(file, variableName) {
  let found;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === variableName && ts.isObjectLiteralExpression(node.initializer)) {
      found = node.initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return found;
}

function parseFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
}

const catalog = findObject(parseFile(catalogPath), "dict");
const curated = findObject(parseFile(curatedPath), "translations");
if (!catalog || !curated) throw new Error("Localization source objects could not be parsed.");

const curatedKeys = new Set(curated.properties.filter(ts.isPropertyAssignment).map((property) => property.name.text));
const english = [];
for (const property of catalog.properties) {
  if (!ts.isPropertyAssignment(property) || curatedKeys.has(property.name.text) || !ts.isObjectLiteralExpression(property.initializer)) continue;
  const en = property.initializer.properties.find((entry) => ts.isPropertyAssignment(entry) && entry.name.text === "en");
  if (en && ts.isPropertyAssignment(en) && ts.isStringLiteralLike(en.initializer)) {
    english.push([property.name.text, en.initializer.text]);
  }
}

function makeChunks(entries) {
  const chunks = [];
  let chunk = [];
  let size = 0;
  for (const entry of entries) {
    const nextSize = entry[1].length + 18;
    if (chunk.length > 0 && (chunk.length >= 8 || size + nextSize > 1800)) {
      chunks.push(chunk);
      chunk = [];
      size = 0;
    }
    chunk.push(entry);
    size += nextSize;
  }
  if (chunk.length > 0) chunks.push(chunk);
  return chunks;
}

async function translateChunk(locale, chunk, attempt = 1) {
  const marked = chunk.map(([, value], index) => `[[MT${String(index).padStart(3, "0")}]] ${value}`).join("\n");
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", googleLocales[locale] ?? locale);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", marked);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "MonkeyTribe-Localization-Audit/1.0" },
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const joined = data[0].map((segment) => segment[0]).join("").replace(/[\u200b\u200e\u200f]/g, "");
    const values = new Map();
    const pattern = /\[\[MT(\d{3})\]\]\s*([\s\S]*?)(?=\n?\[\[MT\d{3}\]\]|$)/g;
    for (const match of joined.matchAll(pattern)) values.set(Number(match[1]), match[2].trim());
    if (values.size !== chunk.length) {
      if (chunk.length === 1) {
        console.warn(`${locale}: kept English source for ${chunk[0]?.[0]} because the translated row was empty`);
        return chunk;
      }
      const middle = Math.ceil(chunk.length / 2);
      return [
        ...(await translateChunk(locale, chunk.slice(0, middle))),
        ...(await translateChunk(locale, chunk.slice(middle)))
      ];
    }
    return chunk.map(([key], index) => [key, values.get(index)]);
  } catch (error) {
    if (attempt >= 3) {
      console.warn(`${locale}: kept ${chunk.length} English source row(s) after repeated translation failure`);
      return chunk;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    return translateChunk(locale, chunk, attempt + 1);
  }
}

const output = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : {};
for (const locale of locales) {
  output[locale] ??= {};
  const pending = english.filter(([key]) => !output[locale][key]);
  const chunks = makeChunks(pending);
  console.log(`${locale}: translating ${pending.length} strings in ${chunks.length} batches`);
  let cursor = 0;
  let completed = 0;
  async function worker() {
    while (cursor < chunks.length) {
      const index = cursor;
      cursor += 1;
      const chunk = chunks[index];
      if (!chunk) continue;
      const values = await translateChunk(locale, chunk);
      for (const [key, value] of values) output[locale][key] = value;
      completed += 1;
      fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
      console.log(`${locale}: ${completed}/${chunks.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, chunks.length) }, () => worker()));
}

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
