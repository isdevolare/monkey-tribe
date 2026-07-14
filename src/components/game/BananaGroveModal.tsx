import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playSound } from "../../game/audio/soundManager";
import { buildingName, upgradeCost } from "../../game/config/buildings";
import { t, type Lang } from "../../game/i18n";
import {
  bananaGroveCapacity,
  expeditionStatus
} from "../../game/state/workerExpeditions";
import { useGameStore } from "../../game/state/gameStore";
import type {
  BananaGroveCollectionSummary,
  BananaWorkerClass,
  Resources,
  WorkerClass
} from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { BANANA_WORKER_ASSETS } from "./WorkerLodgeModal";
import { NineSliceFrame } from "./NineSliceFrame";
import { SpringPressable } from "./SpringPressable";

type Props = { visible: boolean; lang: Lang; onClose: () => void };

function formatTime(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function hasResources(resources: Resources, cost: Resources) {
  return resources.bananas >= cost.bananas && resources.stones >= cost.stones && resources.wood >= cost.wood;
}

export function BananaGroveModal({ visible, lang, onClose }: Props) {
  const state = useGameStore();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(Date.now());
  const [summary, setSummary] = useState<BananaGroveCollectionSummary | null>(null);

  useEffect(() => {
    if (!visible) return;
    state.reconcileWorkTask();
    setNow(Date.now());
    const timer = setInterval(() => {
      state.reconcileWorkTask();
      setNow(Date.now());
    }, 500);
    return () => clearInterval(timer);
  }, [state.reconcileWorkTask, visible]);

  const level = state.buildings.find((building) => building.type === "bananaGrove")?.level ?? 1;
  const clanLevel = state.buildings.find((building) => building.type === "clanHall")?.level ?? 1;
  const capacity = bananaGroveCapacity(level);
  const bananaWorkers = state.workerExpeditions.filter((entry) => entry.resource === "bananas");
  const completed = bananaWorkers.filter((entry) => entry.storedReward !== undefined);
  const active = bananaWorkers.filter((entry) => entry.storedReward === undefined);
  const full = state.bananaGroveStorage >= capacity;
  const ready = completed.length > 0 || state.bananaGroveStorage > 0;
  const statusKey = full
    ? "bananaGrove.full"
    : ready
      ? "bananaGrove.ready"
      : active.length >= 3
        ? "bananaGrove.busy"
        : active.length > 0
          ? "bananaGrove.working"
          : "bananaGrove.empty";
  const cost = upgradeCost("bananaGrove", level);
  const gated = level >= clanLevel;
  const upgradeDisabled = gated || !hasResources(state.resources, cost);

  function collect() {
    const result = state.collectBananaGrove();
    if (result) {
      playSound("reward");
      setSummary(result);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.shell, { marginTop: Math.max(insets.top, 10), marginBottom: Math.max(insets.bottom, 10) }]}>
          <NineSliceFrame preset="card" cornerSize={28} style={StyleSheet.absoluteFill} />
          <View style={styles.header}>
            <View style={styles.groveArtWrap}>
              <AssetImage assetKey="terrainBananaTree" style={styles.groveArt} fallback={<Text style={styles.fallback}>🍌</Text>} hideFallbackOnLoad />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{t("bananaGrove.eyebrow", lang)}</Text>
              <Text style={styles.title}>{buildingName("bananaGrove", lang)}</Text>
              <Text style={styles.level}>Sv. {level} · {t(statusKey, lang)}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => { playSound("close"); onClose(); }}
              style={styles.close}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} bounces={false} showsVerticalScrollIndicator={false}>
            <View style={[styles.storageCard, full && styles.storageFull, ready && !full && styles.storageReady]}>
              <View style={styles.storageHeading}>
                <View style={styles.storageTitleRow}>
                  <AssetImage assetKey="resourceBanana" style={styles.bananaIcon} fallback={<Text>🍌</Text>} />
                  <Text style={styles.storageTitle}>{t("bananaGrove.storage", lang)}</Text>
                </View>
                <Text style={styles.storageAmount}>{Math.floor(state.bananaGroveStorage)} / {capacity}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.min(100, (state.bananaGroveStorage / capacity) * 100)}%` }]} />
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusDot}>●</Text>
                <Text style={styles.statusText}>{t(statusKey, lang)}</Text>
              </View>
              {ready ? (
                <SpringPressable accessibilityRole="button" onPress={collect} style={styles.collectButton}>
                  <AssetImage assetKey="resourceBanana" style={styles.collectIcon} fallback={<View />} />
                  <Text style={styles.collectText}>{t("workerLodge.collect", lang)}</Text>
                </SpringPressable>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>{t("bananaGrove.workers", lang)} · {bananaWorkers.length}/3</Text>
            <View style={styles.workerPanel}>
              {bananaWorkers.length === 0 ? (
                <Text style={styles.empty}>{t("bananaGrove.noWorkers", lang)}</Text>
              ) : (
                bananaWorkers.map((worker) => {
                  const status = expeditionStatus(worker, now);
                  return (
                    <View key={worker.id} style={[styles.workerRow, worker.storedReward !== undefined && styles.workerReady]}>
                      <AssetImage assetKey={BANANA_WORKER_ASSETS[worker.workerClass as BananaWorkerClass]} style={styles.workerArt} fallback={<Text>🐵</Text>} hideFallbackOnLoad />
                      <View style={styles.workerCopy}>
                        <Text style={styles.workerName}>{t(`worker.${worker.workerClass}.name`, lang)}</Text>
                        <Text style={styles.workerMeta}>
                          {worker.storedReward !== undefined ? t("bananaGrove.ready", lang) : t(`worker.status.${status}`, lang)}
                        </Text>
                        <Text style={styles.expected}>{t("workerLodge.expected", lang, { amount: worker.expectedReward })}</Text>
                      </View>
                      {worker.storedReward !== undefined ? (
                        <Text style={styles.readyMark}>✓</Text>
                      ) : (
                        <Text style={styles.timer}>{formatTime(worker.returnsAt - now)}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.upgradeCard}>
              <View style={styles.upgradeCopy}>
                <Text style={styles.upgradeTitle}>{buildingName("bananaGrove", lang)} · Sv. {level}</Text>
                <Text style={styles.upgradeMeta}>{t("bananaGrove.storage", lang)} {capacity} → {bananaGroveCapacity(level + 1)}</Text>
                <CostRow cost={cost} />
              </View>
              <SpringPressable
                accessibilityRole="button"
                accessibilityState={{ disabled: upgradeDisabled }}
                onPress={() => state.upgradeBuilding("bananaGrove")}
                style={[styles.upgradeButton, upgradeDisabled && styles.disabled]}
              >
                <Text style={styles.upgradeButtonText}>{gated ? t("upgrade.needClanHall", lang) : t("upgrade.button", lang)}</Text>
              </SpringPressable>
            </View>
          </ScrollView>

          {summary ? <HarvestPopup summary={summary} lang={lang} onClose={() => setSummary(null)} /> : null}
        </View>
      </View>
    </Modal>
  );
}

function CostRow({ cost }: { cost: Resources }) {
  const entries = [
    ["bananas", "resourceBanana"],
    ["stones", "resourceStone"],
    ["wood", "resourceWood"]
  ] as const;
  return <View style={styles.costRow}>{entries.filter(([kind]) => cost[kind] > 0).map(([kind, asset]) => (
    <View key={kind} style={styles.costChip}><AssetImage assetKey={asset} style={styles.costIcon} fallback={<View />} /><Text style={styles.costText}>{cost[kind]}</Text></View>
  ))}</View>;
}

function HarvestPopup({ summary, lang, onClose }: { summary: BananaGroveCollectionSummary; lang: Lang; onClose: () => void }) {
  const scale = useRef(new Animated.Value(0.82)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
  }, [scale]);
  const hero: WorkerClass = summary.workerClasses[summary.workerClasses.length - 1] ?? "gatherer";
  return <View style={styles.popupScrim}>
    <Animated.View style={[styles.popup, { transform: [{ scale }] }]}>
      <NineSliceFrame preset="card" cornerSize={26} style={StyleSheet.absoluteFill} />
      <Text style={styles.popupKicker}>✓ {t("bananaGrove.harvestComplete", lang)}</Text>
      <AssetImage assetKey={BANANA_WORKER_ASSETS[hero as BananaWorkerClass]} style={styles.popupWorker} fallback={<Text style={styles.fallback}>🐵</Text>} hideFallbackOnLoad />
      <View style={styles.rewardRow}><AssetImage assetKey="resourceBanana" style={styles.rewardIcon} fallback={<View />} /><Text style={styles.rewardAmount}>+{Math.floor(summary.collected)}</Text></View>
      <Text style={styles.contractText}>{t("bananaGrove.contractEnded", lang)}</Text>
      {summary.remainingStorage > 0 ? <Text style={styles.remainder}>{t("bananaGrove.storageRemainder", lang, { amount: summary.remainingStorage })}</Text> : null}
      <SpringPressable accessibilityRole="button" onPress={onClose} style={styles.popupButton}><Text style={styles.popupButtonText}>{t("workerLodge.continue", lang)}</Text></SpringPressable>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: "center", paddingHorizontal: 10, backgroundColor: "rgba(3,8,5,0.84)" },
  shell: { flex: 1, width: "100%", maxWidth: 430, alignSelf: "center", overflow: "hidden", borderRadius: 24, borderWidth: 2, borderColor: "#d6a74f", backgroundColor: "#142313" },
  header: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: "rgba(232,194,105,0.28)", backgroundColor: "rgba(31,55,25,0.96)" },
  groveArtWrap: { width: 70, height: 70, borderRadius: 18, overflow: "hidden", borderWidth: 2, borderColor: "#e4bd62", backgroundColor: "#294221" },
  groveArt: { width: 72, height: 72 }, fallback: { fontSize: 38 }, headerCopy: { flex: 1 },
  eyebrow: { color: "#8ed96a", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#fff0b6", fontSize: 24, fontWeight: "900", fontFamily: theme.fonts.heavy },
  level: { color: "#d8c88f", fontSize: 12, fontWeight: "800" },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,12,5,0.6)" },
  closeText: { color: "#fff2bd", fontSize: 29, lineHeight: 31, fontWeight: "800" },
  content: { padding: 13, paddingBottom: 26, gap: 12 },
  storageCard: { padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: "rgba(223,184,91,0.45)", backgroundColor: "rgba(12,25,10,0.92)" },
  storageReady: { borderColor: "#83d45f", shadowColor: "#75d655", shadowOpacity: 0.3, shadowRadius: 10 },
  storageFull: { borderColor: "#f1c34e", backgroundColor: "rgba(72,52,12,0.65)" },
  storageHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, storageTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  bananaIcon: { width: 31, height: 31 }, storageTitle: { color: "#fff0bd", fontSize: 17, fontWeight: "900" }, storageAmount: { color: "#ffe073", fontSize: 20, fontWeight: "900", fontVariant: ["tabular-nums"] },
  track: { height: 12, overflow: "hidden", marginTop: 10, borderRadius: 6, backgroundColor: "#1c2d18" }, fill: { height: "100%", borderRadius: 6, backgroundColor: "#e5b837" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }, statusDot: { color: "#85d962", fontSize: 11 }, statusText: { color: "#d9cca1", fontSize: 12, fontWeight: "800" },
  collectButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 11, borderRadius: 14, borderWidth: 1, borderColor: "#c8e69a", backgroundColor: "#519a3d" }, collectIcon: { width: 27, height: 27 }, collectText: { color: "white", fontSize: 16, fontWeight: "900", fontFamily: theme.fonts.heavy },
  sectionTitle: { color: "#4b2d13", fontSize: 17, fontWeight: "900", fontFamily: theme.fonts.heavy }, workerPanel: { overflow: "hidden", borderRadius: 16, borderWidth: 1, borderColor: "rgba(105,68,26,0.38)", backgroundColor: "rgba(8,17,8,0.75)" },
  empty: { padding: 24, color: "#8d9a81", textAlign: "center" }, workerRow: { minHeight: 80, flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(226,185,99,0.2)" }, workerReady: { backgroundColor: "rgba(65,116,43,0.28)" }, workerArt: { width: 64, height: 64 }, workerCopy: { flex: 1, minWidth: 0 }, workerName: { color: "#fff0bd", fontSize: 13, fontWeight: "900" }, workerMeta: { color: "#9bdc7b", fontSize: 11, fontWeight: "800" }, expected: { color: "#baaE87", fontSize: 10 }, timer: { color: "#9be77b", fontSize: 14, fontWeight: "900", fontVariant: ["tabular-nums"] }, readyMark: { color: "#8fe76c", fontSize: 24, fontWeight: "900", marginRight: 8 },
  upgradeCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(231,190,91,0.48)", backgroundColor: "rgba(65,42,16,0.76)" }, upgradeCopy: { flex: 1, minWidth: 0 }, upgradeTitle: { color: "#ffe6a2", fontSize: 14, fontWeight: "900" }, upgradeMeta: { color: "#cdbd91", fontSize: 11 }, costRow: { flexDirection: "row", gap: 8, marginTop: 5 }, costChip: { flexDirection: "row", alignItems: "center", gap: 2 }, costIcon: { width: 17, height: 17 }, costText: { color: "#f4dd9b", fontSize: 11, fontWeight: "900" }, upgradeButton: { minWidth: 98, minHeight: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 9, borderRadius: 11, backgroundColor: "#b56b25" }, upgradeButtonText: { color: "white", fontSize: 10, textAlign: "center", fontWeight: "900" }, disabled: { opacity: 0.38 },
  popupScrim: { ...StyleSheet.absoluteFillObject, zIndex: 30, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(2,7,3,0.84)" }, popup: { width: "100%", maxWidth: 340, alignItems: "center", overflow: "hidden", padding: 20, borderRadius: 22, borderWidth: 2, borderColor: "#e0bb5c", backgroundColor: "#20331c" }, popupKicker: { color: "#8fe76c", fontSize: 14, textAlign: "center", fontWeight: "900" }, popupWorker: { width: 145, height: 145 }, rewardRow: { flexDirection: "row", alignItems: "center", gap: 7 }, rewardIcon: { width: 44, height: 44 }, rewardAmount: { color: "#a0ed78", fontSize: 34, fontWeight: "900" }, contractText: { color: "#c9bc91", fontSize: 12, textAlign: "center", marginTop: 5 }, remainder: { color: "#f0c86d", fontSize: 11, textAlign: "center", marginTop: 5 }, popupButton: { minWidth: 170, minHeight: 47, alignItems: "center", justifyContent: "center", marginTop: 14, borderRadius: 14, borderWidth: 1, borderColor: "#b9e18e", backgroundColor: "#579f3e" }, popupButtonText: { color: "white", fontSize: 15, fontWeight: "900" }
});
