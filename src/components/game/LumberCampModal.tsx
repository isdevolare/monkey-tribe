import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playSound } from "../../game/audio/soundManager";
import { buildingName, upgradeCost } from "../../game/config/buildings";
import { t, type Lang } from "../../game/i18n";
import {
  LUMBER_MISSIONS,
  LUMBER_MISSION_ORDER,
  WORKER_CLASSES,
  calculateWorkerExpectedReward,
  expeditionStatus,
  isLumberWorkerClass,
  isStoneWorkerClass,
  lumberCampCapacity,
  stoneQuarryCapacity
} from "../../game/state/workerExpeditions";
import { useGameStore } from "../../game/state/gameStore";
import type { LumberCampCollectionSummary, LumberMissionTier, Resources, StoneQuarryCollectionSummary, WorkerClass } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { WORKER_ASSETS } from "../../game/assets/workerAssets";
import { NineSliceFrame } from "./NineSliceFrame";
import { SpringPressable } from "./SpringPressable";

type Props = { visible: boolean; lang: Lang; onClose: () => void; onOpenWorkerLodge: () => void };
type WorkplaceKind = "lumber" | "stone";

const WORKPLACE = {
  lumber: {
    building: "lumberCamp" as const,
    resource: "wood" as const,
    prefix: "lumberCamp",
    missionPrefix: "lumberMission",
    resultPrefix: "lumberResult",
    art: "buildingLumberCampReference" as const,
    resourceAsset: "resourceWood" as const,
    capacity: lumberCampCapacity,
    isWorker: isLumberWorkerClass
  },
  stone: {
    building: "stoneQuarry" as const,
    resource: "stones" as const,
    prefix: "stoneQuarry",
    missionPrefix: "stoneMission",
    resultPrefix: "stoneResult",
    art: "resourceStonePile" as const,
    resourceAsset: "resourceStone" as const,
    capacity: stoneQuarryCapacity,
    isWorker: isStoneWorkerClass
  }
};

