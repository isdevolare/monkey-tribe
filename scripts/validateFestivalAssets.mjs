import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const unitDir = join(root, "assets/game/units");
const profileSource = readFileSync(join(root, "src/game/config/profileMonkeys.ts"), "utf8");
const assetSource = readFileSync(join(root, "src/game/assets/gameAssets.ts"), "utf8");

const festival = [
  ["skin_worker_festival", "festivalWorker", "festival_worker.png"],
  ["skin_worker_sun_parade", "sunParadeWorker", "sun_parade_worker.png"],
  ["skin_worker_watermelon_feast", "watermelonFeastWorker", "watermelon_feast_worker.png"],
  ["skin_worker_banana_dj", "festivalBananaDj", "festival_banana_dj.png"],
  ["skin_scout_fire_dancer", "festivalFireDancer", "festival_fire_dancer.png"],
  ["skin_warrior_beach", "festivalBeachWarrior", "festival_beach_warrior.png"],
  ["skin_hunter_tropical_archer", "festivalTropicalArcher", "festival_tropical_archer.png"],
  ["skin_chief_sunset", "festivalSunsetChief", "festival_sunset_chief.png"],
  ["skin_scout_fire_monkey", "festivalFireMonkey", "festival_fire_monkey.png"],
  ["skin_king_golden_festival", "festivalGoldenKing", "festival_golden_festival_king.png"]
];

function walkPngs(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walkPngs(path) : name.endsWith(".png") ? [path] : [];
  });
}

function hash(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const allPngs = walkPngs(join(root, "assets/game"));
const allHashes = new Map();
for (const path of allPngs) {
  const digest = hash(path);
  allHashes.set(digest, [...(allHashes.get(digest) ?? []), path]);
}

const report = festival.map(([skinId, assetKey, filename]) => {
  const path = join(unitDir, filename);
  const png = readFileSync(path);
  const digest = hash(path);
  const sameContent = (allHashes.get(digest) ?? []).filter((entry) => entry !== path);
  const registryPattern = new RegExp(`${assetKey}: \\{[\\s\\S]*?require\\(\"\\.\\.\\/\\.\\.\\/\\.\\.\\/assets/game/units/${filename}\"\\)`, "m");
  if (!registryPattern.test(assetSource)) throw new Error(`${assetKey} is not registered to ${filename}.`);
  const profileOccurrences = profileSource.split(`"${assetKey}"`).length - 1;
  if (profileOccurrences !== 1) throw new Error(`${assetKey} has ${profileOccurrences} profile mappings.`);
  if (png.readUInt32BE(0) !== 0x89504e47 || png[25] !== 6) throw new Error(`${filename} is not an RGBA PNG.`);
  if (sameContent.length > 0) throw new Error(`${filename} duplicates ${sameContent.join(", ")}.`);
  return {
    skinId,
    assetKey,
    resolvedPath: path.replace(`${root}/`, ""),
    dimensions: `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`,
    rgba: true,
    duplicateFestivalFile: false,
    duplicateNonFestivalFile: false,
    sha256: digest
  };
});

console.log(JSON.stringify({ festivalSkinCount: report.length, report }, null, 2));
