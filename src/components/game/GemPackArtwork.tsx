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
 * Monkey Tribe illustrated style with the game's green jungle gems.
 */
export type GemArtVariant =
  | "pouch_small"
  | "pouch_large"
  | "chest_wood"
  | "chest_gold"
  | "chest_royal"
  | "treasure_legendary";

const GEM_LIGHT = "#c4f7cf";
const GEM_MID = "#37c473";
const GEM_DARK = "#1a7a45";
const GEM_SHINE = "#f0fff5";

function gemFacets(cx: number, cy: number, s: number) {
  const top = -s;
  const shoulder = -0.28 * s;
  const bottom = 0.9 * s;
  const half = 0.72 * s;
  const belt = 0.45 * s;
  return {
    body: `${cx},${cy + top} ${cx + half},${cy + shoulder} ${cx + belt},${cy + bottom} ${cx - belt},${cy + bottom} ${cx - half},${cy + shoulder}`,
    topFacet: `${cx},${cy + top} ${cx + half},${cy + shoulder} ${cx},${cy - 0.05 * s} ${cx - half},${cy + shoulder}`,
    rightFacet: `${cx},${cy - 0.05 * s} ${cx + half},${cy + shoulder} ${cx + belt},${cy + bottom}`,
    shine: `${cx - 0.2 * s},${cy + top + 0.18 * s} ${cx + 0.08 * s},${cy + top + 0.05 * s} ${cx - 0.05 * s},${cy + 0.2 * s}`
  };
}

function Gem({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const f = gemFacets(cx, cy, s);
  return (
    <G>
      <Polygon points={f.body} fill={GEM_MID} stroke={GEM_DARK} strokeWidth={0.5} />
      <Polygon points={f.topFacet} fill={GEM_LIGHT} />
      <Polygon points={f.rightFacet} fill={GEM_DARK} opacity={0.55} />
      <Polygon points={f.shine} fill={GEM_SHINE} opacity={0.85} />
    </G>
  );
}

function Sparkle({ cx, cy, r, color = "#fff7d6" }: { cx: number; cy: number; r: number; color?: string }) {
  return (
    <Polygon
      points={`${cx},${cy - r} ${cx + r * 0.28},${cy - r * 0.28} ${cx + r},${cy} ${cx + r * 0.28},${cy + r * 0.28} ${cx},${cy + r} ${cx - r * 0.28},${cy + r * 0.28} ${cx - r},${cy} ${cx - r * 0.28},${cy - r * 0.28}`}
      fill={color}
    />
  );
}

function PouchArt({ large }: { large: boolean }) {
  const bodyFill = large ? "url(#pouchLg)" : "url(#pouchSm)";
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="pouchSm" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#b47f45" />
          <Stop offset="1" stopColor="#6d4423" />
        </LinearGradient>
        <LinearGradient id="pouchLg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#c88f4e" />
          <Stop offset="1" stopColor="#734827" />
        </LinearGradient>
      </Defs>
      {/* sack body */}
      <Path
        d={large
          ? "M50 40 C24 40 20 62 24 78 C27 92 73 92 76 78 C80 62 76 40 50 40 Z"
          : "M50 46 C30 46 27 64 30 78 C33 90 67 90 70 78 C73 64 70 46 50 46 Z"}
        fill={bodyFill}
        stroke="#3f2812"
        strokeWidth={1.4}
      />
      {/* stitching highlight */}
      <Path
        d={large ? "M34 60 C40 70 60 70 66 60" : "M38 62 C43 70 57 70 62 62"}
        fill="none"
        stroke="#e3bd7c"
        strokeWidth={1.2}
        opacity={0.55}
      />
      {/* drawstring neck */}
      <Path
        d={large ? "M38 40 L34 30 L66 30 L62 40 Z" : "M40 46 L37 38 L63 38 L60 46 Z"}
        fill="#8a5a2c"
        stroke="#3f2812"
        strokeWidth={1.2}
      />
      <Rect x={large ? 33 : 36} y={large ? 28 : 36} width={large ? 34 : 28} height="4" rx="2" fill="#d8b56a" />
      {/* gems peeking out */}
      <Gem cx={50} cy={large ? 30 : 36} s={large ? 9 : 7} />
      {large ? <Gem cx={40} cy={33} s={6} /> : null}
      {large ? <Gem cx={60} cy={33} s={6} /> : null}
      {!large ? <Gem cx={42} cy={39} s={4.5} /> : null}
    </Svg>
  );
}