function clock(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function LumberCampModal({ visible, lang, onClose, onOpenWorkerLodge }: Props) {
  return <ResourceWorkplaceModal visible={visible} lang={lang} onClose={onClose} onOpenWorkerLodge={onOpenWorkerLodge} kind="lumber" />;
}

export function StoneQuarryModal({ visible, lang, onClose, onOpenWorkerLodge }: Props) {
  return <ResourceWorkplaceModal visible={visible} lang={lang} onClose={onClose} onOpenWorkerLodge={onOpenWorkerLodge} kind="stone" />;
}

function ResourceWorkplaceModal({ visible, lang, onClose, onOpenWorkerLodge, kind }: Props & { kind: WorkplaceKind }) {
  const state = useGameStore();
  const config = WORKPLACE[kind];
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(Date.now());
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [missionTier, setMissionTier] = useState<LumberMissionTier>("safe");
  const [summary, setSummary] = useState<LumberCampCollectionSummary | StoneQuarryCollectionSummary | null>(null);

  useEffect(() => {
    if (!visible) return;
    state.reconcileWorkTask();
    setNow(Date.now());
    const timer = setInterval(() => { state.reconcileWorkTask(); setNow(Date.now()); }, 500);
    return () => clearInterval(timer);
  }, [state.reconcileWorkTask, visible]);

  const level = state.buildings.find((building) => building.type === config.building)?.level ?? 1;
  const capacity = config.capacity(level);
  const clanLevel = state.buildings.find((building) => building.type === "clanHall")?.level ?? 1;
  const upgrade = upgradeCost(config.building, level);
  const upgradeDisabled = level >= clanLevel || state.resources.bananas < upgrade.bananas || state.resources.stones < upgrade.stones || state.resources.wood < upgrade.wood;
  const readyWorkers = useMemo(
    () => state.idleWorkers.filter((worker) => config.isWorker(worker.workerClass)),
    [config, state.idleWorkers]
  );
  const mission = state.workerExpeditions.find((entry) => entry.resource === config.resource);
  const selectedWorker = readyWorkers.find((worker) => worker.id === workerId) ?? readyWorkers[0];
  const storage = kind === "lumber" ? state.lumberCampStorage : state.stoneQuarryStorage;
  const full = storage >= capacity;
  const completed = mission?.storedReward !== undefined;
  const selectedMission = LUMBER_MISSIONS[missionTier];
  const definition = selectedWorker ? WORKER_CLASSES[selectedWorker.workerClass] : null;
  const potential = definition
    ? calculateWorkerExpectedReward(definition.baseYield, selectedMission.multiplier, level * 0.03)
    : 0;

  function collect() {
    const result = kind === "lumber" ? state.collectLumberCamp() : state.collectStoneQuarry();
    if (result) { playSound("reward"); setSummary(result); }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.shell, { marginTop: Math.max(insets.top, 10), marginBottom: Math.max(insets.bottom, 10) }]}>
          <NineSliceFrame preset="card" cornerSize={28} style={StyleSheet.absoluteFill} />
          <View style={styles.header}>
            <View style={styles.campArt}><AssetImage assetKey={config.art} style={styles.full} fallback={<View />} /></View>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{t(`${config.prefix}.eyebrow`, lang)}</Text>
              <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{buildingName(config.building, lang)}</Text>
              <Text style={styles.level}>{t("common.levelBadge", lang, { n: level })} · {t(full ? `${config.prefix}.full` : completed ? `${config.prefix}.ready` : mission ? `worker.status.${expeditionStatus(mission, now)}` : `${config.prefix}.empty`, lang)}</Text>
            </View>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => { playSound("close"); onClose(); }} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
            <View style={[styles.storageCard, full && styles.storageFull, (completed || storage > 0) && !full && styles.storageReady]}>
              <View style={styles.rowBetween}><View style={styles.row}><AssetImage assetKey={config.resourceAsset} style={styles.resourceIcon} fallback={<View />} /><Text style={styles.storageTitle}>{t(`${config.prefix}.storage`, lang)}</Text></View><Text style={styles.storageAmount}>{Math.floor(storage)} / {capacity}</Text></View>
              <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, storage / capacity * 100)}%` }]} /></View>
              <Text style={styles.bonus}>{t(`${config.prefix}.levelBonus`, lang, { amount: level * 3 })}</Text>
              {(completed || (!mission && storage > 0)) ? <SpringPressable accessibilityRole="button" onPress={collect} style={styles.collectButton}><AssetImage assetKey={config.resourceAsset} style={styles.buttonIcon} fallback={<View />} /><Text style={styles.buttonText}>{t("workerLodge.collect", lang)}</Text></SpringPressable> : null}
            </View>

            {mission ? (
              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>{completed ? t(`${config.prefix}.ready`, lang) : t(`${config.prefix}.activeMission`, lang)}</Text>
                <View style={styles.workerRow}>
                  <AssetImage assetKey={WORKER_ASSETS[mission.workerClass]} style={styles.workerArt} fallback={<View />} hideFallbackOnLoad />
                  <View style={styles.flex}>
                    <Text style={styles.workerName}>{t(`worker.${mission.workerClass}.name`, lang)}</Text>
                    <Text style={styles.missionName}>{t(`${config.missionPrefix}.${mission.missionTier ?? "safe"}.name`, lang)} · {mission.missionMultiplier ?? 2}x</Text>
                    <Text style={styles.meta}>{t(`worker.status.${expeditionStatus(mission, now)}`, lang)}</Text>
                  </View>
                  <Text style={styles.timer}>{completed ? t(`${config.prefix}.ready`, lang) : clock(mission.returnsAt - now)}</Text>
                </View>
                <View style={styles.detailGrid}>
                  <Detail label={t(`${config.prefix}.potential`, lang)} value={`${mission.expectedReward} ${t(`res.${config.resource}`, lang)}`} />
                  <Detail label={t(`${config.prefix}.storage`, lang)} value={`${Math.floor(storage)} / ${capacity}`} />
                </View>
              </View>
            ) : (
              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>{t(`${config.prefix}.assignTitle`, lang)}</Text>
                {readyWorkers.length === 0 ? (
                  <View style={styles.emptyWrap}><Text style={styles.empty}>{t(`${config.prefix}.noWorkers`, lang)}</Text><SpringPressable accessibilityRole="button" onPress={onOpenWorkerLodge} style={styles.secondaryButton}><Text style={styles.secondaryText}>{t(`${config.prefix}.openLodge`, lang)}</Text></SpringPressable></View>
                ) : (
                  <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workerPicker}>
                      {readyWorkers.map((worker) => <SpringPressable key={worker.id} onPress={() => setWorkerId(worker.id)} style={[styles.workerChip, selectedWorker?.id === worker.id && styles.selected]}><AssetImage assetKey={WORKER_ASSETS[worker.workerClass]} style={styles.chipArt} fallback={<View />} /><Text style={styles.chipText} numberOfLines={2}>{t(`worker.${worker.workerClass}.name`, lang)}</Text></SpringPressable>)}
                    </ScrollView>
                    <Text style={styles.sectionTitle}>{t(`${config.prefix}.chooseMission`, lang)}</Text>
                    <View style={styles.missionCards}>{LUMBER_MISSION_ORDER.map((tier) => { const option = LUMBER_MISSIONS[tier]; return <SpringPressable key={tier} onPress={() => setMissionTier(tier)} style={[styles.missionCard, missionTier === tier && styles.selected]}><Text style={styles.multiplier}>{option.multiplier}x</Text><Text style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>{t(`${config.missionPrefix}.${tier}.name`, lang)}</Text><Text style={styles.cardMeta}>{clock(option.durationMs)}</Text><Text style={styles.risk}>{t(`${config.missionPrefix}.${tier}.risk`, lang)}</Text></SpringPressable>; })}</View>
                    <Text style={styles.potential}>{t(`${config.prefix}.potential`, lang)}: {potential} {t(`res.${config.resource}`, lang)}</Text>
                    <SpringPressable accessibilityRole="button" accessibilityState={{ disabled: full }} onPress={() => selectedWorker && state.sendWorkerExpedition(selectedWorker.id, config.resource, missionTier)} style={[styles.sendButton, full && styles.disabled]}><Text style={styles.buttonText}>{t("bananaGrove.send", lang)}</Text></SpringPressable>
                  </>
                )}
              </View>
            )}
            <View style={styles.upgradeCard}>
              <View style={styles.flex}><Text style={styles.workerName}>{buildingName(config.building, lang)} · {t("common.levelBadge", lang, { n: level })}</Text><Text style={styles.meta}>{t(`${config.prefix}.storage`, lang)} {capacity} → {config.capacity(level + 1)}</Text><CostRow cost={upgrade} /></View>
              <SpringPressable accessibilityRole="button" accessibilityState={{ disabled: upgradeDisabled }} onPress={() => state.upgradeBuilding(config.building)} style={[styles.secondaryButton, upgradeDisabled && styles.disabled]}><Text style={styles.secondaryText}>{level >= clanLevel ? t("upgrade.needClanHall", lang) : t("upgrade.button", lang)}</Text></SpringPressable>
            </View>
          </ScrollView>
          {summary ? <ResultPopup summary={summary} lang={lang} onClose={() => setSummary(null)} kind={kind} /> : null}
        </View>
      </View>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }

function CostRow({ cost }: { cost: Resources }) {
  const entries = [["bananas", "resourceBanana"], ["stones", "resourceStone"], ["wood", "resourceWood"]] as const;
  return <View style={styles.costRow}>{entries.filter(([kind]) => cost[kind] > 0).map(([kind, asset]) => <View key={kind} style={styles.costChip}><AssetImage assetKey={asset} style={styles.costIcon} fallback={<View />} /><Text style={styles.costText}>{cost[kind]}</Text></View>)}</View>;
}

function ResultPopup({ summary, lang, onClose, kind }: { summary: LumberCampCollectionSummary | StoneQuarryCollectionSummary; lang: Lang; onClose: () => void; kind: WorkplaceKind }) {
  const config = WORKPLACE[kind];
  const scale = useRef(new Animated.Value(0.84)).current;
  useEffect(() => { Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start(); }, [scale]);
  const outcome = summary.outcome;
  const title = outcome === "success" ? t(`${config.resultPrefix}.success`, lang) : outcome === "half" ? t(`${config.resultPrefix}.partial`, lang) : outcome === "empty" ? t(`${config.resultPrefix}.failed`, lang) : t(`${config.resultPrefix}.storage`, lang);
  return <View style={styles.popupScrim}><Animated.View style={[styles.popup, { transform: [{ scale }] }]}><NineSliceFrame preset="card" cornerSize={26} style={StyleSheet.absoluteFill} /><Text style={styles.popupTitle}>{title}</Text>{summary.workerClass ? <AssetImage assetKey={WORKER_ASSETS[summary.workerClass as WorkerClass]} style={styles.popupWorker} fallback={<View />} hideFallbackOnLoad /> : null}<Text style={styles.outcomeText}>{outcome ? t(`${config.resultPrefix}.${outcome}.body`, lang) : t(`${config.resultPrefix}.storage.body`, lang)}</Text><View style={styles.rewardRow}><AssetImage assetKey={config.resourceAsset} style={styles.rewardIcon} fallback={<View />} /><Text style={styles.rewardAmount}>+{Math.floor(summary.collected)}</Text></View>{summary.reward > summary.storedReward ? <Text style={styles.clamped}>{t(`${config.resultPrefix}.clamped`, lang, { amount: summary.storedReward })}</Text> : null}{summary.remainingStorage > 0 ? <Text style={styles.clamped}>{t(`${config.prefix}.storageRemainder`, lang, { amount: summary.remainingStorage })}</Text> : null}<SpringPressable accessibilityRole="button" onPress={onClose} style={styles.collectButton}><Text style={styles.buttonText}>{outcome === "empty" ? t("settings.close", lang) : t("workerLodge.continue", lang)}</Text></SpringPressable></Animated.View></View>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: "center", paddingHorizontal: 10, backgroundColor: "rgba(3,8,5,0.84)" }, shell: { flex: 1, width: "100%", maxWidth: 430, alignSelf: "center", overflow: "hidden", borderRadius: 24, borderWidth: 2, borderColor: "#d6a74f", backgroundColor: "#172217" }, full: { width: "100%", height: "100%" },
  header: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: "rgba(232,194,105,0.28)", backgroundColor: "rgba(48,42,24,0.96)" }, campArt: { width: 70, height: 70, borderRadius: 18, overflow: "hidden", borderWidth: 2, borderColor: "#d5a85e", backgroundColor: "#392c1d" }, headerCopy: { flex: 1, minWidth: 0 }, eyebrow: { color: "#d6a85a", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, title: { color: "#fff0bd", fontSize: 24, fontWeight: "900", fontFamily: theme.fonts.heavy }, level: { color: "#d8c88f", fontSize: 12, fontWeight: "800" }, close: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,12,5,0.6)" }, closeText: { color: "#fff2bd", fontSize: 29, lineHeight: 31, fontWeight: "800" },
  content: { padding: 13, paddingBottom: 26, gap: 12 }, storageCard: { padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: "rgba(223,184,91,0.45)", backgroundColor: "rgba(25,20,11,0.92)" }, storageReady: { borderColor: "#85cb58" }, storageFull: { borderColor: "#f1c34e", backgroundColor: "rgba(72,52,12,0.65)" }, rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, row: { flexDirection: "row", alignItems: "center", gap: 7 }, resourceIcon: { width: 31, height: 31 }, storageTitle: { color: "#fff0bd", fontSize: 17, fontWeight: "900" }, storageAmount: { color: "#efc466", fontSize: 20, fontWeight: "900", fontVariant: ["tabular-nums"] }, track: { height: 12, overflow: "hidden", marginTop: 10, borderRadius: 6, backgroundColor: "#292318" }, fill: { height: "100%", borderRadius: 6, backgroundColor: "#b87532" }, bonus: { color: "#d6c594", fontSize: 11, fontWeight: "800", marginTop: 8 },
  panel: { padding: 13, gap: 10, borderRadius: 17, borderWidth: 1, borderColor: "rgba(211,167,83,0.4)", backgroundColor: "rgba(10,19,10,0.84)" }, sectionTitle: { color: "#ffeab0", fontSize: 16, fontWeight: "900", fontFamily: theme.fonts.heavy }, workerRow: { minHeight: 90, flexDirection: "row", alignItems: "center", gap: 8 }, workerArt: { width: 86, height: 86 }, flex: { flex: 1, minWidth: 0 }, workerName: { color: "#fff0bd", fontSize: 15, fontWeight: "900" }, missionName: { color: "#d5a85a", fontSize: 12, fontWeight: "900" }, meta: { color: "#91ce72", fontSize: 11 }, timer: { color: "#9fe779", fontSize: 17, fontWeight: "900", fontVariant: ["tabular-nums"] }, detailGrid: { flexDirection: "row", gap: 8 }, detail: { flex: 1, padding: 9, borderRadius: 11, backgroundColor: "rgba(71,52,25,0.55)" }, detailLabel: { color: "#b9ad88", fontSize: 9 }, detailValue: { color: "#ffe3a0", fontSize: 12, fontWeight: "900" },
  emptyWrap: { alignItems: "center", gap: 10, padding: 10 }, empty: { color: "#aab49a", textAlign: "center" }, workerPicker: { gap: 8 }, workerChip: { width: 104, minHeight: 116, alignItems: "center", padding: 7, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(215,171,89,0.35)", backgroundColor: "#172a16" }, selected: { borderColor: "#e6b85d", backgroundColor: "#3d3420" }, chipArt: { width: 78, height: 78 }, chipText: { color: "#fff0bd", fontSize: 10, textAlign: "center", fontWeight: "900" }, missionCards: { flexDirection: "row", gap: 7 }, missionCard: { flex: 1, minWidth: 0, alignItems: "center", padding: 8, borderRadius: 13, borderWidth: 1.5, borderColor: "rgba(215,171,89,0.35)", backgroundColor: "#172a16" }, multiplier: { color: "#f0bf60", fontSize: 22, fontWeight: "900" }, cardTitle: { color: "#fff0bd", fontSize: 11, fontWeight: "900" }, cardMeta: { color: "#b9ad88", fontSize: 10 }, risk: { color: "#d29f69", fontSize: 9, textAlign: "center" }, potential: { color: "#f4d98e", textAlign: "center", fontSize: 13, fontWeight: "900" },
  sendButton: { minHeight: 49, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: "#e2c082", backgroundColor: "#9b622c" }, collectButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: "#c8e69a", backgroundColor: "#57923c" }, secondaryButton: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: 12, backgroundColor: "#71502b" }, secondaryText: { color: "#fff0bd", fontWeight: "900" }, buttonIcon: { width: 27, height: 27 }, buttonText: { color: "white", fontSize: 15, fontWeight: "900", fontFamily: theme.fonts.heavy }, disabled: { opacity: 0.38 },
  upgradeCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(231,190,91,0.48)", backgroundColor: "rgba(65,42,16,0.76)" }, costRow: { flexDirection: "row", gap: 8, marginTop: 5 }, costChip: { flexDirection: "row", alignItems: "center", gap: 2 }, costIcon: { width: 17, height: 17 }, costText: { color: "#f4dd9b", fontSize: 11, fontWeight: "900" },
  popupScrim: { ...StyleSheet.absoluteFillObject, zIndex: 40, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(2,7,3,0.86)" }, popup: { width: "100%", maxWidth: 340, alignItems: "center", overflow: "hidden", padding: 20, borderRadius: 22, borderWidth: 2, borderColor: "#d9ad5b", backgroundColor: "#26301d" }, popupTitle: { color: "#f0ca69", fontSize: 21, textAlign: "center", fontWeight: "900", fontFamily: theme.fonts.heavy }, popupWorker: { width: 145, height: 145 }, outcomeText: { color: "#d3c69b", fontSize: 12, textAlign: "center" }, rewardRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8 }, rewardIcon: { width: 44, height: 44 }, rewardAmount: { color: "#9ee67b", fontSize: 34, fontWeight: "900" }, clamped: { color: "#efc56b", fontSize: 11, textAlign: "center", marginTop: 5 }
});
