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
import { buildingName, storageCap } from "../../game/config/buildings";
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
  BANANA_GROVE_MAX_WORKERS,
  bananaGroveCapacity,
  expeditionStatus,
  groupWorkerExpeditions,
  managedWorkerCount,
  isLumberWorkerClass,
  isStoneWorkerClass,
  lumberCampCapacity,
  stoneQuarryCapacity,
  workerCapacity
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
  WorkerCollectionSummary,
  WorkerProductionItem,
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
  const [collection, setCollection] = useState<WorkerCollectionSummary | null>(null);
  const [productionToast, setProductionToast] = useState<{
    workerClass: WorkerClass;
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
  const bananaAssignments = state.workerExpeditions.filter(
    (expedition) => expedition.resource === "bananas"
  ).length;
  const groveLevel = state.buildings.find((building) => building.type === "bananaGrove")?.level ?? 1;
  const groveFull = state.bananaGroveStorage >= bananaGroveCapacity(groveLevel);
  const lumberLevel = state.buildings.find((building) => building.type === "lumberCamp")?.level ?? 1;
  const lumberFull = state.lumberCampStorage >= lumberCampCapacity(lumberLevel);
  const lumberBusy = state.workerExpeditions.some((expedition) => expedition.resource === "wood");
  const stoneLevel = state.buildings.find((building) => building.type === "stoneQuarry")?.level ?? 1;
  const stoneFull = state.stoneQuarryStorage >= stoneQuarryCapacity(stoneLevel);
  const stoneBusy = state.workerExpeditions.some((expedition) => expedition.resource === "stones");
  const expeditionGroups = useMemo(
    () => groupWorkerExpeditions(state.workerExpeditions),
    [state.workerExpeditions]
  );

  function queueWorker(workerClass: WorkerClass): WorkerProductionStartResult {
    const result = state.queueWorker(workerClass);
    if (result === "queued") {
      setProductionError(null);
      const item = useGameStore
        .getState()
        .workerProductionQueue.find((entry) => entry.workerClass === workerClass);
      setProductionToast({
        workerClass,
        readyInMs: Math.max(0, (item?.finishesAt ?? Date.now()) - Date.now())
      });
    } else {
      setProductionToast(null);
      setProductionError(useGameStore.getState().feedback?.text ?? t("worker.invalidSelection", lang));
    }
    return result;
  }

  function collect(expeditionId: string) {
    const result = state.collectWorkerExpedition(expeditionId);
    if (result) {
      playSound("reward");
      setCollection(result);
    }
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
                {t("worker.productionStarted", lang, {
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
                  queueItem={state.workerProductionQueue.find((item) => item.workerClass === workerClass)}
                  now={now}
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
                  queueItem={state.workerProductionQueue.find((item) => item.workerClass === workerClass)}
                  now={now}
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
                  queueItem={state.workerProductionQueue.find((item) => item.workerClass === workerClass)}
                  now={now}
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
                      <Text style={styles.rowTitle}>{workerName(item.workerClass, lang)}</Text>
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
                    const firstWorker = group.workers[0];
                    if (!firstWorker) return null;
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
                        <View style={styles.destinationRow}>
                          {isLumberWorkerClass(group.workerClass) || isStoneWorkerClass(group.workerClass) ? (() => {
                            const stoneWorker = isStoneWorkerClass(group.workerClass);
                            const blocked = stoneWorker ? stoneBusy || stoneFull : lumberBusy || lumberFull;
                            return (
                              <SpringPressable
                                accessibilityRole="button"
                                accessibilityState={{ disabled: blocked }}
                                disabled={blocked}
                                onPress={() => state.sendWorkerExpedition(
                                  firstWorker.id,
                                  stoneWorker ? "stones" : "wood",
                                  "safe"
                                )}
                                style={[styles.destinationButton, blocked ? styles.disabledButton : null]}
                              >
                                <AssetImage assetKey={stoneWorker ? "resourceStone" : "resourceWood"} style={styles.destinationIcon} fallback={<View />} />
                                <Text style={styles.destinationText} numberOfLines={2}>
                                  {t(stoneWorker ? "stoneQuarry.assignThere" : "lumberCamp.assignThere", lang)}
                                </Text>
                              </SpringPressable>
                            );
                          })() : <SpringPressable
                            accessibilityRole="button"
                            accessibilityState={{
                              disabled:
                                bananaAssignments >= BANANA_GROVE_MAX_WORKERS || groveFull
                            }}
                            disabled={bananaAssignments >= BANANA_GROVE_MAX_WORKERS || groveFull}
                            onPress={() => state.sendWorkerExpedition(firstWorker.id, "bananas")}
                            style={[
                              styles.destinationButton,
                              bananaAssignments >= BANANA_GROVE_MAX_WORKERS || groveFull
                                ? styles.disabledButton
                                : null
                            ]}
                          >
                            <AssetImage assetKey="resourceBanana" style={styles.destinationIcon} fallback={<View />} />
                            <Text style={styles.destinationText} numberOfLines={1}>
                              {t("bananaGrove.send", lang)}
                            </Text>
                          </SpringPressable>}
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
                      {status === "completed" && expedition.resource !== "bananas" && expedition.resource !== "wood" && expedition.resource !== "stones" ? (
                        <SpringPressable
                          accessibilityRole="button"
                          onPress={() => collect(expedition.id)}
                          style={styles.collectButton}
                        >
                          <Text style={styles.collectButtonText}>{t("workerLodge.collect", lang)}</Text>
                        </SpringPressable>
                      ) : status === "completed" ? (
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

          {collection ? (
            <CollectionPopup
              summary={collection}
              lang={lang}
              onClose={() => setCollection(null)}
            />
          ) : null}
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
  queueItem,
  now,
  lang,
  onQueue
}: {
  workerClass: WorkerClass;
  tier: number;
  target: string;
  artwork: GameAssetKey;
  lodgeLevel: number;
  queueItem?: WorkerProductionItem;
  now: number;
  lang: Lang;
  onQueue: (workerClass: WorkerClass) => WorkerProductionStartResult;
}) {
  const definition = WORKER_CLASSES[workerClass];
  const requiredLevel = definition.unlockLodgeLevel ?? 1;
  const locked = lodgeLevel < requiredLevel;
  const disabled = locked || queueItem != null;
  const glow = useRef(new Animated.Value(0)).current;
  const costResource = WORKER_RESOURCE_ORDER.find(
    (resource) => definition.cost[resource] > 0
  ) ?? "bananas";

  function produce() {
    const result = onQueue(workerClass);
    if (result !== "queued") return;
    glow.setValue(0);
    Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 130, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 420, useNativeDriver: true })
    ]).start();
  }

  const buttonLabel = locked
    ? t("workerLodge.unlockLevelRequired", lang, { level: requiredLevel })
    : queueItem
      ? t("workerLodge.producingCountdown", lang, {
          time: formatTime(queueItem.finishesAt - now)
        })
      : t("workerLodge.produceWithCost", lang, {
          amount: definition.cost[costResource],
          resource: resourceName(costResource, lang)
        });

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

function CollectionPopup({
  summary,
  lang,
  onClose
}: {
  summary: WorkerCollectionSummary;
  lang: Lang;
  onClose: () => void;
}) {
  const scale = useRef(new Animated.Value(0.82)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true })
    ]).start();
  }, [opacity, scale]);
  return (
    <View style={styles.resultScrim}>
      <Animated.View style={[styles.resultCard, { opacity, transform: [{ scale }] }]}>
        <NineSliceFrame preset="card" cornerSize={26} style={StyleSheet.absoluteFill} />
        <Text style={styles.resultKicker}>{t("workerLodge.complete", lang)}</Text>
        <View style={styles.resultWorker}>
          <AssetImage
            assetKey={WORKER_ASSETS[summary.workerClass]}
            style={styles.resultWorkerArt}
            resizeMode="contain"
            fallback={<View />}
            hideFallbackOnLoad
          />
          <View pointerEvents="none" style={styles.resultBackpack}>
            <AssetImage assetKey="propBananaBasket" style={styles.basketArt} fallback={<View />} hideFallbackOnLoad />
          </View>
        </View>
        <Text style={styles.resultTitle}>
          {t("workerLodge.returned", lang, { name: workerName(summary.workerClass, lang) })}
        </Text>
        <Text style={styles.outcomeText}>{t(`worker.outcome.${summary.outcome}`, lang)}</Text>
        <View style={styles.resultReward}>
          <AssetImage
            assetKey={RESOURCE_ASSETS[summary.resource]}
            style={styles.resultResource}
            fallback={<View />}
          />
          <Text style={styles.resultAmount}>+{Math.floor(summary.collected)}</Text>
          <Text style={styles.resultResourceName}>{resourceName(summary.resource, lang)}</Text>
        </View>
        <Text style={styles.workerLeaves}>{t("workerLodge.workerLeaves", lang)}</Text>
        <SpringPressable accessibilityRole="button" onPress={onClose} style={styles.resultButton}>
          <Text style={styles.resultButtonText}>{t("workerLodge.continue", lang)}</Text>
        </SpringPressable>
      </Animated.View>
    </View>
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
  sectionHeader: { marginTop: 8, gap: 2 },
  sectionTitle: { color: "#fff0bd", fontSize: 17, fontWeight: "900", fontFamily: theme.fonts.heavy },
  sectionSubtitle: { color: "#aeb995", fontSize: 11, fontFamily: theme.fonts.regular },
  workerCards: { flexDirection: "row", gap: 8, marginBottom: 3 },
  workerCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 215,
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
  rewardLine: { flexDirection: "row", alignItems: "baseline", gap: 3, marginTop: 3 },
  rewardLabel: { color: "#aeb995", fontSize: 9 },
  rewardValue: { color: "#8fe26f", fontSize: 12, fontWeight: "900" },
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
  rowTitle: { color: "#fff0bd", fontSize: 13, fontWeight: "900", fontFamily: theme.fonts.heavy },
  rowMeta: { color: "#b4bea0", fontSize: 10.5, fontFamily: theme.fonts.bold },
  timer: { color: "#9be77b", fontSize: 14, fontWeight: "900", fontVariant: ["tabular-nums"] },
  emptyText: { color: "#87947b", fontSize: 12, textAlign: "center", paddingVertical: 18, paddingHorizontal: 10 },
  idleGroup: { padding: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(226, 185, 99, 0.2)" },
  idleHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 7 },
  smallPortrait: { width: 34, height: 34 },
  destinationRow: { flexDirection: "row", gap: 6 },
  destinationButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(139, 205, 99, 0.55)",
    backgroundColor: "rgba(55, 102, 42, 0.72)"
  },
  destinationIcon: { width: 22, height: 22 },
  destinationText: { flexShrink: 1, color: "#f7edc8", fontSize: 10, fontWeight: "900", fontFamily: theme.fonts.bold },
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
  collectButton: {
    minWidth: 70,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#d9bb62",
    backgroundColor: "#579f3e"
  },
  collectButtonText: { color: "white", fontSize: 11, fontWeight: "900", fontFamily: theme.fonts.heavy },
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
  storageNote: { color: "#7e8c76", fontSize: 9.5, textAlign: "center" },
  resultScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(2, 7, 3, 0.82)"
  },
  resultCard: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    overflow: "hidden",
    padding: 20,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#e0bb5c",
    backgroundColor: "#20331c"
  },
  resultKicker: { color: "#8fe76c", fontSize: 13, fontWeight: "900", letterSpacing: 0.6 },
  resultWorker: { width: 120, height: 112, alignItems: "center", justifyContent: "center" },
  resultWorkerArt: { width: 122, height: 122 },
  resultBackpack: { position: "absolute", right: 3, bottom: 4, width: 52, height: 52 },
  resultTitle: { color: "#fff0bd", fontSize: 19, textAlign: "center", fontWeight: "900", fontFamily: theme.fonts.heavy },
  outcomeText: { color: "#c9bc91", fontSize: 12, textAlign: "center", marginTop: 3 },
  resultReward: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  resultResource: { width: 39, height: 39 },
  resultAmount: { color: "#9aeb75", fontSize: 29, fontWeight: "900", fontFamily: theme.fonts.heavy },
  resultResourceName: { color: "#e6d7a5", fontSize: 13, fontWeight: "800" },
  workerLeaves: { color: "#988d70", fontSize: 10.5, textAlign: "center", marginTop: 8 },
  resultButton: {
    minWidth: 170,
    minHeight: 47,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#b9e18e",
    backgroundColor: "#579f3e"
  },
  resultButtonText: { color: "white", fontSize: 15, fontWeight: "900", fontFamily: theme.fonts.heavy }
});