function ChestArt({ tone }: { tone: "wood" | "gold" | "royal" }) {
  const bodyId = `chestBody_${tone}`;
  const lidId = `chestLid_${tone}`;
  const palette =
    tone === "wood"
      ? { bodyTop: "#8a5a2c", bodyBot: "#5a3618", lidTop: "#9a6431", lidBot: "#6d4423", band: "#caa15a", bandDark: "#8a6a2c", trim: "#e3bd7c" }
      : tone === "gold"
        ? { bodyTop: "#f2c445", bodyBot: "#b07d1e", lidTop: "#ffd76a", lidBot: "#d0982f", band: "#fff0b3", bandDark: "#c79a34", trim: "#fff6d4" }
        : { bodyTop: "#6a3aa0", bodyBot: "#3f2168", lidTop: "#7a46b8", lidBot: "#4a2679", band: "#ffd76a", bandDark: "#c79a34", trim: "#ffe9a8" };
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
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
      {/* spilling gems behind the lid */}
      <Gem cx={30} cy={34} s={7} />
      <Gem cx={50} cy={28} s={9} />
      <Gem cx={70} cy={34} s={7} />
      {/* chest body */}
      <Rect x="20" y="52" width="60" height="30" rx="4" fill={`url(#${bodyId})`} stroke="#2c1a0c" strokeWidth={1.6} />
      {/* lid */}
      <Path d="M20 52 C20 36 80 36 80 52 Z" fill={`url(#${lidId})`} stroke="#2c1a0c" strokeWidth={1.6} />
      {/* metal bands */}
      <Rect x="18" y="50" width="64" height="5" rx="2.5" fill={palette.band} stroke={palette.bandDark} strokeWidth={0.8} />
      <Rect x="44" y="40" width="12" height="42" rx="2" fill={palette.band} stroke={palette.bandDark} strokeWidth={0.8} />
      {/* latch */}
      <Rect x="46" y="56" width="8" height="10" rx="2" fill={palette.trim} stroke="#2c1a0c" strokeWidth={0.8} />
      <Circle cx="50" cy="61" r="1.6" fill="#2c1a0c" />
      {/* gems tumbling over the front */}
      <Gem cx={33} cy={58} s={6} />
      <Gem cx={67} cy={58} s={6} />
      {tone !== "wood" ? <Sparkle cx={26} cy={30} r={3.2} /> : null}
      {tone !== "wood" ? <Sparkle cx={76} cy={44} r={2.6} /> : null}
      {tone === "royal" ? (
        <G>
          {/* crown on the lid */}
          <Polygon points="42,40 45,32 50,38 55,32 58,40" fill="#ffd76a" stroke="#a9761f" strokeWidth={0.8} />
          <Circle cx="45" cy="31" r="1.4" fill="#fff6d4" />
          <Circle cx="55" cy="31" r="1.4" fill="#fff6d4" />
        </G>
      ) : null}
    </Svg>
  );
}

function LegendaryArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
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
          <Stop offset="0" stopColor="#4fbf5f" />
          <Stop offset="1" stopColor="#1f7a3a" />
        </LinearGradient>
      </Defs>
      {/* radiant light rays */}
      <G opacity={0.5}>
        <Polygon points="50,6 46,30 54,30" fill="#fff3b0" />
        <Polygon points="16,24 34,34 28,40" fill="#fff3b0" />
        <Polygon points="84,24 66,34 72,40" fill="#fff3b0" />
      </G>
      {/* jungle leaves */}
      <Path d="M18 60 C6 52 6 34 20 30 C22 44 30 52 34 58 Z" fill="url(#legLeaf)" stroke="#14532a" strokeWidth={1} />
      <Path d="M82 60 C94 52 94 34 80 30 C78 44 70 52 66 58 Z" fill="url(#legLeaf)" stroke="#14532a" strokeWidth={1} />
      {/* overflowing gems */}
      <Gem cx={30} cy={38} s={8} />
      <Gem cx={50} cy={26} s={12} />
      <Gem cx={70} cy={38} s={8} />
      <Gem cx={40} cy={46} s={6} />
      <Gem cx={60} cy={46} s={6} />
      {/* ornate chest */}
      <Rect x="18" y="56" width="64" height="30" rx="5" fill="url(#legBody)" stroke="#7a4e12" strokeWidth={1.8} />
      <Path d="M18 56 C18 40 82 40 82 56 Z" fill="url(#legLid)" stroke="#7a4e12" strokeWidth={1.8} />
      <Rect x="16" y="53" width="68" height="6" rx="3" fill="#fff0b3" stroke="#c79a34" strokeWidth={0.9} />
      <Rect x="43" y="44" width="14" height="42" rx="2.5" fill="#fff0b3" stroke="#c79a34" strokeWidth={0.9} />
      <Rect x="45" y="60" width="10" height="12" rx="2.5" fill="#fff6d4" stroke="#7a4e12" strokeWidth={0.9} />
      <Circle cx="50" cy="66" r="1.8" fill="#7a4e12" />
      {/* central crowning gem */}
      <Gem cx={50} cy={40} s={7} />
      <Ellipse cx="50" cy="40" rx="16" ry="10" fill="#a6f0c0" opacity={0.18} />
      <Sparkle cx={24} cy={30} r={3.6} />
      <Sparkle cx={78} cy={32} r={3} />
      <Sparkle cx={50} cy={18} r={3.4} />
    </Svg>
  );
}

export function GemPackArtwork({ variant }: { variant: GemArtVariant }) {
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
}
