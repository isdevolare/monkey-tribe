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
import { t } from "../../game/i18n";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";

/**
 * Neutral presentation shell reserved for the future Festival fragment opening
 * flow. It intentionally owns no chest prices, reward rolls, currency changes,
 * complete-skin grants, or duplicate compensation behavior.
 */
export type CosmeticOpeningPresentation = {
  title: string;
  rewardName: string;
  rewardDetail: string;
  rewardAsset: GameAssetKey;
  accent: string;
  glow: string;
};

type Props = {
  presentation: CosmeticOpeningPresentation | null;
  lang: Lang;
  onClose: () => void;
};

const BURST_PARTICLES = [
  [-94, -55], [-68, -102], [-24, -122], [28, -120], [72, -92],
  [98, -48], [-84, 14], [83, 18], [-46, 55], [48, 58]
] as const;

export function CosmeticChestOpeningModal({ presentation, lang, onClose }: Props) {
  const { width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!presentation) return;
    progress.setValue(0);
    setCanSkip(false);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 1650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    });
    animation.start();
    const skipTimer = setTimeout(() => setCanSkip(true), 1000);
    return () => {
      animation.stop();
      clearTimeout(skipTimer);
    };
  }, [presentation, progress]);

  if (!presentation) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => { if (canSkip) onClose(); }}
    >
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (canSkip) onClose(); }} />
        <View style={[styles.stage, { width: Math.min(width - 28, 380) }]}>
          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: presentation.glow,
                opacity: progress.interpolate({ inputRange: [0, 0.2, 0.56, 0.8, 1], outputRange: [0, 0.15, 0.85, 0.3, 0.2] }),
                transform: [{ scale: progress.interpolate({ inputRange: [0, 0.58, 1], outputRange: [0.45, 1.45, 1.15] }) }]
              }
            ]}
          />

          {BURST_PARTICLES.map(([x, y], index) => (
            <Animated.View
              key={`${x}-${y}`}
              style={[
                styles.particle,
                {
                  backgroundColor: index % 3 === 0 ? presentation.accent : presentation.glow,
                  opacity: progress.interpolate({ inputRange: [0, 0.42, 0.58, 0.9, 1], outputRange: [0, 0, 1, 0.42, 0] }),
                  transform: [
                    { translateX: progress.interpolate({ inputRange: [0.45, 1], outputRange: [0, x] }) },
                    { translateY: progress.interpolate({ inputRange: [0.45, 1], outputRange: [0, y] }) },
                    { scale: index % 2 ? 0.7 : 1 }
                  ]
                }
              ]}
            />
          ))}

          <Animated.View
            style={[
              styles.openingArt,
              {
                opacity: progress.interpolate({ inputRange: [0, 0.08, 0.62, 0.72], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateX: progress.interpolate({ inputRange: [0, 0.18, 0.25, 0.32, 0.39, 0.46, 0.55], outputRange: [0, 0, -9, 9, -7, 7, 0] }) },
                  { scale: progress.interpolate({ inputRange: [0, 0.18, 0.55, 0.68], outputRange: [0.72, 1, 1.08, 1.32] }) }
                ]
              }
            ]}
          >
            <View style={[styles.openingFrame, { borderColor: presentation.accent, shadowColor: presentation.glow }]}>
              <AssetImage assetKey="propCrate" style={styles.crateArt} resizeMode="contain" fallback={<Text style={styles.crateFallback}>🎁</Text>} hideFallbackOnLoad />
            </View>
            <Text style={styles.openingTitle}>{presentation.title}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.rewardCard,
              { borderColor: presentation.accent, shadowColor: presentation.glow },
              {
                opacity: progress.interpolate({ inputRange: [0, 0.56, 0.72, 1], outputRange: [0, 0, 1, 1] }),
                transform: [
                  { scale: progress.interpolate({ inputRange: [0.55, 0.76, 1], outputRange: [0.62, 1.06, 1] }) },
                  { translateY: progress.interpolate({ inputRange: [0.55, 0.78, 1], outputRange: [24, -5, 0] }) }
                ]
              }
            ]}
          >
            <View style={[styles.rewardArtFrame, { borderColor: presentation.accent }]}>
              <AssetImage assetKey={presentation.rewardAsset} style={styles.rewardArt} resizeMode="contain" fallback={<Text style={styles.rewardFallback}>🐵</Text>} hideFallbackOnLoad />
            </View>
            <Text style={styles.rewardName}>{presentation.rewardName}</Text>
            <Text style={styles.rewardDetail}>{presentation.rewardDetail}</Text>
            <SpringPressable disabled={!canSkip} onPress={onClose} style={[styles.closeButton, !canSkip ? styles.closeButtonDisabled : null]}>
              <Text style={styles.closeText}>{t("collection.ok", lang)}</Text>
            </SpringPressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2, 6, 5, 0.95)", padding: 14 },
  stage: { height: 510, alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", width: 270, height: 270, borderRadius: 135 },
  particle: { position: "absolute", top: "48%", width: 8, height: 8, borderRadius: 4 },
  openingArt: { position: "absolute", alignItems: "center" },
  openingFrame: { width: 210, height: 190, alignItems: "center", justifyContent: "center", borderRadius: 28, borderWidth: 3, backgroundColor: "#21180f", shadowOpacity: 0.8, shadowRadius: 24, elevation: 18 },
  crateArt: { width: 176, height: 160 },
  crateFallback: { fontSize: 100 },
  openingTitle: { marginTop: 12, color: theme.colors.paper, fontSize: 20, fontFamily: theme.fonts.heavy },
  rewardCard: { width: "100%", minHeight: 430, alignItems: "center", borderRadius: 26, borderWidth: 3, backgroundColor: "#151d13", padding: 18, shadowOpacity: 0.7, shadowRadius: 28, elevation: 24 },
  rewardArtFrame: { width: 245, height: 250, alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 8, borderRadius: 18, borderWidth: 1.5, backgroundColor: "rgba(5, 10, 7, 0.75)" },
  rewardArt: { width: "100%", height: "100%" },
  rewardFallback: { fontSize: 72 },
  rewardName: { marginTop: 9, color: theme.colors.paper, fontSize: 19, lineHeight: 24, fontFamily: theme.fonts.heavy, textAlign: "center" },
  rewardDetail: { minHeight: 18, marginTop: 4, color: "#d7cda9", fontSize: 10, lineHeight: 14, fontFamily: theme.fonts.bold, textAlign: "center" },
  closeButton: { width: "100%", minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 12, borderRadius: 13, borderWidth: 1.5, borderColor: "#f2cf66", backgroundColor: "#8b5a17" },
  closeButtonDisabled: { opacity: 0.45 },
  closeText: { color: "#fff5cc", fontSize: 13, fontFamily: theme.fonts.heavy }
});
