import type { GameAssetKey } from "../assets/gameAssets";
import type { RoyalPalaceSlotId } from "../types/game";

export const ROYAL_PALACE_LEVEL_ASSETS = [
  "royalPalaceLevel0",
  "royalPalaceLevel2",
  "royalPalaceLevel4",
  "royalPalaceLevel6"
] as const satisfies readonly GameAssetKey[];

export function royalPalaceAsset(level: number): GameAssetKey {
  return ROYAL_PALACE_LEVEL_ASSETS[Math.max(0, Math.min(3, Math.floor(level)))] ?? ROYAL_PALACE_LEVEL_ASSETS[0];
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
  palaceGarden: { left: 8, top: 55, size: 28, motion: "walk" },
  scoutPath: { left: 14, top: 20, size: 25, motion: "look" },
  guardGate: { left: 70, top: 59, size: 28, motion: "guard" },
  hunterTerrace: { left: 74, top: 20, size: 25, motion: "turn" },
  royalCourt: { left: 38, top: 51, size: 29, motion: "chief" },
  goldenThrone: { left: 40, top: 24, size: 30, motion: "king" }
};
