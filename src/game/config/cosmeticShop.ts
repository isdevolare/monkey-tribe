import {
  FESTIVAL_PROFILE_SKINS,
  SHOP_PROFILE_SKINS,
  type ProfileSkin
} from "./profileMonkeys";

export type CosmeticShopSection = "early_game" | "festival";

export const COSMETIC_SHOP_SECTIONS: readonly CosmeticShopSection[] = [
  "early_game",
  "festival"
];

/**
 * One catalog-owned grouping function drives the normalized shop. Festival
 * entries are presentation-only until the fragment flow is implemented.
 */
export function shopSkinsForSection(section: CosmeticShopSection): readonly ProfileSkin[] {
  return section === "early_game" ? SHOP_PROFILE_SKINS : FESTIVAL_PROFILE_SKINS;
}
