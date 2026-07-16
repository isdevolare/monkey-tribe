import { createContext, useContext } from "react";

export type StoreKitCatalogState = "connecting" | "loading" | "ready" | "unavailable";

export type StoreKitProduct = {
  id: string;
  displayPrice: string;
  currency: string;
};

export type StoreKitNotice = {
  id: number;
  kind: "success" | "cancelled" | "pending" | "error" | "delivery-pending";
  gems?: number;
};

export type StoreKitContextValue = {
  catalogState: StoreKitCatalogState;
  productsById: Readonly<Record<string, StoreKitProduct>>;
  purchasingProductId: string | null;
  notice: StoreKitNotice | null;
  requestGemPurchase: (productId: string) => Promise<void>;
  dismissNotice: () => void;
};

export const StoreKitContext = createContext<StoreKitContextValue | null>(null);

export function useStoreKit() {
  const value = useContext(StoreKitContext);
  if (!value) {
    throw new Error("useStoreKit must be used inside StoreKitProvider");
  }
  return value;
}
