import type { GameAssetKey } from "../assets/gameAssets";

export type ClanHallVisualStage = 1 | 2 | 3;

export function clanHallVisualStage(level: number): ClanHallVisualStage {
  if (level >= 9) return 3;
  if (level >= 5) return 2;
  return 1;
}

const CLAN_HALL_STAGE_ASSETS: Readonly<Record<ClanHallVisualStage, GameAssetKey>> = {
  1: "clanHallStage1",
  2: "clanHallStage2",
  3: "clanHallStage3"
};

export function clanHallAsset(level: number): GameAssetKey {
  return CLAN_HALL_STAGE_ASSETS[clanHallVisualStage(level)];
}
