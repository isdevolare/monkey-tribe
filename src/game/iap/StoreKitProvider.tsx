import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { StoreKitContext, type StoreKitNotice } from "./storeKitContext";

/** Non-iOS fallback. The iOS build resolves StoreKitProvider.ios.tsx instead. */
export function StoreKitProvider({ children }: PropsWithChildren) {
  const [notice, setNotice] = useState<StoreKitNotice | null>(null);
  const requestGemPurchase = useCallback(async () => {
    setNotice({ id: Date.now(), kind: "error" });
  }, []);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const value = useMemo(
    () => ({
      catalogState: "unavailable" as const,
      productsById: {},
      purchasingProductId: null,
      notice,
      requestGemPurchase,
      dismissNotice
    }),
    [dismissNotice, notice, requestGemPurchase]
  );

  return <StoreKitContext.Provider value={value}>{children}</StoreKitContext.Provider>;
}
