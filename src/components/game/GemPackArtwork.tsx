import { memo, type ReactNode } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop
} from "react-native-svg";

/**
 * Dedicated vector artwork for each Gem package. Purely decorative jungle
 * treasure containers (pouch → chest → legendary hoard) that escalate in
 * richness with the pack size. No text lives inside the artwork, matching the
 * Monkey Tribe illustrated style with the game's green jungle gems. Each piece
 * is a self-contained circular emblem so it reads cleanly at small sizes.
 */
export type GemArtVariant =
  | "pouch_small"
  | "pouch_large"
  | "chest_wood"
  | "chest_gold"
  | "chest_royal"
  | "treasure_legendary";

const GEM_LIGHT = "#c9f9d3";
const GEM_MID = "#38c774";
const GEM_DARK = "#178048";
const GEM_SHINE = "#f2fff6";

function gemFacets(cx: number, cy: number, s: number) {
  const top = -s;
  const shoulder = -0.3 * s;
  const bottom = 0.92 * s;
  const half = 0.74 * s;
  const belt = 0.46 * s;
  return {
    body: `${cx},${cy + top} ${cx + half},${cy + shoulder} ${cx + belt},${cy + bottom} ${cx - belt},${cy + bottom} ${cx - half},${cy + shoulder}`,
    topFacet: `${cx},${cy + top} ${cx + half},${cy + shoulder} ${cx},${cy - 0.04 * s} ${cx - half},${cy + shoulder}`,
    rightFacet: `${cx},${cy - 0.04 * s} ${cx + half},${cy + shoulder} ${cx + belt},${cy + bottom}`,
    shine: `${cx - 0.22 * s},${cy + top + 0.2 * s} ${cx + 0.06 * s},${cy + top + 0.06 * s} ${cx - 0.06 * s},${cy + 0.22 * s}`
  };
}

