import { Asset } from "expo-asset";
import { type ReactNode, useState } from "react";
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import {
  isGameAssetDecoded,
  isGameAssetFailed,
  markGameAssetDecoded,
  markGameAssetFailed
} from "../../game/assets/assetCache";
import { getGameAsset, type GameAssetKey, VISUAL_MODE } from "../../game/assets/gameAssets";

const preloadedAssetUris = new Set<string>();

/** Warm React Native's image cache for bundled artwork before a modal needs it. */
export async function preloadGameAssets(assetKeys: readonly GameAssetKey[]) {
  const pendingModules: number[] = [];
  const pendingUris: string[] = [];
  for (const assetKey of new Set(assetKeys)) {
    const source = getGameAsset(assetKey).source;
    if (!source) continue;
    const uri = Image.resolveAssetSource(source)?.uri;
    if (!uri || preloadedAssetUris.has(uri)) continue;
    preloadedAssetUris.add(uri);
    pendingUris.push(uri);
    if (typeof source === "number") pendingModules.push(source);
  }
  if (pendingUris.length === 0) return;
  try {
    const assets = pendingModules.length > 0 ? await Asset.loadAsync(pendingModules) : [];
    await Promise.allSettled([
      ...pendingUris.map((uri) => Image.prefetch(uri)),
      ...assets.map((asset) => Image.prefetch(asset.localUri ?? asset.uri))
    ]);
  } catch (error) {
    if (__DEV__) console.warn("[assets] Prefetch warm-up failed; mounted decode gate will retry.", error);
  }
}

type AssetImageProps = {
  assetKey: GameAssetKey;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  fallback: ReactNode;
  /**
   * Unmount the fallback once the image has loaded. Use when the art has
   * transparent regions the fallback would otherwise bleed through.
   */
  hideFallbackOnLoad?: boolean;
  fallbackAssetKey?: GameAssetKey;
  onLoad?: () => void;
  onError?: () => void;
};

export function AssetImage({
  assetKey,
  style,
  imageStyle,
  resizeMode = "contain",
  fallback,
  hideFallbackOnLoad = false,
  fallbackAssetKey,
  onLoad,
  onError
}: AssetImageProps) {
  const asset = getGameAsset(assetKey);
  const [loadedKey, setLoadedKey] = useState<GameAssetKey | null>(null);
  const [failedKey, setFailedKey] = useState<GameAssetKey | null>(null);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const loaded = loadedKey === assetKey || isGameAssetDecoded(assetKey);
  const failed = failedKey === assetKey || isGameAssetFailed(assetKey);
  const useImage = VISUAL_MODE === "assets" && !failed;
  const useControlledFallback = failed && fallbackAssetKey != null && !fallbackFailed;
  const showFallback =
    (failed && (!fallbackAssetKey || fallbackFailed)) ||
    (__DEV__ && !loaded && !hideFallbackOnLoad);

  return (
    <View style={[styles.wrap, style]}>
      {showFallback ? fallback : null}
      {useControlledFallback ? (
        <Image
          source={getGameAsset(fallbackAssetKey).source ?? { uri: getGameAsset(fallbackAssetKey).uri }}
          resizeMode={resizeMode}
          onLoad={() => markGameAssetDecoded(fallbackAssetKey)}
          onError={() => setFallbackFailed(true)}
          style={[styles.image, imageStyle]}
        />
      ) : null}
      {useImage ? (
        <Image
          source={asset.source ?? { uri: asset.uri }}
          resizeMode={resizeMode}
          onError={() => {
            setFailedKey(assetKey);
            markGameAssetFailed(assetKey);
            onError?.();
          }}
          onLoad={() => {
            setLoadedKey(assetKey);
            markGameAssetDecoded(assetKey);
            onLoad?.();
          }}
          style={[styles.image, imageStyle]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "hidden"
  },
  image: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%"
  }
});
