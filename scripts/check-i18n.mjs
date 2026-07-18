import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const catalogPath = path.join(root, "src/game/i18n.ts");
const releasePath = path.join(root, "src/game/localization/releaseTranslations.ts");
const localePolicyPath = path.join(root, "src/game/localization/locales.ts");
const source = fs.readFileSync(catalogPath, "utf8");
const sourceFile = ts.createSourceFile(catalogPath, source, ts.ScriptTarget.Latest, true);

function findObjectLiteral(file, variableName) {
  let result;
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(file) === variableName &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      result = node.initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return result;
}

function propertyName(property) {
  return ts.isStringLiteralLike(property.name) || ts.isIdentifier(property.name)
    ? property.name.text
    : property.name.getText();
}

function stringValue(property) {
  return ts.isPropertyAssignment(property) && ts.isStringLiteralLike(property.initializer)
    ? property.initializer.text
    : undefined;
}

function unwrapExpression(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function findArrayLiteral(file, variableName) {
  let result;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === variableName && node.initializer) {
      const initializer = unwrapExpression(node.initializer);
      if (ts.isArrayLiteralExpression(initializer)) result = initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return result;
}

const localePolicySource = fs.readFileSync(localePolicyPath, "utf8");
const localePolicyFile = ts.createSourceFile(localePolicyPath, localePolicySource, ts.ScriptTarget.Latest, true);
const localeDefinitions = findArrayLiteral(localePolicyFile, "LOCALE_DEFINITIONS");
if (!localeDefinitions) throw new Error("Could not find locale release policy.");

const localePolicy = localeDefinitions.elements.flatMap((element) => {
  const definition = unwrapExpression(element);
  if (!ts.isObjectLiteralExpression(definition)) return [];
  const values = new Map(
    definition.properties
      .filter(ts.isPropertyAssignment)
      .map((entry) => [propertyName(entry), stringValue(entry)])
  );
  return [{ id: values.get("id"), releaseStatus: values.get("releaseStatus") }];
});
const catalogLocales = localePolicy.map(({ id }) => id).filter(Boolean);
const activeReleaseLocales = localePolicy
  .filter(({ releaseStatus }) => releaseStatus === "enabled")
  .map(({ id }) => id)
  .filter(Boolean);
const disabledReleaseLocales = localePolicy
  .filter(({ releaseStatus }) => releaseStatus === "release-disabled")
  .map(({ id }) => id)
  .filter(Boolean);

const dictionary = findObjectLiteral(sourceFile, "dict");
if (!dictionary) throw new Error("Could not find the i18n dictionary.");

const keys = new Set();
const duplicates = [];
const empty = [];
const invalidEntries = [];
const englishPlaceholders = new Map();

for (const property of dictionary.properties) {
  if (!ts.isPropertyAssignment(property) || !ts.isObjectLiteralExpression(property.initializer)) continue;
  const key = propertyName(property);
  if (keys.has(key)) duplicates.push(key);
  keys.add(key);
  const values = new Map(
    property.initializer.properties
      .filter(ts.isPropertyAssignment)
      .map((entry) => [propertyName(entry), stringValue(entry)])
  );
  const en = values.get("en");
  const tr = values.get("tr");
  if (typeof en !== "string" || typeof tr !== "string") invalidEntries.push(key);
  if (en?.trim() === "") empty.push(`${key}:en`);
  if (tr?.trim() === "") empty.push(`${key}:tr`);
  englishPlaceholders.set(key, new Set(en?.match(/\{[a-zA-Z0-9_]+\}/g) ?? []));
}

const releaseSource = fs.readFileSync(releasePath, "utf8");
const releaseFile = ts.createSourceFile(releasePath, releaseSource, ts.ScriptTarget.Latest, true);
const releaseDictionary = findObjectLiteral(releaseFile, "translations");
if (!releaseDictionary) throw new Error("Could not find curated release translations.");

const extraReleaseKeys = [];
const invalidReleaseTuples = [];
const placeholderMismatches = [];
const curatedKeys = new Set();
for (const property of releaseDictionary.properties) {
  if (!ts.isPropertyAssignment(property) || !ts.isArrayLiteralExpression(property.initializer)) continue;
  const key = propertyName(property);
  curatedKeys.add(key);
  if (!keys.has(key)) extraReleaseKeys.push(key);
  const values = property.initializer.elements.map((element) => ts.isStringLiteralLike(element) ? element.text : undefined);
  if (values.length !== 6 || values.some((value) => !value?.trim())) invalidReleaseTuples.push(key);
  const expected = englishPlaceholders.get(key) ?? new Set();
  values.forEach((value, index) => {
    const actual = new Set(value?.match(/\{[a-zA-Z0-9_]+\}/g) ?? []);
    if ([...expected].some((item) => !actual.has(item)) || [...actual].some((item) => !expected.has(item))) {
      placeholderMismatches.push(`${key}:${["es", "pt-BR", "de", "fr", "ja", "ko"][index]}`);
    }
  });
}

const sourceFiles = [];
function collectFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(file);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) sourceFiles.push(file);
  }
}
collectFiles(path.join(root, "src"));

