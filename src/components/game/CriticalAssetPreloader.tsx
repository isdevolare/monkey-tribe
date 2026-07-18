import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import {
  areGameAssetsSettled,
  isGameAssetDecoded,
  isGameAssetFailed,
  markGameAssetDecoded,
  markGameAssetFailed
} from "../../game/assets/assetCache";
import { getGameAsset, type GameAssetKey } from "../../game/assets/gameAssets";
import { preloadGameAssets } from "./AssetImage";

export function CriticalAssetPreloader({
  assetKeys,
  timeoutMs = 4500,
  onReady
}: {
  assetKeys: readonly GameAssetKey[];
  timeoutMs?: number;
  onReady: () => void;
}) {
  const uniqueKeys = useMemo(() => [...new Set(assetKeys)], [assetKeys]);
  const signature = uniqueKeys.join("|");
  const [revision, setRevision] = useState(0);
  const readySignature = useRef<string | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const unresolved = uniqueKeys.filter(
    (assetKey) => !isGameAssetDecoded(assetKey) && !isGameAssetFailed(assetKey)
  );

  const settle = useCallback((assetKey: GameAssetKey, succeeded: boolean) => {
    if (succeeded) markGameAssetDecoded(assetKey);
    else {
      markGameAssetFailed(assetKey);
      console.warn(`[assets] Failed to decode critical asset: ${assetKey}`);
    }
    setRevision((current) => current + 1);
  }, []);

  useEffect(() => {
    void preloadGameAssets(uniqueKeys);
  }, [signature]);

  useEffect(() => {
    const missingSources = unresolved.filter((assetKey) => !getGameAsset(assetKey).source);
    if (missingSources.length === 0) return;
    for (const assetKey of missingSources) markGameAssetFailed(assetKey);
    console.warn(`[assets] Critical assets have no bundled source: ${missingSources.join(", ")}`);
    setRevision((current) => current + 1);
  }, [signature, revision]);

  useEffect(() => {
    if (!areGameAssetsSettled(uniqueKeys) || readySignature.current === signature) return;
    readySignature.current = signature;
    onReadyRef.current();
  }, [revision, signature]);

  useEffect(() => {
    if (areGameAssetsSettled(uniqueKeys)) return;
    const timer = setTimeout(() => {
      const timedOut = uniqueKeys.filter(
        (assetKey) => !isGameAssetDecoded(assetKey) && !isGameAssetFailed(assetKey)
      );
      if (timedOut.length === 0) return;
      for (const assetKey of timedOut) markGameAssetFailed(assetKey);
      console.warn(`[assets] Critical asset decode timeout; using controlled fallbacks: ${timedOut.join(", ")}`);
      setRevision((current) => current + 1);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [signature, timeoutMs]);

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.host}>
      {unresolved.map((assetKey) => {
        const source = getGameAsset(assetKey).source;
        return source ? (
          <Image
            key={assetKey}
            source={source}
            resizeMode="contain"
            style={styles.image}
            onLoad={() => settle(assetKey, true)}
            onError={() => settle(assetKey, false)}
          />
        ) : null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: -4,
    top: -4,
    width: 2,
    height: 2,
    opacity: 0,
    overflow: "hidden"
  },
  image: { width: 2, height: 2 }
});
