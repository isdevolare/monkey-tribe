import { type ReactNode, useState } from "react";
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import { getGameAsset, type GameAssetKey, VISUAL_MODE } from "../../game/assets/gameAssets";

type AssetImageProps = {
  assetKey: GameAssetKey;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  fallback: ReactNode;
};

export function AssetImage({
  assetKey,
  style,
  imageStyle,
  resizeMode = "contain",
  fallback
}: AssetImageProps) {
  const asset = getGameAsset(assetKey);
  const [failed, setFailed] = useState(false);
  const useImage = VISUAL_MODE === "assets" && !failed;

  return (
    <View style={[styles.wrap, style]}>
      {fallback}
      {useImage ? (
        <Image
          source={asset.source ?? { uri: asset.uri }}
          resizeMode={resizeMode}
          onError={() => setFailed(true)}
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
