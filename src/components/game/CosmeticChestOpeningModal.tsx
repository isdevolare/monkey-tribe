import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import type { CosmeticRarity } from "../../game/config/profileMonkeys";
import { t } from "../../game/i18n";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { FestivalFragmentIcon } from "./FestivalFragmentIcon";
import { SpringPressable } from "./SpringPressable";

/** Presentation-only data derived from an already persisted chest transaction. */
export type CosmeticOpeningPresentation = {
  id: string;
  title: string;
  rewardName: string;
  rewardAsset: GameAssetKey;
  rarity: CosmeticRarity;
  accent: string;
  glow: string;
  fragments: number;
  previousFragments: number;
  nextFragments: number;
  requiredFragments: number;
  unlocked: boolean;
  parentName: string;
  parentOwned: boolean;
};

type Props = {
  presentation: CosmeticOpeningPresentation | null;
  lang: Lang;
  onClose: () => void;
  onEquip?: () => void;
};

type RarityVisual = {
  fragmentCount: number;
  lightCount: number;
  rayCount: number;
  edgeOpacity: number;
  cardStart: number;
  cardScale: number;
};

const RARITY_VISUALS: Record<CosmeticRarity, RarityVisual> = {
  common: { fragmentCount: 4, lightCount: 5, rayCount: 0, edgeOpacity: 0, cardStart: 0.47, cardScale: 0.82 },
  rare: { fragmentCount: 5, lightCount: 7, rayCount: 2, edgeOpacity: 0.05, cardStart: 0.48, cardScale: 0.78 },
  epic: { fragmentCount: 7, lightCount: 9, rayCount: 4, edgeOpacity: 0.15, cardStart: 0.49, cardScale: 0.72 },
  legendary: { fragmentCount: 9, lightCount: 11, rayCount: 7, edgeOpacity: 0.24, cardStart: 0.52, cardScale: 0.65 },
  mythic: { fragmentCount: 12, lightCount: 12, rayCount: 9, edgeOpacity: 0.34, cardStart: 0.55, cardScale: 0.58 }
};

const LIGHTS = [
  [-103, -72], [-70, -105], [-25, -120], [25, -120], [70, -105], [103, -72],
  [-112, -22], [112, -22], [-102, 30], [102, 30], [-64, 68], [64, 68]
] as const;

const FRAGMENT_RISE = [
  [-76, -128, -16], [-49, -154, 12], [-20, -174, -8], [16, -180, 10],
  [48, -158, -12], [78, -126, 16], [-87, -92, 8], [88, -88, -6],
  [-54, -190, 15], [55, -194, -14], [-8, -207, 7], [25, -211, -9]
] as const;

const RAY_ROTATIONS = ["0deg", "22deg", "45deg", "68deg", "90deg", "112deg", "135deg", "158deg", "180deg"] as const;

const FULL_SEQUENCE_MS = 1800;
const SKIP_ENABLE_MS = 700;

