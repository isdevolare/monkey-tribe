import type { GameAssetKey } from "../assets/gameAssets";
import type { RoyalPalaceSlotId } from "../types/game";

export const ROYAL_PALACE_LEVEL_ASSETS = [
  "royalPalaceLevel0",
  "royalPalaceLevel1",
  "royalPalaceLevel2",
  "royalPalaceLevel3",
  "royalPalaceLevel4",
  "royalPalaceLevel5",
  "royalPalaceLevel6"
] as const satisfies readonly GameAssetKey[];

export function royalPalaceAsset(level: number): GameAssetKey {
  return ROYAL_PALACE_LEVEL_ASSETS[Math.max(0, Math.min(6, Math.floor(level)))] ?? ROYAL_PALACE_LEVEL_ASSETS[0];
}

export type RoyalPalaceResidentMotion = "walk" | "look" | "guard" | "turn" | "chief" | "king";

export type RoyalPalaceResidentSpot = {
  left: number;
  top: number;
  size: number;
  motion: RoyalPalaceResidentMotion;
};

/** Positions are shared by the village sprite and modal preview. */
export const ROYAL_PALACE_RESIDENT_SPOTS: Readonly<Record<RoyalPalaceSlotId, RoyalPalaceResidentSpot>> = {
  palaceGarden: { left: 11, top: 57, size: 20, motion: "walk" },
  scoutPath: { left: 17, top: 23, size: 18, motion: "look" },
  guardGate: { left: 73, top: 62, size: 20, motion: "guard" },
  hunterTerrace: { left: 77, top: 23, size: 18, motion: "turn" },
  royalCourt: { left: 41, top: 53, size: 21, motion: "chief" },
  goldenThrone: { left: 43, top: 27, size: 22, motion: "king" }
};