function Gem({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const f = gemFacets(cx, cy, s);
  return (
    <G>
      <Polygon points={f.body} fill={GEM_MID} stroke={GEM_DARK} strokeWidth={0.6} />
      <Polygon points={f.topFacet} fill={GEM_LIGHT} />
      <Polygon points={f.rightFacet} fill={GEM_DARK} opacity={0.5} />
      <Polygon points={f.shine} fill={GEM_SHINE} opacity={0.9} />
    </G>
  );
}

function Sparkle({ cx, cy, r, color = "#fff7d6" }: { cx: number; cy: number; r: number; color?: string }) {
  return (
    <Polygon
      points={`${cx},${cy - r} ${cx + r * 0.26},${cy - r * 0.26} ${cx + r},${cy} ${cx + r * 0.26},${cy + r * 0.26} ${cx},${cy + r} ${cx - r * 0.26},${cy + r * 0.26} ${cx - r},${cy} ${cx - r * 0.26},${cy - r * 0.26}`}
      fill={color}
    />
  );
}

function Crown({ cx, cy, w }: { cx: number; cy: number; w: number }) {
  const h = w * 0.62;
  const half = w / 2;
  return (
    <G>
      <Polygon
        points={`${cx - half},${cy + h} ${cx - half},${cy} ${cx - half * 0.5},${cy + h * 0.5} ${cx},${cy - h * 0.25} ${cx + half * 0.5},${cy + h * 0.5} ${cx + half},${cy} ${cx + half},${cy + h}`}
        fill="#ffd76a"
        stroke="#a9761f"
        strokeWidth={0.9}
      />
      <Rect x={cx - half} y={cy + h - 1} width={w} height={2.4} rx={1.2} fill="#e0a838" />
      <Circle cx={cx - half} cy={cy} r={1.5} fill="#fff2c2" />
      <Circle cx={cx} cy={cy - h * 0.25} r={1.7} fill="#7bf0a0" stroke="#178048" strokeWidth={0.4} />
      <Circle cx={cx + half} cy={cy} r={1.5} fill="#fff2c2" />
    </G>
  );
}

/** Circular emblem backdrop shared by every pack. */
function Disc({ rim }: { rim: string }) {
  return (
    <G>
      <Circle cx={50} cy={50} r={47} fill="#333c22" />
      <Circle cx={50} cy={50} r={47} fill="none" stroke={rim} strokeWidth={1.4} opacity={0.5} />
      <Ellipse cx={50} cy={40} rx={40} ry={30} fill="#3f4a29" opacity={0.55} />
    </G>
  );
}

function Base({ children, rim }: { children: ReactNode; rim: string }) {
  return (
    <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 100 100">
      <Disc rim={rim} />
      {children}
    </Svg>
  );
}

function PouchArt({ large }: { large: boolean }) {
  return (
    <Base rim="#c9a15a">
      <Defs>
        <LinearGradient id={large ? "pouchLg" : "pouchSm"} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={large ? "#c88f4e" : "#b47f45"} />
          <Stop offset="1" stopColor={large ? "#6f4525" : "#653f20"} />
        </LinearGradient>
      </Defs>
      {/* gems behind / peeking above the neck */}
      <Gem cx={50} cy={large ? 28 : 32} s={large ? 9 : 8} />
      {large ? <Gem cx={39} cy={31} s={7} /> : null}
      {large ? <Gem cx={61} cy={31} s={7} /> : null}
      {!large ? <Gem cx={41} cy={35} s={5.5} /> : null}
      {/* sack body */}
      <Path
        d={large
          ? "M50 42 C25 42 21 64 26 80 C30 93 70 93 74 80 C79 64 75 42 50 42 Z"
          : "M50 47 C31 47 28 66 32 79 C35 91 65 91 68 79 C72 66 69 47 50 47 Z"}
        fill={`url(#${large ? "pouchLg" : "pouchSm"})`}
        stroke="#3d2812"
        strokeWidth={1.6}
      />
      {/* stitch highlight */}
      <Path
        d={large ? "M33 62 C40 73 60 73 67 62" : "M37 64 C43 72 57 72 63 64"}
        fill="none"
        stroke="#e7c485"
        strokeWidth={1.3}
        opacity={0.6}
      />
      {/* drawstring collar */}
      <Path
        d={large ? "M37 42 L34 31 L66 31 L63 42 Z" : "M40 47 L37 38 L63 38 L60 47 Z"}
        fill="#7c4f28"
        stroke="#3d2812"
        strokeWidth={1.3}
      />
      <Rect x={large ? 33 : 36} y={large ? 29 : 36} width={large ? 34 : 28} height={4.2} rx={2.1} fill="#d8b56a" />
      {large ? (
        <G>
          {/* gold emblem clasp on the sack */}
          <Circle cx={50} cy={66} r={8} fill="#e9c165" stroke="#a9761f" strokeWidth={1.2} />
          <Circle cx={50} cy={66} r={3.6} fill="#7bf0a0" stroke="#178048" strokeWidth={0.6} />
          <Gem cx={50} cy={40} s={6} />
        </G>
      ) : null}
      {/* a gem resting in front */}
      <Gem cx={large ? 40 : 42} cy={large ? 78 : 74} s={large ? 6 : 5} />
      {large ? <Gem cx={62} cy={80} s={5.5} /> : null}
      <Sparkle cx={large ? 68 : 66} cy={26} r={2.6} />
    </Base>
  );
}

function ChestArt({ tone }: { tone: "wood" | "gold" | "royal" }) {
  const bodyId = `chestBody_${tone}`;
  const lidId = `chestLid_${tone}`;
  const palette =
    tone === "wood"
      ? { rim: "#c9a15a", bodyTop: "#a5701f", bodyBot: "#6d4a16", lidTop: "#b98a34", lidBot: "#7c5720", band: "#f2d488", bandDark: "#b78f36", trim: "#ffe6a6" }
      : tone === "gold"
        ? { rim: "#ffe08a", bodyTop: "#f2c445", bodyBot: "#a9761f", lidTop: "#ffd76a", lidBot: "#c79433", band: "#fff2c2", bandDark: "#c79a34", trim: "#fff6d4" }
        : { rim: "#c79bff", bodyTop: "#7a46b8", bodyBot: "#43236f", lidTop: "#8a54c8", lidBot: "#4f2a7f", band: "#ffd76a", bandDark: "#c79a34", trim: "#ffe9a8" };
  return (
    <Base rim={palette.rim}>
      <Defs>
        <LinearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.bodyTop} />
          <Stop offset="1" stopColor={palette.bodyBot} />
        </LinearGradient>
        <LinearGradient id={lidId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.lidTop} />
          <Stop offset="1" stopColor={palette.lidBot} />
        </LinearGradient>
      </Defs>
      {/* gems spilling out above the open lid */}
      <Gem cx={31} cy={34} s={7.5} />
      <Gem cx={50} cy={27} s={10} />
      <Gem cx={69} cy={34} s={7.5} />
      <Gem cx={40} cy={40} s={5.5} />
      <Gem cx={60} cy={40} s={5.5} />
      {tone === "royal" ? <Crown cx={50} cy={20} w={22} /> : null}
      {/* chest body */}
      <Rect x={19} y={52} width={62} height={30} rx={5} fill={`url(#${bodyId})`} stroke="#2c1a0c" strokeWidth={1.8} />
      {/* open lid */}
      <Path d="M19 52 C19 35 81 35 81 52 Z" fill={`url(#${lidId})`} stroke="#2c1a0c" strokeWidth={1.8} />
      {/* gold bands + trim */}
      <Rect x={17} y={49} width={66} height={5.4} rx={2.7} fill={palette.band} stroke={palette.bandDark} strokeWidth={0.9} />
      <Rect x={44} y={39} width={12} height={43} rx={2.4} fill={palette.band} stroke={palette.bandDark} strokeWidth={0.9} />
      {/* corner bosses */}
      <Circle cx={23} cy={78} r={2.1} fill={palette.trim} stroke="#2c1a0c" strokeWidth={0.7} />
      <Circle cx={77} cy={78} r={2.1} fill={palette.trim} stroke="#2c1a0c" strokeWidth={0.7} />
      {/* latch */}
      <Rect x={45} y={55} width={10} height={12} rx={2.4} fill={palette.trim} stroke="#2c1a0c" strokeWidth={0.9} />
      <Circle cx={50} cy={61} r={1.8} fill="#2c1a0c" />
      {/* gems tumbling over the front */}
      <Gem cx={33} cy={58} s={6} />
      <Gem cx={67} cy={58} s={6} />
      <Sparkle cx={26} cy={30} r={3.2} />
      <Sparkle cx={76} cy={44} r={2.6} />
    </Base>
  );
}