const hardcoded = [];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  const parsed = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = node.getText(parsed).replace(/\s+/g, " ").trim();
      if (value !== "Monkey Tribe" && /[A-Za-zÀ-ž\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]{3}/u.test(value)) {
        const line = parsed.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        hardcoded.push(`${path.relative(root, file)}:${line}: ${value}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
}

const curatedCount = releaseDictionary.properties.length;
const generated = JSON.parse(fs.readFileSync(path.join(root, "src/game/localization/generatedReleaseTranslations.json"), "utf8"));
const expectedActiveLocales = ["en", "tr", "es", "pt-BR"];
const expectedDisabledLocales = ["de", "fr", "ja", "ko"];
const localePolicyErrors = [];
if (JSON.stringify(activeReleaseLocales) !== JSON.stringify(expectedActiveLocales)) {
  localePolicyErrors.push(`active locales are ${activeReleaseLocales.join(", ")}`);
}
if (JSON.stringify(disabledReleaseLocales) !== JSON.stringify(expectedDisabledLocales)) {
  localePolicyErrors.push(`release-disabled locales are ${disabledReleaseLocales.join(", ")}`);
}

const appConfig = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const localizationPlugin = appConfig.expo?.plugins?.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "expo-localization"
);
for (const platform of ["ios", "android"]) {
  const nativeLocales = localizationPlugin?.[1]?.supportedLocales?.[platform] ?? [];
  if (JSON.stringify(nativeLocales) !== JSON.stringify(activeReleaseLocales)) {
    localePolicyErrors.push(`${platform} native locales are ${nativeLocales.join(", ")}`);
  }
}

const criticalPrefixes = [
  "settings.", "workerLodge.", "workerDispatch.", "raidmap.", "raid.",
  "shopHub.", "shop.", "gemStore.", "daily.", "quests.", "quest."
];
const criticalKeys = [...keys].filter((key) => criticalPrefixes.some((prefix) => key.startsWith(prefix)));
const missingCriticalTranslations = [];
for (const locale of activeReleaseLocales.filter((locale) => !["en", "tr"].includes(locale))) {
  for (const key of criticalKeys) {
    if (!curatedKeys.has(key) && !generated[locale]?.[key]?.trim()) {
      missingCriticalTranslations.push(`${locale}:${key}`);
    }
  }
}

console.log(`i18n keys: ${keys.size}`);
console.log(`catalog locales: ${catalogLocales.length} (${catalogLocales.join(", ")})`);
console.log(`v1.0 enabled locales: ${activeReleaseLocales.length} (${activeReleaseLocales.join(", ")})`);
console.log(`release-disabled locales: ${disabledReleaseLocales.length} (${disabledReleaseLocales.join(", ")})`);
console.log(`curated non-base translations: ${curatedCount} keys × 6 locales`);
for (const locale of ["es", "pt-BR", "de", "fr", "ja", "ko"]) {
  const generatedKeys = Object.keys(generated[locale] ?? {}).filter((key) => keys.has(key) && !curatedKeys.has(key));
  console.log(`${locale}: ${curatedCount + generatedKeys.length}/${keys.size} localized · ${Math.max(0, keys.size - curatedCount - generatedKeys.length)} English fallback`);
}
console.log(`critical active-locale keys: ${criticalKeys.length}`);
console.log(`hardcoded JSX text suspects: ${hardcoded.length}`);
for (const suspect of hardcoded.slice(0, 30)) console.log(`  ${suspect}`);
if (hardcoded.length > 30) console.log(`  …and ${hardcoded.length - 30} more`);

const failures = [
  ["duplicate keys", duplicates],
  ["invalid base entries", invalidEntries],
  ["empty values", empty],
  ["unknown curated keys", extraReleaseKeys],
  ["invalid curated tuples", invalidReleaseTuples],
  ["placeholder mismatches", placeholderMismatches],
  ["locale policy errors", localePolicyErrors],
  ["missing critical translations", missingCriticalTranslations]
].filter(([, values]) => values.length > 0);

if (failures.length > 0) {
  for (const [label, values] of failures) console.error(`${label}: ${values.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("i18n structural checks passed.");
}
