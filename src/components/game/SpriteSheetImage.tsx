import { useState, type ReactNode } from "react";
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { VISUAL_MODE } from "../../game/assets/gameAssets";

export type SpriteFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SpriteSheetImageProps = {
  source?: ImageSourcePropType;
  sheetWidth: number;
  sheetHeight: number;
  frame: SpriteFrame;
  style?: StyleProp<ViewStyle>;
  fallback: ReactNode;
};

export function SpriteSheetImage({
  source,
  sheetWidth,
  sheetHeight,
  frame,
  style,
  fallback
}: SpriteSheetImageProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [failed, setFailed] = useState(false);
  const useSprite = VISUAL_MODE === "assets" && source && !failed && size.width > 0 && size.height > 0;

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }

  const scale = Math.max(size.width / frame.width, size.height / frame.height);

  return (
    <View style={[styles.wrap, style]} onLayout={handleLayout}>
      {fallback}
      {useSprite ? (
        <Image
          source={source}
          resizeMode="stretch"
          onError={() => setFailed(true)}
          style={[
            styles.sheet,
            {
              width: sheetWidth * scale,
              height: sheetHeight * scale,
              left: -frame.x * scale + (size.width - frame.width * scale) / 2,
              top: -frame.y * scale + (size.height - frame.height * scale) / 2
            }
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden"
  },
  sheet: {
    position: "absolute"
  }
});
