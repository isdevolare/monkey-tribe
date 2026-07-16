import {
  ErrorCode,
  getPendingTransactionsIOS,
  isTransactionVerifiedIOS,
  useIAP,
  type Product,
  type Purchase,
  type PurchaseError
} from "expo-iap";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import { GEM_PRODUCT_IDS, getGemPackByProductId } from "../config/gemPacks";
import { deliverStoreKitGemPurchase } from "../state/gameStore";
import {
  StoreKitContext,
  type StoreKitCatalogState,
  type StoreKitNotice,
  type StoreKitProduct
} from "./storeKitContext";

function transactionIdOf(purchase: Purchase) {
  return purchase.transactionId ?? purchase.id;
}

function isKnownProduct(productId: string) {
  return GEM_PRODUCT_IDS.includes(productId);
}

function purchaseErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code);
  }
  return ErrorCode.Unknown;
}

export function StoreKitProvider({ children }: PropsWithChildren) {
  const [catalogState, setCatalogState] = useState<StoreKitCatalogState>("connecting");
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [notice, setNotice] = useState<StoreKitNotice | null>(null);
  const requestedProductRef = useRef<string | null>(null);
  const processPurchaseRef = useRef<(purchase: Purchase) => Promise<void>>(async () => undefined);
  const processingTransactionsRef = useRef(new Set<string>());
  const recoveryStartedRef = useRef(false);

  const showNotice = useCallback((kind: StoreKitNotice["kind"], gems?: number) => {
    setNotice({ id: Date.now(), kind, gems });
  }, []);

  const handlePurchaseError = useCallback(
    (error: PurchaseError | unknown) => {
      const code = purchaseErrorCode(error);
      requestedProductRef.current = null;
      setPurchasingProductId(null);
      if (code === ErrorCode.UserCancelled) {
        showNotice("cancelled");
        return;
      }
      if (code === ErrorCode.Pending || code === ErrorCode.DeferredPayment) {
        showNotice("pending");
        return;
      }
      showNotice("error");
    },
    [showNotice]
  );

  const handlePurchaseSuccess = useCallback((purchase: Purchase) => {
    void processPurchaseRef.current(purchase);
  }, []);

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction
  } = useIAP({
    onPurchaseSuccess: handlePurchaseSuccess,
    onPurchaseError: handlePurchaseError,
    onError: () => setCatalogState("unavailable")
  });

  const processPurchase = useCallback(
    async (purchase: Purchase) => {
      const productId = purchase.productId;
      const pack = getGemPackByProductId(productId);
      const transactionId = transactionIdOf(purchase);
      if (!pack || !transactionId || purchase.purchaseState !== "purchased") {
        requestedProductRef.current = null;
        setPurchasingProductId(null);
        showNotice(purchase.purchaseState === "pending" ? "pending" : "delivery-pending");
        return;
      }
      if (processingTransactionsRef.current.has(transactionId)) return;
      processingTransactionsRef.current.add(transactionId);

      try {
        const verified = await isTransactionVerifiedIOS(productId);
        if (!verified) {
          showNotice("delivery-pending");
          return;
        }

        const delivery = await deliverStoreKitGemPurchase(transactionId, productId);
        if (delivery.status === "unknown-product") {
          showNotice("delivery-pending");
          return;
        }

        try {
          await finishTransaction({ purchase, isConsumable: true });
        } catch {
          // The grant and ledger are already durable. StoreKit will replay this
          // unfinished transaction, and the idempotent path will finish it later.
          showNotice("delivery-pending", pack.gems);
          return;
        }

        if (delivery.status === "delivered") {
          showNotice("success", pack.gems);
        }
      } catch {
        // Do not finish: a verified paid transaction remains recoverable on the
        // next connection until both persistence and fulfillment succeed.
        showNotice("delivery-pending");
      } finally {
        processingTransactionsRef.current.delete(transactionId);
        if (requestedProductRef.current === productId) {
          requestedProductRef.current = null;
          setPurchasingProductId(null);
        }
      }
    },
    [finishTransaction, showNotice]
  );

  processPurchaseRef.current = processPurchase;

  useEffect(() => {
    if (!connected || recoveryStartedRef.current) return;
    recoveryStartedRef.current = true;
    let active = true;

    void (async () => {
      setCatalogState("loading");
      try {
        await fetchProducts({ skus: [...GEM_PRODUCT_IDS], type: "in-app" });
        if (active) setCatalogState("ready");
      } catch {
        if (active) setCatalogState("unavailable");
      }

      try {
        const unfinished = await getPendingTransactionsIOS();
        for (const purchase of unfinished) {
          if (!active) break;
          if (isKnownProduct(purchase.productId)) {
            await processPurchaseRef.current(purchase);
          }
        }
      } catch {
        if (active) showNotice("delivery-pending");
      }
    })();

    return () => {
      active = false;
    };
  }, [connected, fetchProducts, showNotice]);

  useEffect(() => {
    if (!connected && catalogState === "ready") {
      recoveryStartedRef.current = false;
      setCatalogState("connecting");
    }
  }, [catalogState, connected]);

  const productsById = useMemo(() => {
    const result: Record<string, StoreKitProduct> = {};
    for (const product of products as Product[]) {
      if (!isKnownProduct(product.id)) continue;
      result[product.id] = {
        id: product.id,
        displayPrice: product.displayPrice,
        currency: product.currency
      };
    }
    return result;
  }, [products]);

  const requestGemPurchase = useCallback(
    async (productId: string) => {
      if (
        catalogState !== "ready" ||
        !productsById[productId] ||
        purchasingProductId !== null
      ) {
        showNotice("error");
        return;
      }

      requestedProductRef.current = productId;
      setPurchasingProductId(productId);
      setNotice(null);
      try {
        await requestPurchase({
          request: { apple: { sku: productId } },
          type: "in-app"
        });
      } catch (error) {
        handlePurchaseError(error);
      }
    },
    [catalogState, handlePurchaseError, productsById, purchasingProductId, requestPurchase, showNotice]
  );

  const dismissNotice = useCallback(() => setNotice(null), []);
  const value = useMemo(
    () => ({
      catalogState,
      productsById,
      purchasingProductId,
      notice,
      requestGemPurchase,
      dismissNotice
    }),
    [catalogState, dismissNotice, notice, productsById, purchasingProductId, requestGemPurchase]
  );

  return <StoreKitContext.Provider value={value}>{children}</StoreKitContext.Provider>;
}
