import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { buildingName, storageCap, workerCapacity } from "../../game/config/buildings";
import {
  BANANA_WORKER_ASSETS,
  LUMBER_WORKER_ASSETS,
  STONE_WORKER_ASSETS,
  WORKER_ASSETS
} from "../../game/assets/workerAssets";
import { t, type Lang } from "../../game/i18n";
import { playSound } from "../../game/audio/soundManager";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import {
  WORKER_CLASSES,
  WORKER_CLASS_ORDER,
  LUMBER_WORKER_ORDER,
  STONE_WORKER_ORDER,
  WORKER_RESOURCE_ORDER,
  expeditionStatus,
  groupWorkerExpeditions,
  managedWorkerCount
} from "../../game/state/workerExpeditions";
import {
  evaluateWorkerLodgeUpgrade,
  type WorkerLodgeUpgradeBlock
} from "../../game/state/workerLodgeUpgrades";
import { useGameStore } from "../../game/state/gameStore";
import type {
  ResourceKind,
  Resources,
  WorkerClass,
  WorkerProductionStartResult,
  WorkerExpeditionStatus
} from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { NineSliceFrame } from "./NineSliceFrame";
import { SpringPressable } from "./SpringPressable";

type WorkerLodgeModalProps = {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
};

const BATCH_SIZES = [1, 5, 10] as const;
type WorkerBatchSize = (typeof BATCH_SIZES)[number];

const RESOURCE_ASSETS: Record<
  ResourceKind,
  "resourceBanana" | "resourceStone" | "resourceWood"
> = {
  bananas: "resourceBanana",
  stones: "resourceStone",
  wood: "resourceWood"
};

const WORKER_ACCENTS: Record<WorkerClass, string> = {
  gatherer: "#d8b36a",
  skilled: "#80c9aa",
  master: "#c79cff",
  worker_lumber_apprentice: "#d4a35f",
  worker_lumber_skilled: "#78b17a",
  worker_lumber_master: "#d59b48",
  worker_stone_apprentice: "#aeb7bd",
  worker_stone_experienced: "#87939b",
  worker_stone_master: "#c7a15a"
};

function levelOf(
  buildings: ReturnType<typeof useGameStore.getState>["buildings"],
  type: "clanHall" | "workerShelter"
) {
  return buildings.find((building) => building.type === type)?.level ?? 1;
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatUpgradeCountdown(ms: number, lang: Lang) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;
  const clock = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return days > 0 ? `${days}${lang === "tr" ? "g" : "d"} ${clock}` : clock;
}

function formatUpgradeDuration(ms: number, lang: Lang) {
  if (ms % 86_400_000 === 0) return t("duration.day", lang, { n: ms / 86_400_000 });
  if (ms % 3_600_000 === 0) return t("duration.hour", lang, { n: ms / 3_600_000 });
  return t("duration.minute", lang, { n: ms / 60_000 });
}

function workerName(workerClass: WorkerClass, lang: Lang) {
  return t(`worker.${workerClass}.name`, lang);
}

function workerTier(workerClass: WorkerClass) {
  const classes = [...WORKER_CLASS_ORDER, ...LUMBER_WORKER_ORDER, ...STONE_WORKER_ORDER];
  return (classes.indexOf(workerClass) % 3) + 1;
}

function resourceName(resource: ResourceKind, lang: Lang) {
  return t(`res.${resource}`, lang);
}

function workerLodgeUpgradeBlockText(
  block: Exclude<WorkerLodgeUpgradeBlock, null>,
  lang: Lang
) {
  if (block.reason === "upgrade-active") return t("workerLodge.upgradeAlreadyActive", lang);
  if (block.reason === "clan-level") {
    return t("workerLodge.clanRequirement", lang, { level: block.requiredLevel });
  }
  if (block.reason === "storage") {
    return t("workerLodge.needStorage", lang, { amount: block.capacity });
  }
  if (block.reason === "resource") {
    return t("workerLodge.resourceMissing", lang, {
      amount: block.missing,
      resource: resourceName(block.resource, lang)
    });
  }
  return t("workerLodge.maxLevel", lang);
}

