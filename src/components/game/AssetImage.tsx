import { type ReactNode, useState } from "react";
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import { getGameAsset, type GameAssetKey, VISUAL_MODE } from "../../game/assets/gameAssets";

const preloadedAssetUris = new Set<string>();

/** Warm React Native's image cache for bundled artwork before a modal needs it. */
export function preloadGameAssets(assetKeys: readonly GameAssetKey[]) {
  for (const assetKey of assetKeys) {
    const source = getGameAsset(assetKey).source;
    if (!source) continue;
    const uri = Image.resolveAssetSource(source)?.uri;
    if (!uri || preloadedAssetUris.has(uri)) continue;
    preloadedAssetUris.add(uri);
    void Image.prefetch(uri).catch(() => preloadedAssetUris.delete(uri));
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
  onLoad,
  onError
}: AssetImageProps) {
  const asset = getGameAsset(assetKey);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const useImage = VISUAL_MODE === "assets" && !failed;
  const showFallback = !(hideFallbackOnLoad && useImage && loaded);

  return (
    <View style={[styles.wrap, style]}>
      {showFallback ? fallback : null}
      {useImage ? (
        <Image
          source={asset.source ?? { uri: asset.uri }}
          resizeMode={resizeMode}
          onError={() => {
            setFailed(true);
            onError?.();
          }}
          onLoad={() => {
            setLoaded(true);
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
