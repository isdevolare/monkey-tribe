import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { WORKER_ASSETS } from "../../game/assets/workerAssets";
import { t, type Lang } from "../../game/i18n";
import type { WorkerClass } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { NineSliceFrame } from "./NineSliceFrame";
import { SpringPressable } from "./SpringPressable";

export function WorkerHarvestPopup({
  title,
  body,
  resourceAsset,
  resourceName,
  collected,
  workerClasses,
  accent,
  detail,
  lang,
  onClose
}: {
  title: string;
  body: string;
  resourceAsset: GameAssetKey;
  resourceName: string;
  collected: number;
  workerClasses: readonly WorkerClass[];
  accent: string;
  detail?: string | null;
  lang: Lang;
  onClose: () => void;
}) {
  const scale = useRef(new Animated.Value(0.84)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 7,
      tension: 90,
      useNativeDriver: true
    }).start();
  }, [scale]);
  const hero = workerClasses[workerClasses.length - 1];
  const workerCount = workerClasses.length;

  return (
    <View style={styles.scrim}>
      <Animated.View style={[styles.card, { borderColor: accent, transform: [{ scale }] }]}>
        <NineSliceFrame preset="card" cornerSize={26} style={StyleSheet.absoluteFill} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{title}</Text>
          {hero ? (
            <AssetImage
              assetKey={WORKER_ASSETS[hero]}
              style={styles.worker}
              fallback={<View />}
              hideFallbackOnLoad
            />
          ) : null}
          <Text style={styles.body}>{body}</Text>
          <View style={styles.rewardPanel}>
            <AssetImage assetKey={resourceAsset} style={styles.resourceIcon} fallback={<View />} />
            <Text style={styles.rewardText}>
              +{Math.floor(collected)} {resourceName}
            </Text>
          </View>
          {workerCount > 0 ? (
            <Text style={styles.contractText}>
              {workerCount === 1
                ? t("workerHarvest.oneContractEnded", lang)
                : t("workerHarvest.contractsEnded", lang, { n: workerCount })}
            </Text>
          ) : null}
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
          <SpringPressable accessibilityRole="button" onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>{t("workerLodge.continue", lang)}</Text>
          </SpringPressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(2,7,3,0.86)"
  },
  card: {
    width: "100%",
    maxWidth: 340,
    maxHeight: "92%",
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: "#ead49a"
  },
  scroll: { width: "100%" },
  content: { alignItems: "center", padding: 18, paddingBottom: 20 },
  title: { color: "#3b2816", fontSize: 21, textAlign: "center", fontFamily: theme.fonts.heavy },
  worker: { width: 132, height: 132, marginTop: 5, marginBottom: 4 },
  body: { color: "#49351f", fontSize: 12.5, lineHeight: 17, textAlign: "center", fontFamily: theme.fonts.bold },
  rewardPanel: {
    minWidth: 205,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(67,43,19,0.28)",
    backgroundColor: "rgba(62,42,20,0.14)",
    shadowColor: "#39230f",
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 }
  },
  resourceIcon: { width: 44, height: 44 },
  rewardText: { color: "#2f4a1f", fontSize: 25, fontFamily: theme.fonts.heavy },
  contractText: { marginTop: 12, color: "#6d281f", fontSize: 12, textAlign: "center", fontFamily: theme.fonts.heavy },
  detail: { marginTop: 5, color: "#67491f", fontSize: 10.5, textAlign: "center", fontFamily: theme.fonts.bold },
  button: {
    minWidth: 190,
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e8d38a",
    backgroundColor: "#356f35",
    shadowColor: "#1b321b",
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  buttonText: { color: "#fff8d8", fontSize: 16, fontFamily: theme.fonts.heavy }
});