function LegendaryArt() {
  return (
    <Base rim="#ffe08a">
      <Defs>
        <LinearGradient id="legBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffe08a" />
          <Stop offset="1" stopColor="#b87d1c" />
        </LinearGradient>
        <LinearGradient id="legLid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fff0b3" />
          <Stop offset="1" stopColor="#d0982f" />
        </LinearGradient>
        <LinearGradient id="legLeaf" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#57c765" />
          <Stop offset="1" stopColor="#1c7a3a" />
        </LinearGradient>
      </Defs>
      {/* jungle leaves fanning behind the chest */}
      <Path d="M20 66 C4 58 4 34 22 28 C24 44 32 54 37 62 Z" fill="url(#legLeaf)" stroke="#14532a" strokeWidth={1.1} />
      <Path d="M80 66 C96 58 96 34 78 28 C76 44 68 54 63 62 Z" fill="url(#legLeaf)" stroke="#14532a" strokeWidth={1.1} />
      <Path d="M50 20 C42 8 58 8 50 20 Z" fill="url(#legLeaf)" />
      {/* crown above */}
      <Crown cx={50} cy={16} w={24} />
      {/* overflowing gems */}
      <Gem cx={31} cy={38} s={8.5} />
      <Gem cx={50} cy={30} s={7} />
      <Gem cx={69} cy={38} s={8.5} />
      <Gem cx={40} cy={45} s={6} />
      <Gem cx={60} cy={45} s={6} />
      {/* ornate golden chest */}
      <Rect x={18} y={55} width={64} height={31} rx={6} fill="url(#legBody)" stroke="#7a4e12" strokeWidth={2} />
      <Path d="M18 55 C18 39 82 39 82 55 Z" fill="url(#legLid)" stroke="#7a4e12" strokeWidth={2} />
      <Rect x={16} y={52} width={68} height={6} rx={3} fill="#fff0b3" stroke="#c79a34" strokeWidth={1} />
      <Rect x={43} y={42} width={14} height={44} rx={2.8} fill="#fff0b3" stroke="#c79a34" strokeWidth={1} />
      <Rect x={45} y={60} width={10} height={13} rx={2.6} fill="#fff6d4" stroke="#7a4e12" strokeWidth={1} />
      <Circle cx={50} cy={67} r={1.9} fill="#7a4e12" />
      <Circle cx={22} cy={81} r={2.3} fill="#fff6d4" stroke="#7a4e12" strokeWidth={0.7} />
      <Circle cx={78} cy={81} r={2.3} fill="#fff6d4" stroke="#7a4e12" strokeWidth={0.7} />
      {/* radiance + sparkles */}
      <Ellipse cx={50} cy={40} rx={20} ry={12} fill="#a6f0c0" opacity={0.16} />
      <Sparkle cx={26} cy={44} r={3.2} />
      <Sparkle cx={74} cy={46} r={2.8} />
      <Sparkle cx={50} cy={52} r={3} />
    </Base>
  );
}

export const GemPackArtwork = memo(function GemPackArtwork({ variant }: { variant: GemArtVariant }) {
  switch (variant) {
    case "pouch_small":
      return <PouchArt large={false} />;
    case "pouch_large":
      return <PouchArt large />;
    case "chest_wood":
      return <ChestArt tone="wood" />;
    case "chest_gold":
      return <ChestArt tone="gold" />;
    case "chest_royal":
      return <ChestArt tone="royal" />;
    case "treasure_legendary":
      return <LegendaryArt />;
  }
});