export function WorkerLodgeModal({ visible, lang, onClose }: WorkerLodgeModalProps) {
  const state = useGameStore();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(Date.now());
  const [batchSize, setBatchSize] = useState<WorkerBatchSize>(1);
  const [productionToast, setProductionToast] = useState<{
    workerClass: WorkerClass;
    count: number;
    readyInMs: number;
  } | null>(null);
  const [productionError, setProductionError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNow(Date.now());
    state.reconcileWorkTask();
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [state.reconcileWorkTask, visible]);

  useEffect(() => {
    if (!productionToast) return;
    const timer = setTimeout(() => setProductionToast(null), 2600);
    return () => clearTimeout(timer);
  }, [productionToast]);

  useEffect(() => {
    if (!productionError) return;
    const timer = setTimeout(() => setProductionError(null), 2600);
    return () => clearTimeout(timer);
  }, [productionError]);

  const lodgeLevel = levelOf(state.buildings, "workerShelter");
  const clanLevel = levelOf(state.buildings, "clanHall");
  const capacity = workerCapacity(lodgeLevel);
  const activeLodgeUpgrade = state.activeWorkerLodgeUpgrade &&
    (state.activeWorkerLodgeUpgrade.buildingType ?? "workerShelter") === "workerShelter"
    ? state.activeWorkerLodgeUpgrade
    : null;
  const managed = managedWorkerCount(
    state.workerProductionQueue,
    state.idleWorkers,
    state.workerExpeditions
  );
  const upgradeEligibility = evaluateWorkerLodgeUpgrade({
    lodgeLevel,
    clanLevel,
    resources: state.resources,
    activeUpgrade: state.activeWorkerLodgeUpgrade
  });
  const upgrade = upgradeEligibility.definition;
  const cost = upgrade?.cost ?? { bananas: 0, stones: 0, wood: 0 };
  const upgradeDisabled = !upgradeEligibility.enabled;
  const idleByClass = useMemo(
    () =>
      [...WORKER_CLASS_ORDER, ...LUMBER_WORKER_ORDER, ...STONE_WORKER_ORDER].map((workerClass) => ({
        workerClass,
        workers: state.idleWorkers.filter((worker) => worker.workerClass === workerClass)
      })),
    [state.idleWorkers]
  );
  const expeditionGroups = useMemo(
    () => groupWorkerExpeditions(state.workerExpeditions),
    [state.workerExpeditions]
  );

  function queueWorker(workerClass: WorkerClass, count: WorkerBatchSize): WorkerProductionStartResult {
    const result = state.queueWorker(workerClass, count);
    if (result === "queued") {
      setProductionError(null);
      const queue = useGameStore.getState().workerProductionQueue;
      const item = queue[queue.length - 1];
      setProductionToast({
        workerClass,
        count,
        readyInMs: Math.max(0, (item?.finishesAt ?? Date.now()) - Date.now())
      });
    } else {
      setProductionToast(null);
      setProductionError(useGameStore.getState().feedback?.text ?? t("worker.invalidSelection", lang));
    }
    return result;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View
          style={[
            styles.shell,
            { marginTop: Math.max(insets.top, 10), marginBottom: Math.max(insets.bottom, 10) }
          ]}
        >
          <NineSliceFrame preset="card" cornerSize={28} style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={styles.bodyTint} />
          <View style={styles.header}>
            <View style={styles.headerPortrait}>
              <AssetImage
                assetKey="bananaWorkerYoung"
                style={styles.headerPortraitArt}
                resizeMode="contain"
                fallback={<View />}
                hideFallbackOnLoad
              />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{t("workerLodge.eyebrow", lang)}</Text>
              <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
                {buildingName("workerShelter", lang)}
              </Text>
              <Text style={styles.capacityText}>
                {t("workerLodge.capacity", lang, { used: managed, max: capacity })}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("settings.close", lang)}
              hitSlop={10}
              onPress={() => {
                playSound("close");
                onClose();
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {productionToast ? (
            <View style={styles.productionToast} pointerEvents="none">
              <Text style={styles.productionToastTitle}>
                {t("worker.productionBatchStarted", lang, {
                  n: productionToast.count,
                  name: workerName(productionToast.workerClass, lang)
                })}
              </Text>
              <Text style={styles.productionToastSubtitle}>
                {t("worker.productionReadyIn", lang, {
                  seconds: Math.max(1, Math.ceil(productionToast.readyInMs / 1000))
                })}
              </Text>
            </View>
          ) : productionError ? (
            <View style={[styles.productionToast, styles.productionError]} pointerEvents="none">
              <Text style={styles.productionToastTitle}>{productionError}</Text>
            </View>
          ) : null}

          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(34, insets.bottom + 24) }
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.summaryRow}>
              <SummaryPill label={t("workerLodge.idle", lang)} value={state.idleWorkers.length} />
              <SummaryPill
                label={t("workerLodge.producing", lang)}
                value={state.workerProductionQueue.length}
              />
              <SummaryPill
                label={t("workerLodge.away", lang)}
                value={state.workerExpeditions.length}
              />
              <SummaryPill
                label={t("workerLodge.ready", lang)}
                value={
                  state.workerExpeditions.filter(
                    (expedition) => expeditionStatus(expedition, now) === "completed"
                  ).length
                }
                highlight
              />
            </View>

            <View style={styles.explanationCard}>
              <Text style={styles.explanationTitle}>{t("workerLodge.howItWorksTitle", lang)}</Text>
              <ExplanationLine index={1} text={t("workerLodge.howItWorksProduce", lang)} />
              <ExplanationLine index={2} text={t("workerLodge.howItWorksSend", lang)} />
              <ExplanationLine index={3} text={t("workerLodge.howItWorksConsumed", lang)} />
            </View>

            <BatchSelector value={batchSize} lang={lang} onChange={setBatchSize} />

            <SectionTitle
              title={t("workerLodge.produceTitle", lang)}
              subtitle={t("workerLodge.produceSubtitle", lang)}
            />
            <View style={styles.workerCards}>
              {WORKER_CLASS_ORDER.map((workerClass, index) => (
                <WorkerProductionCard
                  key={workerClass}
                  workerClass={workerClass}
                  tier={index + 1}
                  target={buildingName("bananaGrove", lang)}
                  artwork={BANANA_WORKER_ASSETS[workerClass]}
                  lodgeLevel={lodgeLevel}
                  batchSize={batchSize}
                  freeCapacity={Math.max(0, capacity - managed)}
                  resources={state.resources}
                  lang={lang}
                  onQueue={queueWorker}
                />
              ))}
            </View>

            <SectionTitle
              title={t("workerLodge.lumberTitle", lang)}
              subtitle={t("workerLodge.lumberSubtitle", lang)}
            />
            <View style={styles.workerCards}>
              {LUMBER_WORKER_ORDER.map((workerClass, index) => (
                <WorkerProductionCard
                  key={workerClass}
                  workerClass={workerClass}
                  tier={index + 1}
                  target={buildingName("lumberCamp", lang)}
                  artwork={LUMBER_WORKER_ASSETS[workerClass]}
                  lodgeLevel={lodgeLevel}
                  batchSize={batchSize}
                  freeCapacity={Math.max(0, capacity - managed)}
                  resources={state.resources}
                  lang={lang}
                  onQueue={queueWorker}
                />
              ))}
            </View>

            <SectionTitle
              title={t("workerLodge.stoneTitle", lang)}
              subtitle={t("workerLodge.stoneSubtitle", lang)}
            />
            <View style={styles.workerCards}>
              {STONE_WORKER_ORDER.map((workerClass, index) => (
                <WorkerProductionCard
                  key={workerClass}
                  workerClass={workerClass}
                  tier={index + 1}
                  target={buildingName("stoneQuarry", lang)}
                  artwork={STONE_WORKER_ASSETS[workerClass]}
                  lodgeLevel={lodgeLevel}
                  batchSize={batchSize}
                  freeCapacity={Math.max(0, capacity - managed)}
                  resources={state.resources}
                  lang={lang}
                  onQueue={queueWorker}
                />
              ))}
            </View>

            <SectionTitle
              title={t("workerLodge.queueTitle", lang)}
              subtitle={t("workerLodge.queueSubtitle", lang)}
            />
            <View style={styles.panel}>
              {state.workerProductionQueue.length === 0 ? (
                <EmptyText text={t("workerLodge.queueEmpty", lang)} />
              ) : (
                state.workerProductionQueue.map((item, index) => (
                  <View key={item.id} style={styles.queueRow}>
                    <WorkerMotion workerClass={item.workerClass} status={index === 0 ? "producing" : "queued"} />
                    <View style={styles.flexCopy}>
                      <View style={styles.queueTitleRow}>
                        <View style={styles.queueTierBadge}>
                          <Text style={styles.queueTierText}>T{workerTier(item.workerClass)}</Text>
                        </View>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {workerName(item.workerClass, lang)}
                        </Text>
                      </View>
                      <Text style={styles.rowMeta}>
                        {index === 0
                          ? t("workerLodge.producingStatus", lang)
                          : t("workerLodge.queuedStatus", lang, { n: index + 1 })}
                      </Text>
                    </View>
                    <Text style={styles.timer}>{formatTime(item.finishesAt - now)}</Text>
                  </View>
                ))
              )}
            </View>

            <SectionTitle
              title={t("workerLodge.idleTitle", lang)}
              subtitle={t("workerLodge.idleSubtitle", lang)}
            />
            <View style={styles.panel}>
              {state.idleWorkers.length === 0 ? (
                <EmptyText text={t("workerLodge.idleEmpty", lang)} />
              ) : (
                idleByClass
                  .filter((group) => group.workers.length > 0)
                  .map((group) => {
                    return (
                      <View key={group.workerClass} style={styles.idleGroup}>
                        <View style={styles.idleHeader}>
                          <AssetImage
                            assetKey={WORKER_ASSETS[group.workerClass]}
                            style={styles.smallPortrait}
                            resizeMode="contain"
                            fallback={<View />}
                            hideFallbackOnLoad
                          />
                          <Text style={styles.rowTitle}>
                            {workerName(group.workerClass, lang)} ×{group.workers.length}
                          </Text>
                        </View>
                      </View>
                    );
                  })
              )}
            </View>

            <SectionTitle
              title={t("workerLodge.expeditionsTitle", lang)}
              subtitle={t("workerLodge.expeditionsSubtitle", lang)}
            />
            <View style={styles.panel}>
              {expeditionGroups.length === 0 ? (
                <EmptyText text={t("workerLodge.expeditionsEmpty", lang)} />
              ) : (
                expeditionGroups.map((group) => {
                  const expedition = group.workers[0];
                  if (!expedition) return null;
                  const statuses = group.workers.map((worker) => expeditionStatus(worker, now));
                  const status: WorkerExpeditionStatus = statuses.every((value) => value === "completed")
                    ? "completed"
                    : statuses.some((value) => value === "returning" || value === "completed")
                      ? "returning"
                      : "active";
                  const expectedReward = group.workers.reduce((sum, worker) => sum + worker.expectedReward, 0);
                  const returnsAt = Math.max(...group.workers.map((worker) => worker.returnsAt));
                  const classCounts = group.workers.reduce<Partial<Record<WorkerClass, number>>>((counts, worker) => {
                    counts[worker.workerClass] = (counts[worker.workerClass] ?? 0) + 1;
                    return counts;
                  }, {});
                  const distribution = [...WORKER_CLASS_ORDER, ...LUMBER_WORKER_ORDER, ...STONE_WORKER_ORDER]
                    .map((workerClass, index) => ({ count: classCounts[workerClass] ?? 0, tier: (index % 3) + 1 }))
                    .filter((entry) => entry.count > 0)
                    .map((entry) => `${entry.count}× T${entry.tier}`)
                    .join(", ");
                  return (
                    <View
                      key={group.id}
                      style={[styles.expeditionRow, status === "completed" && styles.completedRow]}
                    >
                      <WorkerMotion workerClass={expedition.workerClass} status={status} />
                      <View style={styles.flexCopy}>
                        <Text style={styles.rowTitle}>
                          {t("workerDispatch.workerCount", lang, { n: group.workers.length })} · {distribution}
                        </Text>
                        <View style={styles.expeditionDestination}>
                          <AssetImage
                            assetKey={RESOURCE_ASSETS[expedition.resource]}
                            style={styles.tinyResource}
                            fallback={<View />}
                          />
                          <Text style={styles.rowMeta}>
                            {resourceName(expedition.resource, lang)} · {t(`worker.status.${status}`, lang)}
                          </Text>
                        </View>
                        <Text style={styles.expectedText}>
                          {t("workerLodge.expected", lang, { amount: expectedReward })}
                        </Text>
                      </View>
                      {status === "completed" ? (
                        <Text style={styles.groveCollectHint}>{t(expedition.resource === "wood" ? "lumberCamp.collectThere" : expedition.resource === "stones" ? "stoneQuarry.collectThere" : "bananaGrove.collectThere", lang)}</Text>
                      ) : (
                        <Text style={styles.timer}>{formatTime(returnsAt - now)}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.upgradePanel}>
              {activeLodgeUpgrade ? (
                <View style={styles.activeUpgrade}>
                  <View style={styles.activeUpgradeHeader}>
                    <Text style={styles.upgradeTitle}>
                      {t("workerLodge.upgradeActive", lang, {
                        level: activeLodgeUpgrade.targetLevel
                      })}
                    </Text>
                    <Text style={styles.upgradeTimer}>
                      {formatUpgradeCountdown(activeLodgeUpgrade.endsAt - now, lang)}
                    </Text>
                  </View>
                  <View style={styles.upgradeTrack}>
                    <View
                      style={[
                        styles.upgradeFill,
                        {
                          width: `${Math.min(100, Math.max(0,
                            ((now - activeLodgeUpgrade.startedAt) /
                              Math.max(1, activeLodgeUpgrade.endsAt - activeLodgeUpgrade.startedAt)) * 100
                          ))}%`
                        }
                      ]}
                    />
                  </View>
                </View>
              ) : upgrade ? (
                <>
                  <View style={styles.flexCopy}>
                    <Text style={styles.upgradeTitle}>
                      {t("workerLodge.upgradeTitle", lang, { level: lodgeLevel })} → Sv. {upgrade.targetLevel}
                    </Text>
                    <Text style={styles.upgradeMeta}>
                      {t("workerLodge.capacityUpgrade", lang, {
                        current: capacity,
                        next: workerCapacity(upgrade.targetLevel)
                      })}
                    </Text>
                    <Text style={styles.upgradeRequirement}>
                      {t("workerLodge.upgradeDuration", lang, {
                        duration: formatUpgradeDuration(upgrade.durationMs, lang)
                      })}
                    </Text>
                    {upgradeEligibility.block ? (
                      <Text style={styles.requirementBlocked}>
                        {workerLodgeUpgradeBlockText(upgradeEligibility.block, lang)}
                      </Text>
                    ) : (
                      <Text style={styles.requirementMet}>
                        {t("workerLodge.requirementsMet", lang)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.upgradeAction}>
                    <ResourceCost cost={cost} compact />
                    <SpringPressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: upgradeDisabled }}
                      onPress={() => state.upgradeBuilding("workerShelter")}
                      style={[styles.upgradeButton, upgradeDisabled && styles.disabledButton]}
                    >
                      <Text style={styles.upgradeButtonText}>
                        {upgradeEligibility.enabled
                          ? t("upgrade.button", lang)
                          : t("workerLodge.blockedButton", lang)}
                      </Text>
                    </SpringPressable>
                  </View>
                </>
              ) : (
                <Text style={styles.maxLevelText}>{t("workerLodge.maxLevelShort", lang)}</Text>
              )}
            </View>
            <Text style={styles.riskNote}>{t("workerLodge.riskNote", lang)}</Text>
            <Text style={styles.storageNote}>
              {t("workerLodge.storageNote", lang, {
                n: storageCap(clanLevel)
              })}
            </Text>
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

function WorkerProductionCard({
  workerClass,
  tier,
  target,
  artwork,
  lodgeLevel,
  batchSize,
  freeCapacity,
  resources,
  lang,
  onQueue
}: {
  workerClass: WorkerClass;
  tier: number;
  target: string;
  artwork: GameAssetKey;
  lodgeLevel: number;
  batchSize: WorkerBatchSize;
  freeCapacity: number;
  resources: Resources;
  lang: Lang;
  onQueue: (workerClass: WorkerClass, count: WorkerBatchSize) => WorkerProductionStartResult;
}) {
  const definition = WORKER_CLASSES[workerClass];
  const requiredLevel = definition.unlockLodgeLevel ?? 1;
  const locked = lodgeLevel < requiredLevel;
  const glow = useRef(new Animated.Value(0)).current;
  const costResource = WORKER_RESOURCE_ORDER.find(
    (resource) => definition.cost[resource] > 0
  ) ?? "bananas";
  const totalCost: Resources = {
    bananas: definition.cost.bananas * batchSize,
    stones: definition.cost.stones * batchSize,
    wood: definition.cost.wood * batchSize
  };
  const insufficientCapacity = freeCapacity < batchSize;
  const insufficientResources = WORKER_RESOURCE_ORDER.some(
    (resource) => resources[resource] < totalCost[resource]
  );
  const disabled = locked || insufficientCapacity || insufficientResources;

  function produce() {
    const result = onQueue(workerClass, batchSize);
    if (result !== "queued") return;
    glow.setValue(0);
    Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 130, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 420, useNativeDriver: true })
    ]).start();
  }

  const buttonLabel = locked
    ? t("workerLodge.unlockLevelRequired", lang, { level: requiredLevel })
    : insufficientCapacity
      ? t("workerLodge.batchNoCapacity", lang, { n: batchSize })
      : insufficientResources
        ? t("workerLodge.batchNoResources", lang)
        : t("workerLodge.batchProduce", lang, { n: batchSize });

  return (
    <View
      style={[styles.workerCard, { borderColor: WORKER_ACCENTS[workerClass] }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.productionGlow,
          { opacity: glow, backgroundColor: WORKER_ACCENTS[workerClass] }
        ]}
      />
      <View style={styles.workerPortraitWrap}>
        <AssetImage
          assetKey={artwork}
          style={styles.workerPortrait}
          resizeMode="contain"
          fallback={<View />}
          hideFallbackOnLoad
        />
        <View
          style={[styles.classBadge, { backgroundColor: WORKER_ACCENTS[workerClass] }]}
        >
          <Text style={styles.classBadgeText}>{["I", "II", "III"][tier - 1]}</Text>
        </View>
      </View>
      <Text style={styles.workerName} numberOfLines={2}>
        {workerName(workerClass, lang)}
      </Text>
      <Text style={styles.workerMeta} numberOfLines={1} adjustsFontSizeToFit>
        {formatTime(definition.productionMs)} · {target}
      </Text>
      <Text style={styles.productionValue}>
        {t("workerLodge.productionValue", lang, { amount: definition.baseYield })}
      </Text>
      <Text style={styles.batchMetaLabel}>{t("workerLodge.batchCost", lang)}</Text>
      <View style={styles.batchCostLine}>
        <AssetImage
          assetKey={RESOURCE_ASSETS[costResource]}
          style={styles.batchCostIcon}
          fallback={<View />}
          hideFallbackOnLoad
        />
        <Text style={styles.batchCostValue}>{totalCost[costResource]}</Text>
      </View>
      <Text style={styles.batchTime} numberOfLines={1} adjustsFontSizeToFit>
        {t("workerLodge.batchTime", lang, {
          time: formatTime(definition.productionMs * batchSize)
        })}
      </Text>
      <SpringPressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={produce}
        style={[styles.produceButton, disabled && styles.disabledButton]}
      >
        <Text style={styles.produceButtonText} numberOfLines={2} adjustsFontSizeToFit>
          {buttonLabel}
        </Text>
      </SpringPressable>
    </View>
  );
}

function BatchSelector({
  value,
  lang,
  onChange
}: {
  value: WorkerBatchSize;
  lang: Lang;
  onChange: (value: WorkerBatchSize) => void;
}) {
  return (
    <View style={styles.batchPanel}>
      <View style={styles.batchCopy}>
        <Text style={styles.batchTitle}>{t("workerLodge.batchSize", lang)}</Text>
        <Text style={styles.batchHint}>{t("workerLodge.batchHint", lang)}</Text>
      </View>
      <View style={styles.batchButtons}>
        {BATCH_SIZES.map((count) => (
          <SpringPressable
            key={count}
            accessibilityRole="button"
            accessibilityState={{ selected: value === count }}
            onPress={() => onChange(count)}
            style={[styles.batchButton, value === count && styles.batchButtonSelected]}
          >
            <Text style={[styles.batchButtonText, value === count && styles.batchButtonTextSelected]}>
              ×{count}
            </Text>
          </SpringPressable>
        ))}
      </View>
    </View>
  );
}

function ExplanationLine({ index, text }: { index: number; text: string }) {
  return (
    <View style={styles.explanationLine}>
      <View style={styles.explanationIndex}>
        <Text style={styles.explanationIndexText}>{index}</Text>
      </View>
      <Text style={styles.explanationText}>{text}</Text>
    </View>
  );
}

function SummaryPill({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.summaryPill, highlight && value > 0 && styles.summaryPillReady]}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function EmptyText({ text }: { text: string }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

function ResourceCost({ cost, compact = false }: { cost: Resources; compact?: boolean }) {
  const entries = WORKER_RESOURCE_ORDER.filter((resource) => cost[resource] > 0);
  return (
    <View style={[styles.costRow, compact && styles.costRowCompact]}>
      {entries.map((resource) => (
        <View key={resource} style={styles.costChip}>
          <AssetImage
            assetKey={RESOURCE_ASSETS[resource]}
            style={styles.costIcon}
            fallback={<View />}
          />
          <Text style={styles.costText}>{cost[resource]}</Text>
        </View>
      ))}
    </View>
  );
}

function WorkerMotion({
  status,
  workerClass
}: {
  status: WorkerExpeditionStatus | "producing" | "queued";
  workerClass: WorkerClass;
}) {
  const motion = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (status === "queued") {
      motion.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: status === "completed" ? 420 : 780,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: status === "completed" ? 420 : 780,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [motion, status]);
  const translateX = motion.interpolate({
    inputRange: [0, 1],
    outputRange:
      status === "returning" ? [4, -4] : status === "active" ? [-4, 4] : [0, 0]
  });
  const scale = motion.interpolate({
    inputRange: [0, 1],
    outputRange: status === "completed" || status === "producing" ? [0.96, 1.06] : [1, 1]
  });
  return (
    <Animated.View style={[styles.motionPortrait, { transform: [{ translateX }, { scale }] }]}>
      <AssetImage
        assetKey={WORKER_ASSETS[workerClass]}
        style={styles.motionPortraitArt}
        resizeMode="contain"
        fallback={<View />}
        hideFallbackOnLoad
      />
      {status === "returning" || status === "completed" ? (
        <View pointerEvents="none" style={styles.backpackBadge}>
          <AssetImage assetKey="propBananaBasket" style={styles.basketArt} fallback={<View />} hideFallbackOnLoad />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(3, 8, 5, 0.82)"
  },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#d6a74f",
    backgroundColor: "#182317",
    shadowColor: "#000",
    shadowOpacity: 0.65,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12
  },
  header: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232, 194, 105, 0.28)",
    backgroundColor: "rgba(31, 50, 27, 0.94)"
  },
  bodyTint: {
    position: "absolute",
    top: 87,
    right: 17,
    bottom: 15,
    left: 17,
    backgroundColor: "rgba(7, 18, 8, 0.82)"
  },
  headerPortrait: {
    width: 66,
    height: 66,
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#e1bd6a",
    backgroundColor: "#263c23"
  },
  headerPortraitArt: { width: 68, height: 68 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: "#8bd16c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    fontFamily: theme.fonts.heavy
  },
  title: {
    color: "#fff2bd",
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy
  },
  capacityText: { color: "#d9c995", fontSize: 12, fontFamily: theme.fonts.bold },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(8, 12, 7, 0.65)"
  },
  closeText: { color: "#fff2bd", fontSize: 29, lineHeight: 31, fontWeight: "800" },
  content: { padding: 12, gap: 13 },
  summaryRow: { flexDirection: "row", gap: 6 },
  summaryPill: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 3,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(226, 185, 99, 0.3)",
    backgroundColor: "rgba(11, 20, 10, 0.72)"
  },
  summaryPillReady: { borderColor: "#80d160", backgroundColor: "rgba(51, 100, 36, 0.65)" },
  summaryValue: { color: "#ffe39a", fontSize: 18, fontWeight: "900", fontFamily: theme.fonts.heavy },
  summaryLabel: { color: "#cfc29b", fontSize: 9, fontWeight: "800", fontFamily: theme.fonts.bold },
  explanationCard: {
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(146, 197, 105, 0.36)",
    backgroundColor: "rgba(28, 54, 24, 0.72)"
  },
  explanationTitle: {
    marginBottom: 1,
    color: "#f4dfa0",
    fontSize: 13,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy
  },
  explanationLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  explanationIndex: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#5e9e45"
  },
  explanationIndexText: { color: "white", fontSize: 10, fontWeight: "900" },
  explanationText: { flex: 1, color: "#d9dfc5", fontSize: 10.5, fontFamily: theme.fonts.bold },
  batchPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 185, 99, 0.35)",
    backgroundColor: "rgba(48, 34, 16, 0.74)"
  },
  batchCopy: { flex: 1, minWidth: 0 },
  batchTitle: { color: "#ffe39a", fontSize: 13, fontWeight: "900", fontFamily: theme.fonts.heavy },
  batchHint: { color: "#b7ad91", fontSize: 9.5, fontFamily: theme.fonts.bold },
  batchButtons: { flexDirection: "row", gap: 5 },
  batchButton: {
    minWidth: 44,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(225, 189, 106, 0.35)",
    backgroundColor: "rgba(16, 25, 13, 0.78)"
  },
  batchButtonSelected: { borderColor: "#d9bb62", backgroundColor: "#6e4d20" },
  batchButtonText: { color: "#bfb698", fontSize: 13, fontWeight: "900", fontFamily: theme.fonts.heavy },
  batchButtonTextSelected: { color: "#fff1b8" },
  sectionHeader: { marginTop: 8, gap: 2 },
  sectionTitle: { color: "#fff0bd", fontSize: 17, fontWeight: "900", fontFamily: theme.fonts.heavy },
  sectionSubtitle: { color: "#aeb995", fontSize: 11, fontFamily: theme.fonts.regular },
  workerCards: { flexDirection: "row", gap: 8, marginBottom: 3 },
  workerCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 265,
    alignItems: "center",
    overflow: "hidden",
    padding: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: "rgba(15, 28, 14, 0.91)"
  },
  productionGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 13 },
  workerPortraitWrap: { width: 76, height: 73, alignItems: "center", justifyContent: "center" },
  workerPortrait: { width: 77, height: 77 },
  classBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    minWidth: 22,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10
  },
  classBadgeText: { color: "#172013", fontSize: 10, fontWeight: "900" },
  workerName: {
    width: "100%",
    minHeight: 30,
    color: "#fff1c4",
    fontSize: 11.5,
    lineHeight: 14,
    textAlign: "center",
    fontWeight: "900",
    fontFamily: theme.fonts.heavy
  },
  workerMeta: { width: "100%", color: "#c4cbaa", fontSize: 8.5, textAlign: "center", fontFamily: theme.fonts.bold },
  productionValue: { marginTop: 4, color: "#9be67b", fontSize: 10.5, textAlign: "center", fontFamily: theme.fonts.heavy },
  batchMetaLabel: { marginTop: 5, color: "#9d9f86", fontSize: 8.5, fontFamily: theme.fonts.bold },
  batchCostLine: { minHeight: 21, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  batchCostIcon: { width: 19, height: 19 },
  batchCostValue: { color: "#f4dd9b", fontSize: 12, fontWeight: "900", fontFamily: theme.fonts.heavy },
  batchTime: { width: "100%", color: "#c4cbaa", fontSize: 9, textAlign: "center", fontFamily: theme.fonts.bold },
  costRow: { minHeight: 24, flexDirection: "row", justifyContent: "center", gap: 3, marginTop: 4 },
  costRowCompact: { justifyContent: "flex-end", marginTop: 0 },
  costChip: { flexDirection: "row", alignItems: "center", gap: 1 },
  costIcon: { width: 15, height: 15 },
  costText: { color: "#f4dd9b", fontSize: 9.5, fontWeight: "900" },
  produceButton: {
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9bd475",
    backgroundColor: "#4d9a3d"
  },
  produceButtonText: { color: "white", fontSize: 9.5, lineHeight: 11.5, textAlign: "center", fontWeight: "900", fontFamily: theme.fonts.heavy },
  disabledButton: { opacity: 0.38 },
  productionToast: { position: "absolute", top: 94, left: 18, right: 18, zIndex: 40, borderRadius: 13, borderWidth: 1, borderColor: "#bddd82", backgroundColor: "rgba(38,77,31,0.97)", paddingHorizontal: 12, paddingVertical: 9, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  productionToastTitle: { color: "#fff3c8", fontSize: 12, textAlign: "center", fontFamily: theme.fonts.heavy },
  productionToastSubtitle: { marginTop: 1, color: "#cbe9a9", fontSize: 10, textAlign: "center", fontFamily: theme.fonts.bold },
  productionError: { borderColor: "#efaa8d", backgroundColor: "rgba(122,43,34,0.97)" },
  panel: {
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 185, 99, 0.24)",
    backgroundColor: "rgba(8, 17, 8, 0.7)"
  },
  queueRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(226, 185, 99, 0.2)"
  },
  motionPortrait: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  motionPortraitArt: { width: 49, height: 49 },
  backpackBadge: { position: "absolute", right: -4, bottom: -3, width: 24, height: 24 },
  basketArt: { width: "100%", height: "100%" },
  flexCopy: { flex: 1, minWidth: 0 },
  queueTitleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  queueTierBadge: {
    minWidth: 25,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "rgba(213, 170, 79, 0.85)"
  },
  queueTierText: { color: "#292013", fontSize: 9, fontWeight: "900", fontFamily: theme.fonts.heavy },
  rowTitle: { color: "#fff0bd", fontSize: 13, fontWeight: "900", fontFamily: theme.fonts.heavy },
  rowMeta: { color: "#b4bea0", fontSize: 10.5, fontFamily: theme.fonts.bold },
  timer: { color: "#9be77b", fontSize: 14, fontWeight: "900", fontVariant: ["tabular-nums"] },
  emptyText: { color: "#87947b", fontSize: 12, textAlign: "center", paddingVertical: 18, paddingHorizontal: 10 },
  idleGroup: { padding: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(226, 185, 99, 0.2)" },
  idleHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  smallPortrait: { width: 34, height: 34 },
  expeditionRow: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(226, 185, 99, 0.2)"
  },
  completedRow: { backgroundColor: "rgba(70, 125, 45, 0.28)" },
  expeditionDestination: { flexDirection: "row", alignItems: "center", gap: 3 },
  tinyResource: { width: 16, height: 16 },
  expectedText: { color: "#d8c58d", fontSize: 10, fontFamily: theme.fonts.bold },
  groveCollectHint: { width: 82, color: "#9be77b", fontSize: 10, textAlign: "right", fontWeight: "900" },
  upgradePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(231, 190, 91, 0.52)",
    backgroundColor: "rgba(65, 42, 16, 0.78)"
  },
  upgradeTitle: { color: "#ffe6a2", fontSize: 14, fontWeight: "900", fontFamily: theme.fonts.heavy },
  upgradeMeta: { color: "#cdbd91", fontSize: 10.5, fontFamily: theme.fonts.bold },
  upgradeRequirement: { color: "#d8c995", fontSize: 10.5, fontFamily: theme.fonts.bold },
  requirementBlocked: { color: "#ffb56f", fontSize: 10.5, fontFamily: theme.fonts.heavy },
  requirementMet: { color: "#9be77b", fontSize: 10.5, fontFamily: theme.fonts.heavy },
  storageBlockedText: { color: "#ff9f68", fontSize: 10.5, fontWeight: "900", marginTop: 2 },
  activeUpgrade: { flex: 1, minWidth: 0 },
  activeUpgradeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  upgradeTimer: { color: "#9bea77", fontSize: 13, fontWeight: "900", fontVariant: ["tabular-nums"] },
  upgradeTrack: { height: 9, overflow: "hidden", marginVertical: 7, borderRadius: 5, backgroundColor: "rgba(11,20,9,0.75)" },
  upgradeFill: { height: "100%", borderRadius: 5, backgroundColor: "#6fc551" },
  maxLevelText: { flex: 1, color: "#ffe6a2", fontSize: 15, textAlign: "center", fontWeight: "900" },
  upgradeAction: { alignItems: "flex-end" },
  upgradeButton: {
    minWidth: 92,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#b56b25"
  },
  upgradeButtonText: { color: "white", fontSize: 10, fontWeight: "900", fontFamily: theme.fonts.heavy },
  riskNote: { color: "#b6aa87", fontSize: 10, textAlign: "center", marginTop: 2 },
  storageNote: { color: "#7e8c76", fontSize: 9.5, textAlign: "center" }
});
