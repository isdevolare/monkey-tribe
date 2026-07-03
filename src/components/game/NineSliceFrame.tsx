import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Image as SvgImage } from "react-native-svg";
import { getGameAsset, type GameAssetKey } from "../../game/assets/gameAssets";

/**
 * Pure-RN 9-slice: corners render at a fixed size, edges stretch along one
 * axis, the center stretches both ways — so frame ornaments never deform.
 *
 * We deliberately avoid Image capInsets (inconsistent across iOS/Android/web).
 * Each of the 9 cells is an <Svg> whose viewBox crops the region straight out
 * of the single source PNG, so assets don't need to be split into 9 files.
 */

type SourceRect = { x: number; y: number; w: number; h: number };

type FramePreset = {
  assetKey: GameAssetKey;
  /** Intrinsic pixel size of the source PNG. */
  sourceW: number;
  sourceH: number;
  /** Region of the PNG holding the frame (skips baked glow/shadow margins). */
  frame: SourceRect;
  /** Corner square size inside `frame`, in source pixels. */
  cornerSrc: number;
};

// Measured from the shipped art (alpha-solid bounding boxes).
export const FRAME_PRESETS = {
  card: {
    assetKey: "uiCardBuilding",
    sourceW: 1024,
    sourceH: 1536,
    frame: { x: 68, y: 81, w: 918, h: 1210 },
    cornerSrc: 230
  },
  woodButton: {
    assetKey: "uiButtonWoodLarge",
    sourceW: 1536,
    sourceH: 1024,
    frame: { x: 75, y: 278, w: 1392, h: 419 },
    cornerSrc: 175
  },
  attackPlaque: {
    assetKey: "uiButtonAttack",
    sourceW: 1536,
    sourceH: 1024,
    frame: { x: 105, y: 316, w: 1334, h: 509 },
    cornerSrc: 170
  },
  raidPlaque: {
    assetKey: "uiButtonRaid",
    sourceW: 1536,
    sourceH: 1024,
    frame: { x: 80, y: 199, w: 1391, h: 475 },
    cornerSrc: 175
  }
} satisfies Record<string, FramePreset>;

export type FramePresetName = keyof typeof FRAME_PRESETS;

type NineSliceFrameProps = {
  preset: FramePresetName;
  /** Rendered corner size in dp. */
  cornerSize: number;
  /** Outer sizing — pass StyleSheet.absoluteFill to use as a background. */
  style?: StyleProp<ViewStyle>;
};

function Cell({
  preset,
  rect,
  cellStyle
}: {
  preset: FramePreset;
  rect: SourceRect;
  cellStyle: ViewStyle;
}) {
  const asset = getGameAsset(preset.assetKey);
  const href = asset.source ?? { uri: asset.uri };

  return (
    <View style={[cellStyle, styles.cell]} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox={`${rect.x} ${rect.y} ${rect.w} ${rect.h}`}
        preserveAspectRatio="none"
      >
        <SvgImage
          x={0}
          y={0}
          width={preset.sourceW}
          height={preset.sourceH}
          href={href}
          preserveAspectRatio="none"
        />
      </Svg>
    </View>
  );
}

export function NineSliceFrame({ preset: presetName, cornerSize, style }: NineSliceFrameProps) {
  const preset = FRAME_PRESETS[presetName];
  const { frame, cornerSrc } = preset;

  // Clamp so tiny targets or wide corners can't make regions overlap.
  const cs = Math.min(cornerSrc, frame.w / 2.5, frame.h / 2.5);
  const left = frame.x;
  const top = frame.y;
  const right = frame.x + frame.w - cs;
  const bottom = frame.y + frame.h - cs;
  const midX = frame.x + cs;
  const midY = frame.y + cs;
  const midW = frame.w - cs * 2;
  const midH = frame.h - cs * 2;

  const corner = { width: cornerSize, height: cornerSize } as const;

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <View style={[styles.row, { height: cornerSize }]}>
        <Cell preset={preset} rect={{ x: left, y: top, w: cs, h: cs }} cellStyle={corner} />
        <Cell preset={preset} rect={{ x: midX, y: top, w: midW, h: cs }} cellStyle={styles.flexCell} />
        <Cell preset={preset} rect={{ x: right, y: top, w: cs, h: cs }} cellStyle={corner} />
      </View>
      <View style={[styles.row, styles.flexCell]}>
        <Cell preset={preset} rect={{ x: left, y: midY, w: cs, h: midH }} cellStyle={{ width: cornerSize }} />
        <Cell preset={preset} rect={{ x: midX, y: midY, w: midW, h: midH }} cellStyle={styles.flexCell} />
        <Cell preset={preset} rect={{ x: right, y: midY, w: cs, h: midH }} cellStyle={{ width: cornerSize }} />
      </View>
      <View style={[styles.row, { height: cornerSize }]}>
        <Cell preset={preset} rect={{ x: left, y: bottom, w: cs, h: cs }} cellStyle={corner} />
        <Cell preset={preset} rect={{ x: midX, y: bottom, w: midW, h: cs }} cellStyle={styles.flexCell} />
        <Cell preset={preset} rect={{ x: right, y: bottom, w: cs, h: cs }} cellStyle={corner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "column"
  },
  row: {
    flexDirection: "row"
  },
  flexCell: {
    flex: 1
  },
  cell: {
    overflow: "hidden"
  }
});