export function CosmeticChestOpeningModal({ presentation, lang, onClose, onEquip }: Props) {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const runningAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const [canSkip, setCanSkip] = useState(false);
  const [sequenceDone, setSequenceDone] = useState(false);

  useEffect(() => {
    if (!presentation) return;
    progress.setValue(0);
    setCanSkip(false);
    setSequenceDone(false);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: FULL_SEQUENCE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    });
    runningAnimation.current = animation;
    animation.start(({ finished }) => {
      if (finished) setSequenceDone(true);
    });
    const skipTimer = setTimeout(() => setCanSkip(true), SKIP_ENABLE_MS);
    return () => {
      animation.stop();
      runningAnimation.current = null;
      clearTimeout(skipTimer);
    };
  }, [presentation?.id, progress]);

  if (!presentation) return null;

  const visual = RARITY_VISUALS[presentation.rarity];
  const previousRatio = clampRatio(presentation.previousFragments / presentation.requiredFragments);
  const nextRatio = clampRatio(presentation.nextFragments / presentation.requiredFragments);

  function skipSequence() {
    if (!canSkip || sequenceDone) return;
    runningAnimation.current?.stop();
    progress.setValue(1);
    setSequenceDone(true);
  }

  function requestClose() {
    if (!canSkip) return;
    if (!sequenceDone) {
      skipSequence();
      return;
    }
    onClose();
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={requestClose}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={skipSequence} />

        {presentation.rarity === "mythic" ? (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.mythicDim,
              {
                opacity: progress.interpolate({
                  inputRange: [0, 0.28, 0.48, 0.62, 1],
                  outputRange: [0, 0.42, 0.58, 0.12, 0]
                })
              }
            ]}
          />
        ) : null}

        <View style={[styles.stage, { width: Math.min(width - 24, 390), height: Math.min(height - 42, 590) }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.edgeGlow,
              {
                borderColor: presentation.accent,
                opacity: progress.interpolate({
                  inputRange: [0, 0.43, 0.62, 0.9, 1],
                  outputRange: [0, 0, visual.edgeOpacity, visual.edgeOpacity * 0.6, visual.edgeOpacity * 0.35]
                })
              }
            ]}
          />

          {RAY_ROTATIONS.slice(0, visual.rayCount).map((rotation) => (
            <Animated.View
              key={rotation}
              pointerEvents="none"
              style={[
                styles.ray,
                {
                  backgroundColor: presentation.rarity === "mythic" ? "#ffe26d" : presentation.glow,
                  opacity: progress.interpolate({
                    inputRange: [0, 0.4, 0.58, 0.78, 1],
                    outputRange: [0, 0, 0.44, 0.18, 0.07]
                  }),
                  transform: [
                    { rotate: rotation },
                    { scaleY: progress.interpolate({ inputRange: [0.4, 0.62, 1], outputRange: [0.2, 1, 0.82] }) }
                  ]
                }
              ]}
            />
          ))}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.aura,
              {
                backgroundColor: presentation.rarity === "mythic" ? "#d8a31d" : presentation.glow,
                opacity: progress.interpolate({ inputRange: [0, 0.18, 0.48, 0.72, 1], outputRange: [0, 0.12, 0.82, 0.28, 0.15] }),
                transform: [{ scale: progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.45, 1.55, 1.1] }) }]
              }
            ]}
          />

          {LIGHTS.slice(0, visual.lightCount).map(([x, y], index) => (
            <Animated.View
              key={`${x}-${y}`}
              pointerEvents="none"
              style={[
                styles.festivalLight,
                {
                  backgroundColor: index % 3 === 0 ? "#ff73cf" : index % 3 === 1 ? "#ffe16a" : presentation.accent,
                  opacity: progress.interpolate({
                    inputRange: [0, 0.17, 0.28, 0.5, 0.72, 1],
                    outputRange: [0, 0, index % 2 ? 0.6 : 1, 0.75, 0.3, 0.12]
                  }),
                  transform: [
                    { translateX: x },
                    { translateY: y },
                    { scale: progress.interpolate({ inputRange: [0.15, 0.32, 1], outputRange: [0.2, 1, 0.65] }) }
                  ]
                }
              ]}
            />
          ))}

          <Animated.View
            style={[
              styles.chestWrap,
              {
                opacity: progress.interpolate({ inputRange: [0, 0.04, 0.47, 0.58], outputRange: [0, 1, 1, 0] }),
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 0.17, 0.2, 0.23, 0.26, 0.29, 0.34],
                      outputRange: [0, 0, -9, 9, -7, 7, 0]
                    })
                  },
                  {
                    translateY: progress.interpolate({ inputRange: [0, 0.35, 0.47, 0.56], outputRange: [16, 0, -8, 24] })
                  },
                  {
                    scale: progress.interpolate({ inputRange: [0, 0.12, 0.4, 0.53], outputRange: [0.72, 1, 1.05, 1.25] })
                  }
                ]
              }
            ]}
          >
            <View style={[styles.chestFrame, { borderColor: presentation.accent, shadowColor: presentation.glow }]}>
              <View style={[styles.lightLeak, { backgroundColor: presentation.glow }]} />
              <AssetImage
                assetKey="propCrate"
                style={styles.chestArt}
                resizeMode="contain"
                fallback={<Text style={styles.chestFallback}>🎁</Text>}
                hideFallbackOnLoad
              />
            </View>
            <Text style={styles.chestTitle}>{presentation.title}</Text>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.openFlash,
              {
                backgroundColor: presentation.rarity === "mythic" ? "#fff1a0" : presentation.glow,
                opacity: progress.interpolate({ inputRange: [0, 0.34, 0.43, 0.55, 1], outputRange: [0, 0, 0.95, 0, 0] }),
                transform: [{ scale: progress.interpolate({ inputRange: [0.32, 0.5], outputRange: [0.2, 2.1] }) }]
              }
            ]}
          />

          {FRAGMENT_RISE.slice(0, visual.fragmentCount).map(([x, y, rotate], index) => (
            <Animated.View
              key={`${x}-${y}`}
              pointerEvents="none"
              style={[
                styles.risingFragment,
                {
                  opacity: progress.interpolate({ inputRange: [0, 0.35, 0.44, 0.68, 0.78, 1], outputRange: [0, 0, 1, 0.9, 0, 0] }),
                  transform: [
                    { translateX: progress.interpolate({ inputRange: [0.34, 0.74], outputRange: [0, x] }) },
                    { translateY: progress.interpolate({ inputRange: [0.34, 0.74], outputRange: [12, y] }) },
                    { rotate: `${rotate}deg` },
                    { scale: progress.interpolate({ inputRange: [0.34, 0.48, 0.76], outputRange: [0.2, index % 2 ? 0.86 : 1.05, 0.55] }) }
                  ]
                }
              ]}
            >
              <FestivalFragmentIcon size={index % 3 === 0 ? 25 : 20} tint={presentation.accent} />
            </Animated.View>
          ))}

          <Animated.View
            style={[
              styles.rewardCard,
              { borderColor: presentation.accent, shadowColor: presentation.glow },
              {
                opacity: progress.interpolate({ inputRange: [0, visual.cardStart, visual.cardStart + 0.13, 1], outputRange: [0, 0, 1, 1] }),
                transform: [
                  { scale: progress.interpolate({ inputRange: [visual.cardStart, visual.cardStart + 0.16, 1], outputRange: [visual.cardScale, 1.04, presentation.unlocked ? 1.015 : 1] }) },
                  { translateY: progress.interpolate({ inputRange: [visual.cardStart, visual.cardStart + 0.16, 1], outputRange: [76, -5, 0] }) }
                ]
              }
            ]}
          >
            <View style={[styles.rarityBadge, { backgroundColor: presentation.accent }]}>
              <Text style={styles.rarityText}>{t(`collection.rarity.${presentation.rarity}`, lang)}</Text>
            </View>

            <View style={[styles.rewardArtFrame, { borderColor: presentation.accent }]}>
              <View style={[styles.rewardHalo, { backgroundColor: presentation.glow }]} />
              <AssetImage
                assetKey={presentation.rewardAsset}
                style={styles.rewardArt}
                resizeMode="contain"
                fallback={<Text style={styles.rewardFallback}>🐵</Text>}
                hideFallbackOnLoad
              />
            </View>

            <Text style={styles.rewardName} numberOfLines={2} adjustsFontSizeToFit>{presentation.rewardName}</Text>
            <Text style={styles.parentName}>{presentation.parentName}</Text>

            <View style={[styles.fragmentAmount, { borderColor: presentation.accent }]}>
              <FestivalFragmentIcon size={25} tint={presentation.accent} />
              <Text style={styles.fragmentAmountText}>+{presentation.fragments} {t("festival.chest.fragments", lang)}</Text>
            </View>

            <View style={styles.progressNumbers}>
              <Text style={styles.progressPrevious}>{presentation.previousFragments}</Text>
              <Text style={[styles.progressArrow, { color: presentation.accent }]}>→</Text>
              <Text style={styles.progressNext}>{presentation.nextFragments} / {presentation.requiredFragments}</Text>
            </View>
            <View style={styles.fragmentTrack}>
              <Animated.View
                style={[
                  styles.fragmentFill,
                  {
                    backgroundColor: presentation.accent,
                    transform: [{
                      scaleX: progress.interpolate({
                        inputRange: [0, 0.64, 0.86, 1],
                        outputRange: [previousRatio, previousRatio, nextRatio, nextRatio]
                      })
                    }]
                  }
                ]}
              />
            </View>

            {presentation.unlocked ? (
              <Animated.View
                style={[
                  styles.unlockResult,
                  {
                    opacity: progress.interpolate({ inputRange: [0, 0.86, 0.94, 1], outputRange: [0, 0, 1, 1] }),
                    transform: [{ scale: progress.interpolate({ inputRange: [0.86, 0.96, 1], outputRange: [0.82, 1.05, 1] }) }]
                  }
                ]}
              >
                <Text style={[styles.unlockedTitle, { color: presentation.rarity === "mythic" ? "#ffe66f" : presentation.accent }]}>
                  {t("festival.reward.newSkin", lang)}
                </Text>
                {!presentation.parentOwned ? (
                  <Text style={styles.parentRequired}>{t("collection.requiresNamedMonkey", lang, { name: presentation.parentName })}</Text>
                ) : null}
              </Animated.View>
            ) : null}

            <View style={styles.actionRow}>
              {presentation.unlocked && presentation.parentOwned && onEquip ? (
                <SpringPressable
                  disabled={!sequenceDone}
                  onPress={onEquip}
                  style={[styles.actionButton, styles.equipButton, !sequenceDone ? styles.buttonDisabled : null]}
                >
                  <Text style={styles.actionText}>{t("collection.equip", lang)}</Text>
                </SpringPressable>
              ) : null}
              <SpringPressable
                disabled={!sequenceDone}
                onPress={onClose}
                style={[styles.actionButton, styles.claimButton, !sequenceDone ? styles.buttonDisabled : null]}
              >
                <Text style={styles.actionText}>{t("festival.reward.claim", lang)}</Text>
              </SpringPressable>
            </View>
          </Animated.View>

          {canSkip && !sequenceDone ? (
            <Text pointerEvents="none" style={styles.skipText}>{t("collection.detail.tapToSkip", lang)}</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function clampRatio(value: number) {
  return Math.max(0.02, Math.min(1, Number.isFinite(value) ? value : 0));
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2, 6, 5, 0.94)", padding: 12 },
  mythicDim: { backgroundColor: "#000" },
  stage: { alignItems: "center", justifyContent: "center" },
  edgeGlow: { position: "absolute", width: "100%", height: "100%", borderRadius: 32, borderWidth: 5 },
  aura: { position: "absolute", width: 290, height: 290, borderRadius: 145 },
  ray: { position: "absolute", width: 8, height: 380, borderRadius: 8 },
  festivalLight: { position: "absolute", width: 11, height: 11, borderRadius: 6, shadowColor: "#fff", shadowOpacity: 0.8, shadowRadius: 6 },
  chestWrap: { position: "absolute", alignItems: "center", zIndex: 4 },
  chestFrame: { width: 220, height: 195, alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 30, borderWidth: 3, backgroundColor: "#21150e", shadowOpacity: 0.88, shadowRadius: 26, elevation: 20 },
  lightLeak: { position: "absolute", width: 170, height: 38, top: 64, borderRadius: 24, opacity: 0.55, shadowColor: "#fff", shadowOpacity: 0.9, shadowRadius: 20 },
  chestArt: { width: 188, height: 170 },
  chestFallback: { fontSize: 100 },
  chestTitle: { marginTop: 12, color: theme.colors.paper, fontSize: 20, fontFamily: theme.fonts.heavy },
  openFlash: { position: "absolute", width: 175, height: 175, borderRadius: 88, zIndex: 6 },
  risingFragment: { position: "absolute", zIndex: 8 },
  rewardCard: { width: "100%", maxWidth: 368, minHeight: 520, alignItems: "center", borderRadius: 27, borderWidth: 3, backgroundColor: "#151d13", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 13, shadowOpacity: 0.78, shadowRadius: 30, elevation: 26, zIndex: 10 },
  rarityBadge: { minWidth: 104, alignItems: "center", borderRadius: 11, paddingHorizontal: 12, paddingVertical: 4 },
  rarityText: { color: "#17120d", fontSize: 10, fontFamily: theme.fonts.heavy, textTransform: "uppercase" },
  rewardArtFrame: { width: 226, height: 220, alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 8, borderRadius: 18, borderWidth: 2, backgroundColor: "rgba(5, 10, 7, 0.78)" },
  rewardHalo: { position: "absolute", width: 180, height: 180, borderRadius: 90, opacity: 0.18 },
  rewardArt: { width: "100%", height: "100%" },
  rewardFallback: { fontSize: 72 },
  rewardName: { maxWidth: "96%", marginTop: 8, color: theme.colors.paper, fontSize: 19, lineHeight: 23, fontFamily: theme.fonts.heavy, textAlign: "center" },
  parentName: { marginTop: 1, color: "#c7b991", fontSize: 9.5, fontFamily: theme.fonts.bold },
  fragmentAmount: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8, borderRadius: 12, borderWidth: 1, backgroundColor: "rgba(61, 34, 71, 0.72)", paddingHorizontal: 12, paddingVertical: 5 },
  fragmentAmountText: { color: "#fff0c5", fontSize: 13, fontFamily: theme.fonts.heavy },
  progressNumbers: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 6 },
  progressPrevious: { color: "#a49b86", fontSize: 10, fontFamily: theme.fonts.bold },
  progressArrow: { fontSize: 13, fontFamily: theme.fonts.heavy },
  progressNext: { color: "#fff1c9", fontSize: 11, fontFamily: theme.fonts.heavy },
  fragmentTrack: { width: "88%", height: 10, marginTop: 4, alignItems: "flex-start", overflow: "hidden", borderRadius: 5, backgroundColor: "rgba(3, 7, 5, 0.9)" },
  fragmentFill: { width: "100%", height: "100%", borderRadius: 5, transformOrigin: "left" },
  unlockResult: { minHeight: 35, alignItems: "center", justifyContent: "center", marginTop: 5 },
  unlockedTitle: { fontSize: 15, fontFamily: theme.fonts.heavy, textTransform: "uppercase", textAlign: "center" },
  parentRequired: { marginTop: 1, color: "#f4c7a0", fontSize: 9.5, fontFamily: theme.fonts.bold, textAlign: "center" },
  actionRow: { width: "100%", minHeight: 42, flexDirection: "row", gap: 8, marginTop: 7 },
  actionButton: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5 },
  equipButton: { borderColor: "#85d963", backgroundColor: "#2f6b24" },
  claimButton: { borderColor: "#f2cf66", backgroundColor: "#8b5a17" },
  buttonDisabled: { opacity: 0.4 },
  actionText: { color: "#fff5cc", fontSize: 12, fontFamily: theme.fonts.heavy },
  skipText: { position: "absolute", bottom: 2, color: "#b9b19d", fontSize: 9, fontFamily: theme.fonts.bold }
});
