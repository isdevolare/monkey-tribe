export type GemPack = {
  id: string;
  /**
   * Development/reference price only. NOT the production source of truth.
   * When StoreKit / Google Play Billing is connected, the store-provided
   * localized price must replace this value at display and checkout time.
   */
  referenceUsdPrice: number;
  gems: number;
  bonusPercent: number;
  /** Stable IAP product identifier used to fetch the real localized price. */
  platformProductId: string;
};

/**
 * Billing-ready product metadata. No platform purchase API is connected yet,
 * and no consumable is granted locally. Product IDs are frozen so a future IAP
 * integration can map them directly to StoreKit / Google Play products.
 *
 * The $0.99 pack anchors at two launch Festival Chests; larger packs gain
 * steadily increasing value without granting gameplay-exclusive benefits.
 */
export const GEM_PACKS: readonly GemPack[] = [
  { id: "gem_pouch", referenceUsdPrice: 0.99, gems: 100, bonusPercent: 0, platformProductId: "monkeytribe_gems_100" },
  { id: "gem_bundle", referenceUsdPrice: 2.99, gems: 330, bonusPercent: 10, platformProductId: "monkeytribe_gems_330" },
  { id: "gem_crate", referenceUsdPrice: 4.99, gems: 600, bonusPercent: 20, platformProductId: "monkeytribe_gems_600" },
  { id: "gem_vault", referenceUsdPrice: 9.99, gems: 1_300, bonusPercent: 30, platformProductId: "monkeytribe_gems_1300" },
  { id: "gem_treasury", referenceUsdPrice: 19.99, gems: 2_800, bonusPercent: 40, platformProductId: "monkeytribe_gems_2800" },
  { id: "gem_hoard", referenceUsdPrice: 39.99, gems: 6_000, bonusPercent: 50, platformProductId: "monkeytribe_gems_6000" }
];
