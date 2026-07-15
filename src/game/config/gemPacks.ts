export type GemPack = {
  id: string;
  usdPrice: number;
  gems: number;
  bonusPercent: number;
  platformProductId: string;
};

/**
 * Billing-ready product metadata. No platform purchase API is connected yet.
 * The $0.99 pack anchors at two launch Festival Chests; larger packs gain
 * steadily increasing value without granting gameplay-exclusive benefits.
 */
export const GEM_PACKS: readonly GemPack[] = [
  { id: "gem_pouch", usdPrice: 0.99, gems: 100, bonusPercent: 0, platformProductId: "monkeytribe.gems.100" },
  { id: "gem_bundle", usdPrice: 2.99, gems: 330, bonusPercent: 10, platformProductId: "monkeytribe.gems.330" },
  { id: "gem_crate", usdPrice: 4.99, gems: 600, bonusPercent: 20, platformProductId: "monkeytribe.gems.600" },
  { id: "gem_vault", usdPrice: 9.99, gems: 1_300, bonusPercent: 30, platformProductId: "monkeytribe.gems.1300" },
  { id: "gem_treasury", usdPrice: 19.99, gems: 2_800, bonusPercent: 40, platformProductId: "monkeytribe.gems.2800" },
  { id: "gem_hoard", usdPrice: 39.99, gems: 6_000, bonusPercent: 50, platformProductId: "monkeytribe.gems.6000" }
];
