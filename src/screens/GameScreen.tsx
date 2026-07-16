import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AssetImage } from "../components/game/AssetImage";
import { FadeIn } from "../components/game/FadeIn";
import { RaidBoard } from "../components/game/RaidBoard";
import { RaidMapScreen } from "../components/game/RaidMapScreen";
import { SettingsModal } from "../components/game/SettingsModal";
import { DailyRewardModal } from "../components/game/DailyRewardModal";
import { NineSliceFrame } from "../components/game/NineSliceFrame";
import { FestivalChestFlow } from "../components/game/FestivalChestFlow";
import { FestivalChestModal } from "../components/game/FestivalChestModal";
import { GemStoreModal } from "../components/game/GemStoreModal";
import { MonkeyCollectionModal } from "../components/game/MonkeyCollectionModal";
import { OfflineModal } from "../components/game/OfflineModal";
import { ShopHubModal } from "../components/game/ShopHubModal";
import { QuestModal } from "../components/game/QuestModal";
import { ShopModal } from "../components/game/ShopModal";
import { SpringPressable } from "../components/game/SpringPressable";
import { PopIn, TapHint } from "../components/game/Vfx";
import { VillageBoard } from "../components/game/VillageBoard";
import { VillageShortcutDock, VILLAGE_SHORTCUT_DOCK_HEIGHT } from "../components/game/VillageShortcutDock";
import { WorkerLodgeModal } from "../components/game/WorkerLodgeModal";
import { BananaGroveModal } from "../components/game/BananaGroveModal";
import { LumberCampModal, StoneQuarryModal } from "../components/game/LumberCampModal";
import { playSound } from "../game/audio/soundManager";
import { markTutorialForReplay, TUTORIAL_SEEN_KEY } from "../game/settings/tutorial";
import type { GameAssetKey } from "../game/assets/gameAssets";
import { RUSH_GEM_COST } from "../game/config/constants";
import {
  MAX_TROOP_UPGRADE_LEVEL,
  TROOPS,
  TROOP_TYPES,
  armyCapacity,
  armyHousing,
  armyPower,
  troopCombatStats,
  troopCountByType,
  troopUpgradeCost,
  troopUpgradeRequirement
} from "../game/config/troops";
import {
  buildingEffect,
  buildingName,
  storageCap,
  upgradeCost
} from "../game/config/buildings";
import { RAID_CAMPS, getCamp } from "../game/config/camps";
import { todayKey } from "../game/config/dailyRewards";
import { claimableQuestCount } from "../game/config/quests";
import {
  getCosmeticAppearance
} from "../game/config/profileMonkeys";
import { t } from "../game/i18n";
import { useGameStore } from "../game/state/gameStore";
import { bananaGroveCapacity, lumberCampCapacity, stoneQuarryCapacity } from "../game/state/workerExpeditions";
import type {
  Lang,
  FeedbackMessage,
  ProductionItem,
  Resources,
  Unit,
  UnitType,
  TroopType,
  TroopUpgradeLevels,
  TroopUpgradeStat,
  VillageBuilding,
  VillageBuildingType
} from "../game/types/game";
import { theme } from "../theme/theme";

const PHONE_FRAME_WIDTH = 430;
const tutorialKeys = ["tut.0", "tut.1", "tut.2", "tut.3"];

function levelOf(buildings: VillageBuilding[], type: VillageBuildingType) {
  return buildings.find((building) => building.type === type)?.level ?? 0;
}

function useCountUp(value: number) {
  const [display, setDisplay] = useState(value);
  const animRef = useRef<Animated.Value | null>(null);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (value === from) {
      return;
    }
    if (Math.abs(value - from) < 5) {
      shownRef.current = value;
      setDisplay(value);
      return;
    }
    if (!animRef.current) {
      animRef.current = new Animated.Value(from);
    }
    const anim = animRef.current;
    anim.setValue(from);
    const listener = anim.addListener(({ value: v }) => {
      shownRef.current = Math.round(v);
      setDisplay(Math.round(v));
    });
    Animated.timing(anim, {
      toValue: value,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false
    }).start(() => {
      anim.removeListener(listener);
      shownRef.current = value;
      setDisplay(value);
    });
    return () => anim.removeListener(listener);
  }, [value]);

  return display;
}

// Compact display so 4+ digit stockpiles fit the HUD pills on small screens.
function formatAmount(value: number) {
  if (value >= 10000) {
    return `${Math.round(value / 1000)}K`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(value);
}

type ShopScreen = "hub" | "gems" | "festival" | "monkeys" | "resources" | null;

export function GameScreen() {
  const state = useGameStore();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const layoutWidth = Math.min(width, PHONE_FRAME_WIDTH);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [shopScreen, setShopScreen] = useState<ShopScreen>(null);
  const [showCollection, setShowCollection] = useState(false);
  const [showWorkerLodge, setShowWorkerLodge] = useState(false);
  const [showBananaGrove, setShowBananaGrove] = useState(false);
  const [showLumberCamp, setShowLumberCamp] = useState(false);
  const [showStoneQuarry, setShowStoneQuarry] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const dailyAutoShown = useRef(false);
  const [selectedBuilding, setSelectedBuilding] = useState<VillageBuildingType | null>(null);
  const [villageFeedback, setVillageFeedback] = useState<FeedbackMessage | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const villageScrollRef = useRef<ScrollView>(null);
  const trainingScrollPending = useRef(false);
  const lang = state.language;
  const queuedTroopTypes = state.productionQueue
    .map((item) => item.type)
    .filter((type): type is TroopType => TROOP_TYPES.includes(type as TroopType));
  const housingUsed = armyHousing(state.units, queuedTroopTypes);
  const currentArmyPower = armyPower(state.units);
  const troopCounts = troopCountByType(state.units);
  const clanLevel = levelOf(state.buildings, "clanHall");
  const activeCamp = getCamp(state.activeCampId ?? "");
  const activeCampLoot =
    state.lastRaidReward?.loot ?? activeCamp?.loot ?? { bananas: 0, stones: 0, wood: 0 };
  // Use more of the viewport while retaining a scroll-safe fit on short phones.
  const boardMaxSize = Math.max(260, Math.min(layoutWidth - 8, 430, Math.round(height * 0.58)));
  const inlineSelectedBuilding =
    selectedBuilding === "workerShelter" || selectedBuilding === "bananaGrove" || selectedBuilding === "lumberCamp" || selectedBuilding === "stoneQuarry"
      ? null
      : selectedBuilding;

  const clearBuildingSelection = useCallback(() => {
    setSelectedBuilding(null);
    setShowWorkerLodge(false);
    setShowBananaGrove(false);
    setShowLumberCamp(false);
    setShowStoneQuarry(false);
  }, []);

  const collectBananaGroveReward = useCallback(() => {
    if (state.collectBananaGrove()) {
      playSound("reward");
    }
  }, [state.collectBananaGrove]);

  const collectLumberCampReward = useCallback(() => {
    if (state.collectLumberCamp()) {
      playSound("reward");
    }
  }, [state.collectLumberCamp]);

  const collectStoneQuarryReward = useCallback(() => {
    if (state.collectStoneQuarry()) {
      playSound("reward");
    }
  }, [state.collectStoneQuarry]);

  const selectBuilding = useCallback((type: VillageBuildingType) => {
    playSound("tap");
    setSelectedBuilding(type);
    setShowWorkerLodge(type === "workerShelter");
    setShowBananaGrove(type === "bananaGrove");
    setShowLumberCamp(type === "lumberCamp");
    setShowStoneQuarry(type === "stoneQuarry");

    if (type === "trainingNest") {
      trainingScrollPending.current = true;
    } else if (type !== "workerShelter" && type !== "bananaGrove" && type !== "lumberCamp" && type !== "stoneQuarry") {
      requestAnimationFrame(() => villageScrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      state.tickGame();
    }, 150);

    return () => clearInterval(timer);
  }, [state.tickGame]);

  useEffect(() => {
    if (feedbackTimeout.current) {
      clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }
    feedbackOpacity.stopAnimation();
    if (state.gameMode !== "village" || !state.feedback) {
      feedbackOpacity.setValue(0);
      setVillageFeedback(null);
      return;
    }
    const message = state.feedback;
    setVillageFeedback(message);
    feedbackOpacity.setValue(1);
    feedbackTimeout.current = setTimeout(() => {
      feedbackTimeout.current = null;
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) {
          setVillageFeedback(null);
          state.dismissFeedback(message.id);
        }
      });
    }, 1500);
    return () => {
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current);
        feedbackTimeout.current = null;
      }
      feedbackOpacity.stopAnimation();
    };
  }, [feedbackOpacity, state.dismissFeedback, state.feedback, state.gameMode]);

  useEffect(() => {
    if (state.gameMode !== "village") {
      clearBuildingSelection();
    }
  }, [clearBuildingSelection, state.gameMode]);

  const raidPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(raidPulse, {
          toValue: 1.045,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(raidPulse, {
          toValue: 1,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [raidPulse]);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(TUTORIAL_SEEN_KEY)
      .then((seen) => {
        if (mounted && !seen) {
          setShowTutorial(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setShowTutorial(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  function closeTutorial() {
    setShowTutorial(false);
    void AsyncStorage.setItem(TUTORIAL_SEEN_KEY, "true");
  }

  function nextTutorialStep() {
    if (tutorialStep >= tutorialKeys.length - 1) {
      closeTutorial();
      return;
    }

    setTutorialStep((step) => step + 1);
  }

  const nestLevel = levelOf(state.buildings, "trainingNest");
  const equippedAppearance = getCosmeticAppearance(
    state.equippedProfileMonkey,
    state.equippedProfileSkin
  );
  const queuedTypes = new Set(state.productionQueue.map((item) => item.type));
  const compactHud = layoutWidth < 370;
  const currentDayKey = todayKey();
  const claimableQuests = claimableQuestCount(
    state.questDayKey === currentDayKey ? state.questProgress : {},
    state.questDayKey === currentDayKey ? state.questsClaimed : []
  );
  const dailyAvailable = state.dailyLastClaim !== currentDayKey;
  const attentionNow = Date.now();
  const bananaReadyCount = state.workerExpeditions.filter(
    (entry) => entry.resource === "bananas" && entry.storedReward !== undefined
  ).length;
  const lumberReadyCount = state.workerExpeditions.filter(
    (entry) => entry.resource === "wood" && entry.storedReward !== undefined
  ).length;
  const stoneReadyCount = state.workerExpeditions.filter(
    (entry) => entry.resource === "stones" && entry.storedReward !== undefined
  ).length;
  const shortcutBadges = {
    workerShelter:
      state.workerProductionQueue.filter((item) => item.finishesAt <= attentionNow).length +
      (state.activeWorkerLodgeUpgrade && state.activeWorkerLodgeUpgrade.endsAt <= attentionNow ? 1 : 0),
    bananaGrove: Math.max(bananaReadyCount, state.bananaGroveStorage > 0 ? 1 : 0),
    lumberCamp: Math.max(lumberReadyCount, state.lumberCampStorage > 0 ? 1 : 0),
    stoneQuarry: Math.max(stoneReadyCount, state.stoneQuarryStorage > 0 ? 1 : 0),
    trainingNest: state.productionQueue.filter((item) => item.finishAt <= attentionNow).length
  };

  // Auto-open the daily reward once per launch, but wait until the
  // welcome-back (offline) modal has been dismissed so they don't stack.
  useEffect(() => {
    if (!dailyAutoShown.current && dailyAvailable && state.offlineReport == null) {
      dailyAutoShown.current = true;
      setShowDaily(true);
    }
  }, [dailyAvailable, state.offlineReport]);

  return (
    <View style={styles.safeScreen}>
      <AssetImage
        assetKey="bgJungleWorldCompact"
        resizeMode="cover"
        style={styles.backgroundArt}
        fallback={<View style={styles.backgroundFallback} />}
      />
      <View style={styles.backgroundShade} />

      <ScrollView
        ref={villageScrollRef}
        style={styles.screen}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom:
              theme.spacing.md + insets.bottom +
              (state.gameMode === "village" ? VILLAGE_SHORTCUT_DOCK_HEIGHT + 12 : 0)
          }
        ]}
        scrollEnabled={state.gameMode !== "village" || inlineSelectedBuilding !== null}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.heroBadge}>
            <SpringPressable
              accessibilityRole="button"
              accessibilityLabel={t("collection.profileLabel", lang)}
              hitSlop={8}
              onPress={() => setShowCollection(true)}
              style={styles.avatarMedallion}
            >
              <View style={styles.avatarClip}>
                <AssetImage
                  assetKey={equippedAppearance.portraitAsset}
                  style={styles.avatar}
                  imageStyle={styles.avatarArt}
                  resizeMode="contain"
                  fallback={<AvatarFallback />}
                  hideFallbackOnLoad
                />
              </View>
              <View style={styles.levelSeal}>
                <Text style={styles.levelSealText} maxFontSizeMultiplier={theme.maxFontScale}>
                  {t("common.levelBadge", lang, { n: clanLevel })}
                </Text>
              </View>
            </SpringPressable>
            <View style={styles.namePlate}>
              <Text
                style={styles.clanName}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                maxFontSizeMultiplier={theme.maxFontScale}
              >Monkey Tribe</Text>
              <Text style={styles.clanSubtitle} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>{t("clan.subtitle", lang)}</Text>
            </View>
          </View>

          <View style={styles.topButtons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("gemStore.title", lang)}
              onPress={() => {
                playSound("open");
                setShopScreen("gems");
              }}
              style={styles.gemPill}
            >
              <AssetImage assetKey="resourceJungleGem" style={styles.gemIcon} fallback={<View />} />
              <Text style={styles.gemText} maxFontSizeMultiplier={theme.maxFontScale}>{state.gems}</Text>
              <Text style={styles.gemPlus} maxFontSizeMultiplier={theme.maxFontScale}>+</Text>
            </Pressable>
            <TopIcon
              label={t("shopHub.title", lang)}
              glyph="🛖"
              onPress={() => {
                playSound("open");
                setShopScreen("hub");
              }}
            />
            <TopIcon
              label="Ayarlar"
              glyph="⚙"
              onPress={() => {
                playSound("open");
                setShowSettings(true);
              }}
            />
          </View>
        </View>

        <View style={styles.resourceBar}>
          <ResourceChip label="Muz" value={Math.floor(state.resources.bananas)} assetKey="resourceBanana" compact={compactHud} />
          <ResourceChip label="Taş" value={Math.floor(state.resources.stones)} assetKey="resourceStone" compact={compactHud} />
          <ResourceChip label="Odun" value={Math.floor(state.resources.wood)} assetKey="resourceWood" compact={compactHud} />
          <ResourceChip
            label={t("res.population", lang)}
            value={`${housingUsed}/${armyCapacity(nestLevel)}`}
            assetKey="resourcePopulation"
            compact={compactHud}
          />
        </View>

        {state.gameMode === "raidMap" ? (
          <FadeIn key="raidmap">
            <RaidMapScreen
              troopCounts={troopCounts}
              housingUsed={housingUsed}
              housingCapacity={armyCapacity(nestLevel)}
              armyPower={currentArmyPower}
              trainingNestLevel={nestLevel}
              raidLevel={state.raidLevel}
              watchTowerLevel={levelOf(state.buildings, "watchTower")}
              lang={lang}
              onAttack={state.startRaidOn}
              onClose={state.closeRaidMap}
            />
          </FadeIn>
        ) : state.gameMode === "raid" ? (
          <FadeIn key="raid" style={styles.raidStage}>
            <RaidBoard
              units={state.units}
              enemyCampHp={state.enemyCampHp}
              enemyCampMaxHp={state.enemyCampMaxHp}
              raidStatus={state.raidStatus}
              stars={state.raidStars}
              loot={activeCampLoot}
              rewardMultiplier={state.lastRaidReward?.multiplier ?? 1}
              gemReward={state.lastRaidReward?.gems ?? 0}
              penalty={state.lastRaidPenalty}
              armyResult={state.lastRaidArmyResult}
              playerIdentityAsset={equippedAppearance.raidAsset}
              lang={lang}
              maxSize={Math.min(width - theme.spacing.md * 2, 404)}
              feedbackText={state.feedback?.text}
              campLevel={activeCamp?.level ?? 1}
              strongholdLevelUp={
                state.raidStatus === "victory" &&
                state.activeCampId?.startsWith("stronghold-")
                  ? state.raidLevel
                  : null
              }
              onReturn={state.returnToVillage}
              onRetreat={state.retreatFromRaid}
            />
          </FadeIn>
        ) : (
          <>
            <View style={styles.boardShell}>
              <View style={styles.boardShellInner}>
                <View style={styles.boardFloaters}>
                  <TopIcon
                    label="Günlük Ödül"
                    glyph="🎁"
                    badge={dailyAvailable ? 1 : 0}
                    onPress={() => {
                      playSound("open");
                      setShowDaily(true);
                    }}
                  />
                  <TopIcon
                    label="Görevler"
                    glyph="🎯"
                    badge={claimableQuests}
                    onPress={() => {
                      playSound("open");
                      setShowQuests(true);
                    }}
                  />
                </View>
                <VillageBoard
                  tiles={state.mapTiles}
                  buildings={state.buildings}
                  lang={lang}
                  maxSize={boardMaxSize}
                  feedbackText={villageFeedback?.text}
                  feedbackOpacity={feedbackOpacity}
                  selectedType={selectedBuilding}
                  bananaWorkers={state.workerExpeditions.filter((entry) => entry.resource === "bananas")}
                  bananaGroveStorage={state.bananaGroveStorage}
                  bananaGroveCapacity={bananaGroveCapacity(levelOf(state.buildings, "bananaGrove"))}
                  lumberWorkers={state.workerExpeditions.filter((entry) => entry.resource === "wood")}
                  lumberCampStorage={state.lumberCampStorage}
                  lumberCampCapacity={lumberCampCapacity(levelOf(state.buildings, "lumberCamp"))}
                  stoneWorkers={state.workerExpeditions.filter((entry) => entry.resource === "stones")}
                  stoneQuarryStorage={state.stoneQuarryStorage}
                  stoneQuarryCapacity={stoneQuarryCapacity(levelOf(state.buildings, "stoneQuarry"))}
                  onBuildingPress={selectBuilding}
                  onCollectBananas={collectBananaGroveReward}
                  onCollectWood={collectLumberCampReward}
                  onCollectStone={collectStoneQuarryReward}
                />
              </View>
            </View>

            {inlineSelectedBuilding === "trainingNest" ? (
              <View
                onLayout={(event) => {
                  if (!trainingScrollPending.current) return;
                  trainingScrollPending.current = false;
                  const y = Math.max(0, event.nativeEvent.layout.y - theme.spacing.sm);
                  requestAnimationFrame(() => villageScrollRef.current?.scrollTo({ y, animated: true }));
                }}
              >
                  <TrainingNestControls
                    lang={lang}
                    level={nestLevel}
                    housingUsed={housingUsed}
                    maxPopulation={armyCapacity(nestLevel)}
                    armyPowerValue={currentArmyPower}
                    resources={state.resources}
                    troopCounts={troopCounts}
                    troopUpgrades={state.troopUpgrades}
                    queue={state.productionQueue}
                    queuedTypes={queuedTypes}
                    onTrain={state.trainTroop}
                    onUpgradeTroop={state.upgradeTroopStat}
                    onRush={state.rushProduction}
                    onClose={clearBuildingSelection}
                    buildingUpgrade={
                      <UpgradePanel
                        buildings={state.buildings}
                        resources={state.resources}
                        type="trainingNest"
                        lang={lang}
                        onUpgrade={() => state.upgradeBuilding("trainingNest")}
                        onClose={clearBuildingSelection}
                        showClose={false}
                      />
                    }
                  />
              </View>
            ) : inlineSelectedBuilding ? (
              <>
                <UpgradePanel
                  buildings={state.buildings}
                  resources={state.resources}
                  type={inlineSelectedBuilding}
                  lang={lang}
                  onUpgrade={() => state.upgradeBuilding(inlineSelectedBuilding)}
                  onClose={clearBuildingSelection}
                />
                {inlineSelectedBuilding === "watchTower" ? (
                  <WatchTowerControls level={levelOf(state.buildings, "watchTower")} lang={lang} />
                ) : inlineSelectedBuilding === "clanHall" ? (
                  <ClanHallControls
                    level={clanLevel}
                    raidLevel={state.raidLevel}
                    victoryCounts={state.raidVictoryCounts}
                    lang={lang}
                    pulse={raidPulse}
                    armyPowerValue={currentArmyPower}
                    onRaid={() => {
                      clearBuildingSelection();
                      state.openRaidMap();
                    }}
                  />
                ) : null}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      {state.gameMode === "village" ? (
        <VillageShortcutDock
          lang={lang}
          selectedType={selectedBuilding}
          helperAsset={equippedAppearance.villageAsset}
          badges={shortcutBadges}
          bottomInset={insets.bottom}
          onSelect={selectBuilding}
        />
      ) : null}

      <TutorialOverlay
        visible={showTutorial}
        step={tutorialStep}
        lang={lang}
        onNext={nextTutorialStep}
        onSkip={closeTutorial}
      />

      <SettingsModal
        visible={showSettings}
        lang={lang}
        onPickLanguage={state.setLanguage}
        onReplayTutorial={() => {
          void markTutorialForReplay();
          setShowSettings(false);
          setTutorialStep(0);
          setShowTutorial(true);
        }}
        onReset={() => {
          setShowSettings(false);
          state.resetGame();
        }}
        onClose={() => setShowSettings(false)}
      />

      <QuestModal visible={showQuests} lang={lang} onClose={() => setShowQuests(false)} />

      <OfflineModal
        report={state.offlineReport}
        lang={lang}
        onCollect={state.dismissOfflineReport}
      />

      <DailyRewardModal visible={showDaily} lang={lang} onClose={() => setShowDaily(false)} />

      <ShopHubModal
        visible={shopScreen === "hub"}
        lang={lang}
        onClose={() => setShopScreen(null)}
        onOpenGemStore={() => setShopScreen("gems")}
        onOpenFestivalChest={() => setShopScreen("festival")}
        onOpenMonkeys={() => setShopScreen("monkeys")}
        onOpenResourceShop={() => setShopScreen("resources")}
      />

      <ShopModal
        visible={shopScreen === "resources"}
        lang={lang}
        onClose={() => setShopScreen(null)}
        onOpenGemStore={() => setShopScreen("gems")}
      />

      {/* Profile: identity & cosmetics only — no shop content. */}
      <MonkeyCollectionModal
        visible={showCollection}
        lang={lang}
        onClose={() => setShowCollection(false)}
      />

      {/* Shop hub "Maymunlar": monkey purchase catalog. */}
      <MonkeyCollectionModal
        mode="shop"
        visible={shopScreen === "monkeys"}
        lang={lang}
        onClose={() => setShopScreen(null)}
        onOpenGemStore={() => setShopScreen("gems")}
      />

      <FestivalChestModal
        visible={shopScreen === "festival"}
        lang={lang}
        onClose={() => setShopScreen(null)}
        onOpenGemStore={() => setShopScreen("gems")}
      />

      <GemStoreModal visible={shopScreen === "gems"} lang={lang} onClose={() => setShopScreen(null)} />

      {/* Global Festival Chest reveal + pending transaction recovery. */}
      <FestivalChestFlow lang={lang} />

      <WorkerLodgeModal
        visible={showWorkerLodge}
        lang={lang}
        onClose={clearBuildingSelection}
      />
      <BananaGroveModal
        visible={showBananaGrove}
        lang={lang}
        onClose={clearBuildingSelection}
      />
      <LumberCampModal
        visible={showLumberCamp}
        lang={lang}
        onClose={clearBuildingSelection}
        onOpenWorkerLodge={() => selectBuilding("workerShelter")}
      />
      <StoneQuarryModal
        visible={showStoneQuarry}
        lang={lang}
        onClose={clearBuildingSelection}
        onOpenWorkerLodge={() => selectBuilding("workerShelter")}
      />
    </View>
  );

}

function UpgradePanel({
  buildings,
  resources,
  type,
  lang,
  onUpgrade,
  onClose,
  showClose = true
}: {
  buildings: VillageBuilding[];
  resources: Resources;
  type: VillageBuildingType;
  lang: Lang;
  onUpgrade: () => void;
  onClose: () => void;
  showClose?: boolean;
}) {
  const level = levelOf(buildings, type);
  const clanLevel = levelOf(buildings, "clanHall");
  const cost = upgradeCost(type, level);
  const gated = type !== "clanHall" && level >= clanLevel;
  const disabled = gated || !hasResources(resources, cost);

  return (
    <View style={styles.upgradePanel}>
      <View style={styles.upgradeMain}>
      <View style={styles.upgradeInfo}>
        <View style={styles.upgradeTitleRow}>
          <Text style={styles.upgradeName} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
            {buildingName(type, lang)}
          </Text>
          <View style={styles.upgradeLevelChip}>
            <Text style={styles.upgradeLevelChipText} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("common.levelBadge", lang, { n: level })}
            </Text>
          </View>
        </View>
        <View style={styles.effectComparison}>
          <Text style={styles.effectLine} maxFontSizeMultiplier={theme.maxFontScale}>
            <Text style={styles.effectLabel}>{t("upgrade.current", lang)}: </Text>
            {buildingEffect(type, level, lang)}
          </Text>
          <View style={styles.nextEffectRow}>
            <Text style={styles.effectArrow}>→</Text>
            <Text style={styles.nextEffectLine} maxFontSizeMultiplier={theme.maxFontScale}>
              <Text style={styles.nextEffectLabel}>{t("upgrade.next", lang)}: </Text>
              {buildingEffect(type, level + 1, lang)}
            </Text>
          </View>
        </View>
      </View>
      <SpringPressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onUpgrade}
        style={[styles.upgradeButton, disabled ? styles.upgradeButtonDisabled : null]}
      >
        <NineSliceFrame preset="attackPlaque" cornerSize={18} style={StyleSheet.absoluteFill} />
        <Text style={styles.upgradeButtonLabel} maxFontSizeMultiplier={theme.maxFontScale}>{t("upgrade.button", lang)}</Text>
        {gated ? (
          <Text style={styles.upgradeButtonCost} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("upgrade.needClanHall", lang)}
          </Text>
        ) : (
          <CostChips cost={cost} light />
        )}
      </SpringPressable>
      {showClose ? <Pressable
        accessibilityRole="button"
        onPress={() => {
          playSound("close");
          onClose();
        }}
        style={styles.upgradeClose}
      >
        <Text style={styles.upgradeCloseText}>×</Text>
      </Pressable> : null}
      </View>

    </View>
  );
}

function queueUnitAsset(type: UnitType): GameAssetKey {
  if (type === "archer") {
    return "unitArcher";
  }
  if (type === "shield_guardian") return "unitShieldGuardian";
  if (type === "crossbowman") return "unitCrossbowman";
  if (type === "fighter") {
    return "unitWarrior";
  }
  return "unitWorker";
}

function TrainingNestControls({
  lang,
  level,
  housingUsed,
  maxPopulation,
  armyPowerValue,
  resources,
  troopCounts,
  troopUpgrades,
  queue,
  queuedTypes,
  onTrain,
  onUpgradeTroop,
  onRush,
  onClose,
  buildingUpgrade
}: {
  lang: Lang;
  level: number;
  housingUsed: number;
  maxPopulation: number;
  armyPowerValue: number;
  resources: Resources;
  troopCounts: Record<TroopType, number>;
  troopUpgrades: TroopUpgradeLevels;
  queue: ProductionItem[];
  queuedTypes: Set<UnitType>;
  onTrain: (type: TroopType) => void;
  onUpgradeTroop: (type: TroopType, stat: TroopUpgradeStat) => void;
  onRush: () => void;
  onClose: () => void;
  buildingUpgrade: ReactNode;
}) {
  const [section, setSection] = useState<"train" | "queue" | "upgrades">("train");

  return <View style={styles.trainingNestPanel}>
      <View style={styles.ownershipHeader}>
        <View style={styles.trainingTitleCopy}>
          <Text style={styles.ownershipTitle}>{t("trainingNest.title", lang)}</Text>
          <Text style={styles.ownershipMeta}>{t("common.levelBadge", lang, { n: level })} · {t("trainingNest.nextCapacity", lang, { n: armyCapacity(Math.min(10, level + 1)) })}</Text>
        </View>
        <View style={styles.armySummaryStack}>
          <Text style={styles.capacityBadge}>{t("trainingNest.armyCapacity", lang, { used: housingUsed, max: maxPopulation })}</Text>
          <Text style={styles.powerBadge}>{t("trainingNest.armyPower", lang, { n: armyPowerValue })}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.upgradeClose}>
          <Text style={styles.upgradeCloseText}>×</Text>
        </Pressable>
      </View>

      <View accessibilityRole="tablist" style={styles.trainingTabs}>
        {(["train", "queue", "upgrades"] as const).map((tab) => {
          const selected = section === tab;
          const label = tab === "train"
            ? t("trainingNest.units", lang)
            : tab === "queue"
              ? t("production.title", lang)
              : t("trainingNest.upgrades", lang);
          return (
            <SpringPressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setSection(tab)}
              style={[styles.trainingTab, selected ? styles.trainingTabActive : null]}
            >
              <Text style={[styles.trainingTabText, selected ? styles.trainingTabTextActive : null]} numberOfLines={1} adjustsFontSizeToFit>
                {label}{tab === "queue" && queue.length > 0 ? ` (${queue.length})` : ""}
              </Text>
            </SpringPressable>
          );
        })}
      </View>

      {section === "train" ? <View style={styles.trainingTabBody}>
        <Text style={styles.trainingSectionTitle}>{t("trainingNest.units", lang)}</Text>
        <View style={styles.troopCardGrid}>
        {TROOP_TYPES.map((type) => {
          const troop = TROOPS[type];
          const stats = troopCombatStats(type, troopUpgrades);
          const locked = level < troop.unlockLevel;
          const capacityBlocked = housingUsed + troop.housing > maxPopulation;
          const disabled = locked || capacityBlocked || !hasResources(resources, troop.cost) || queue.length >= 5;
          return <View key={type} style={[styles.troopTrainingCard, locked ? styles.troopTrainingCardLocked : null]}>
            <AssetImage assetKey={troop.artwork} style={styles.troopCardArt} fallback={<View />} />
            <View style={styles.troopCardCopy}>
              <Text style={styles.troopCardName} numberOfLines={1} adjustsFontSizeToFit>{t(`unit.${type}`, lang)}</Text>
              <Text style={styles.troopRole} numberOfLines={2}>{t(troop.roleKey, lang)}</Text>
              <Text style={styles.troopMeta}>{t("trainingNest.cardMeta", lang, { housing: troop.housing, seconds: troop.trainingDurationMs / 1000, power: stats.power })}</Text>
              <Text style={styles.troopMeta}>{t("trainingNest.owned", lang, { n: troopCounts[type] })}</Text>
              <CostChips cost={troop.cost} />
            </View>
            {locked ? <View style={styles.troopLock}><Text style={styles.troopLockText}>{t("trainingNest.unlockLevel", lang, { level: troop.unlockLevel })}</Text></View> : null}
            <SpringPressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={() => onTrain(type)} style={[styles.trainTroopButton, disabled ? styles.trainTroopButtonDisabled : null, queuedTypes.has(type) ? styles.trainTroopButtonActive : null]}>
              <Text style={styles.trainTroopButtonText}>{capacityBlocked ? t("trainingNest.full", lang) : t("trainingNest.train", lang)}</Text>
            </SpringPressable>
          </View>;
        })}
        </View>
      </View> : null}

      {section === "queue" ? <View style={styles.trainingTabBody}>
        <ProductionQueue queue={queue} lang={lang} onRush={onRush} />
        <View style={styles.queuePanel}>
          <Text style={styles.queueTitle}>{t("trainingNest.currentArmy", lang)}</Text>
          <View style={styles.currentArmyRow}>
            {TROOP_TYPES.map((type) => <View key={type} style={styles.currentArmyChip}>
              <AssetImage assetKey={TROOPS[type].artwork} style={styles.currentArmyIcon} fallback={<View />} />
              <Text style={styles.currentArmyCount}>{troopCounts[type]}×</Text>
              <Text style={styles.currentArmyName} numberOfLines={1}>{t(`unit.${type}`, lang)}</Text>
            </View>)}
          </View>
        </View>
      </View> : null}

      {section === "upgrades" ? <View style={styles.trainingTabBody}>
        {buildingUpgrade}
        <View style={styles.queuePanel}>
          <Text style={styles.queueTitle}>{t("trainingNest.upgrades", lang)}</Text>
      {TROOP_TYPES.map((type) => <View key={type} style={styles.troopUpgradeGroup}>
        <Text style={styles.troopUpgradeName}>{t(`unit.${type}`, lang)}</Text>
        {TROOPS[type].upgradeStats.map((stat) => {
          const currentLevel = troopUpgrades[type]?.[stat] ?? 0;
          const nextLevel = Math.min(MAX_TROOP_UPGRADE_LEVEL, currentLevel + 1);
          const currentStats = troopCombatStats(type, troopUpgrades);
          const nextUpgrades: TroopUpgradeLevels = { ...troopUpgrades, [type]: { ...troopUpgrades[type], [stat]: nextLevel } };
          const nextStats = troopCombatStats(type, nextUpgrades);
          const requirement = troopUpgradeRequirement(type, currentLevel);
          const cost = troopUpgradeCost(type, stat, nextLevel);
          const maxed = currentLevel >= MAX_TROOP_UPGRADE_LEVEL;
          const disabled = maxed || level < requirement || !hasResources(resources, cost);
          return <View key={stat} style={styles.troopUpgradeRow}>
            <View style={styles.troopUpgradeCopy}>
              <Text style={styles.troopUpgradeStat}>{t(`trainingNest.stat.${stat}`, lang)} · {currentLevel}/{MAX_TROOP_UPGRADE_LEVEL}</Text>
              <Text style={styles.troopUpgradeValues}>{formatTroopStat(stat, currentStats)} → {formatTroopStat(stat, nextStats)}</Text>
              {!maxed ? <CostChips cost={cost} /> : null}
            </View>
            <SpringPressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={() => onUpgradeTroop(type, stat)} style={[styles.troopUpgradeButton, disabled ? styles.trainTroopButtonDisabled : null]}>
              <Text style={styles.troopUpgradeButtonText}>{maxed ? t("trainingNest.max", lang) : level < requirement ? `${t("common.levelShort", lang)} ${requirement}` : t("upgrade.button", lang)}</Text>
            </SpringPressable>
          </View>;
        })}
      </View>)}
        </View>
      </View> : null}
  </View>;
}

function formatTroopStat(stat: TroopUpgradeStat, stats: ReturnType<typeof troopCombatStats>) {
  if (stat === "health") return String(stats.maxHp);
  if (stat === "attack") return String(stats.attack);
  if (stat === "resistance") return `${Math.round(stats.resistance * 100)}%`;
  if (stat === "attackSpeed") return `${(1000 / stats.attackIntervalMs).toFixed(2)}/s`;
  return `${Math.round(stats.armorPenetration * 100)}%`;
}

function WatchTowerControls({ level, lang }: { level: number; lang: Lang }) {
  const unlocks = [
    { level: 1, key: "watchTower.unlock.damage" },
    { level: 4, key: "watchTower.unlock.rewards" },
    { level: 5, key: "watchTower.unlock.composition" }
  ];
  return <View style={styles.buildingOwnedPanel}>
    <Text style={styles.ownershipTitle}>{t("watchTower.scoutingTitle", lang)}</Text>
    {unlocks.map((unlock) => {
      const unlocked = level >= unlock.level;
      return <View key={unlock.key} style={styles.unlockRow}>
        <Text style={[styles.unlockMark, !unlocked && styles.lockedText]}>{unlocked ? "✓" : "🔒"}</Text>
        <Text style={[styles.unlockText, !unlocked && styles.lockedText]}>{t(unlock.key, lang)}</Text>
        <Text style={[styles.unlockLevel, !unlocked && styles.lockedText]}>{t("common.levelShort", lang)} {unlock.level}</Text>
      </View>;
    })}
  </View>;
}

function ClanHallControls({
  level,
  raidLevel,
  victoryCounts,
  lang,
  pulse,
  armyPowerValue,
  onRaid
}: {
  level: number;
  raidLevel: number;
  victoryCounts: Record<string, number>;
  lang: Lang;
  pulse: Animated.Value;
  armyPowerValue: number;
  onRaid: () => void;
}) {
  const victories = Object.values(victoryCounts).reduce((sum, count) => sum + count, 0);
  return <View style={styles.buildingOwnedPanel}>
    <View style={styles.ownershipHeader}>
      <View>
        <Text style={styles.ownershipTitle}>{t("clanHall.raidHeadquarters", lang)}</Text>
        <Text style={styles.ownershipMeta}>{t("clanHall.storageSummary", lang, { current: storageCap(level), next: storageCap(level + 1) })}</Text>
      </View>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <SpringPressable accessibilityRole="button" onPress={onRaid} style={styles.raidButton}>
          <NineSliceFrame preset="raidPlaque" cornerSize={22} style={StyleSheet.absoluteFill} />
          <Text style={styles.raidText} maxFontSizeMultiplier={theme.maxFontScale}>{t("dock.raid", lang)}</Text>
        </SpringPressable>
      </Animated.View>
    </View>
    <View style={styles.raidSummaryRow}>
      <SummaryStat label={t("trainingNest.armyPowerLabel", lang)} value={armyPowerValue} />
      <SummaryStat label={t("clanHall.unlockedCamps", lang)} value={RAID_CAMPS.length + 1} />
      <SummaryStat label={t("clanHall.victories", lang)} value={victories} />
      <SummaryStat label={t("clanHall.stronghold", lang)} value={raidLevel} />
    </View>
    <Text style={styles.repeatRewardInfo}>{t("clanHall.repeatRewards", lang)}</Text>
  </View>;
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return <View style={styles.summaryStat}><Text style={styles.summaryStatValue}>{value}</Text><Text style={styles.summaryStatLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text></View>;
}

function ProductionQueue({
  queue,
  lang,
  onRush
}: {
  queue: ProductionItem[];
  lang: Lang;
  onRush: () => void;
}) {
  const now = Date.now();
  return (
    <View style={styles.queuePanel}>
      <View style={styles.queueHeader}>
        <Text style={styles.queueTitle}>{t("production.title", lang)}</Text>
        {queue.length > 0 ? <Pressable
          accessibilityRole="button"
          onPress={onRush}
          onPressIn={() => playSound("tap")}
          style={styles.rushButton}
        >
          <AssetImage assetKey="resourceJungleGem" style={styles.rushGem} fallback={<View />} />
          <Text style={styles.rushText}>
            {t("production.rush", lang)} {RUSH_GEM_COST}
          </Text>
        </Pressable> : null}
      </View>
      <View style={styles.queueSlots}>
        {queue.length === 0 ? <Text style={styles.queueEmpty}>{t("trainingNest.queueEmpty", lang)}</Text> : queue.map((item) => {
          const remain = Math.max(0, Math.ceil((item.finishAt - now) / 1000));
          return (
            <PopIn key={item.id}>
              <View style={styles.queueSlot}>
                <AssetImage
                  assetKey={queueUnitAsset(item.type)}
                  style={styles.queueIcon}
                  fallback={<View style={styles.queueIconFallback} />}
                />
                <Text style={styles.queueTimer} maxFontSizeMultiplier={theme.maxFontScale}>{remain}s</Text>
              </View>
            </PopIn>
          );
        })}
      </View>
    </View>
  );
}

function hasResources(resources: Resources, cost: Resources) {
  return (
    resources.bananas >= cost.bananas &&
    resources.stones >= cost.stones &&
    resources.wood >= cost.wood
  );
}

function ResourceChip({
  label,
  value,
  assetKey,
  compact
}: {
  label: string;
  value: number | string;
  assetKey: "resourceBanana" | "resourceStone" | "resourceWood" | "resourcePopulation";
  compact?: boolean;
}) {
  const numeric = typeof value === "number" ? value : 0;
  const counted = useCountUp(numeric);
  const shown = typeof value === "number" ? formatAmount(counted) : value;
  return (
    <View style={[styles.resourceChip, compact ? styles.resourceChipCompact : null]}>
      <View style={[styles.resourceIcon, compact ? styles.resourceIconCompact : null]}>
        <AssetImage
          assetKey={assetKey}
          style={compact ? styles.resourceIconArtCompact : styles.resourceIconArt}
          fallback={<ResourceFallback assetKey={assetKey} />}
        />
      </View>
      <Text
        style={[styles.resourceValue, compact ? styles.resourceValueCompact : null]}
        numberOfLines={1}
        maxFontSizeMultiplier={theme.maxFontScale}
      >
        {shown}
      </Text>
      <Text style={styles.hiddenLabel}>{label}</Text>
    </View>
  );
}

function ResourceFallback({
  assetKey
}: {
  assetKey: "resourceBanana" | "resourceStone" | "resourceWood" | "resourcePopulation";
}) {
  const fill =
    assetKey === "resourceBanana"
      ? "#ffd95a"
      : assetKey === "resourceStone"
        ? "#9aa1a6"
        : assetKey === "resourceWood"
          ? "#8b5a2b"
          : "#f4e8b7";
  const letter =
    assetKey === "resourceBanana" ? "B" : assetKey === "resourceStone" ? "S" : assetKey === "resourceWood" ? "W" : "P";

  return (
    <View style={styles.resourceFallback}>
      <Svg width="100%" height="100%" viewBox="0 0 48 48">
        <Circle cx="24" cy="24" r="20" fill={fill} />
      </Svg>
      <Text style={styles.resourceFallbackText}>{letter}</Text>
    </View>
  );
}

function PanelTexture({ dark = true }: { dark?: boolean }) {
  return (
    <AssetImage
      assetKey={dark ? "uiPanelDark" : "uiPanelLight"}
      resizeMode="stretch"
      style={styles.surfaceTexture}
      fallback={<View style={dark ? styles.surfaceDarkFallback : styles.surfaceLightFallback} />}
    />
  );
}

function IconFrame() {
  return (
    <AssetImage
      assetKey="uiIconFrame"
      resizeMode="stretch"
      style={styles.iconFrame}
      fallback={<View style={styles.iconFrameFallback} />}
    />
  );
}

function TopIcon({
  label,
  glyph,
  badge,
  onPress
}: {
  label: string;
  glyph: string;
  badge?: number;
  onPress?: () => void;
}) {
  return (
    <View style={styles.topIconWrap}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.topIcon}>
        <PanelTexture dark />
        <IconFrame />
        <Text style={styles.topIconText}>{glyph}</Text>
      </Pressable>
      {badge && badge > 0 ? (
        <View style={styles.topIconBadge} pointerEvents="none">
          <Text style={styles.topIconBadgeText} maxFontSizeMultiplier={theme.maxFontScale}>
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function CostChips({ cost, light }: { cost: Resources; light?: boolean }) {
  const entries = [
    { key: "b", asset: "resourceBanana" as const, amount: cost.bananas },
    { key: "s", asset: "resourceStone" as const, amount: cost.stones },
    { key: "w", asset: "resourceWood" as const, amount: cost.wood }
  ].filter((entry) => entry.amount > 0);

  return (
    <View style={styles.costRow}>
      {entries.map((entry) => (
        <View key={entry.key} style={styles.costChip}>
          <AssetImage
            assetKey={entry.asset}
            style={styles.costIcon}
            fallback={<View style={styles.costIconFallback} />}
          />
          <Text
            style={[styles.costAmount, light ? styles.costAmountLight : null]}
            maxFontSizeMultiplier={theme.maxFontScale}
          >
            {entry.amount}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ActionCard({
  title,
  cost,
  glyph,
  assetKey,
  disabled,
  active,
  onPress
}: {
  title: string;
  cost: Resources;
  glyph: string;
  assetKey?: GameAssetKey;
  disabled?: boolean;
  active?: boolean;
  onPress: () => void;
}) {
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  // Blocked taps still respond: shake + red flash + error buzz instead
  // of silently ignoring the press.
  function handleBlockedPress() {
    playSound("error", { throttleMs: 250 });
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.7, duration: 80, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 70, useNativeDriver: true })
    ]).start();
    flash.setValue(0.55);
    Animated.timing(flash, { toValue: 0, duration: 420, useNativeDriver: true }).start();
  }

  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-5, 5] });

  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      sound={disabled ? null : "tap"}
      onPress={disabled ? handleBlockedPress : onPress}
      style={[
        styles.actionCard,
        active && !disabled ? styles.actionCardActive : null,
        disabled ? styles.actionCardDisabled : null
      ]}
    >
      <NineSliceFrame preset="card" cornerSize={20} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.actionCardBody, { transform: [{ translateX: shakeX }] }]}>
        {assetKey ? (
          <AssetImage
            assetKey={assetKey}
            style={styles.actionAsset}
            fallback={<Text style={styles.actionGlyph}>{glyph}</Text>}
          />
        ) : (
          <Text style={styles.actionGlyph}>{glyph}</Text>
        )}
        <Text style={styles.actionTitle} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
          {title}
        </Text>
        <CostChips cost={cost} />
      </Animated.View>
      {disabled ? <View style={styles.actionCardScrim} /> : null}
      <Animated.View
        pointerEvents="none"
        style={[styles.actionCardFlash, { opacity: flash }]}
      />
    </SpringPressable>
  );
}

function AvatarFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Circle cx="20" cy="25" r="8" fill="#8b5e35" />
      <Circle cx="44" cy="25" r="8" fill="#8b5e35" />
      <Circle cx="32" cy="34" r="19" fill="#8b5e35" />
      <Circle cx="25" cy="32" r="3" fill="#1d1612" />
      <Circle cx="39" cy="32" r="3" fill="#1d1612" />
    </Svg>
  );
}

function TutorialOverlay({
  visible,
  step,
  lang,
  onNext,
  onSkip
}: {
  visible: boolean;
  step: number;
  lang: Lang;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalScrim}>
        <View style={styles.tutorialCard}>
          <PanelTexture dark={false} />
          <View style={styles.tutorialHeader}>
            <View style={styles.tutorialStepBadge}>
              <Text style={styles.tutorialStepBadgeText}>{step + 1}/{tutorialKeys.length}</Text>
            </View>
            <View style={styles.tutorialHeaderCopy}>
              <Text style={styles.tutorialKicker} maxFontSizeMultiplier={theme.maxFontScale}>{t("tut.quickStart", lang)}</Text>
              <Text style={styles.tutorialTitle} maxFontSizeMultiplier={theme.maxFontScale}>
                {t(`tut.title.${step}`, lang)}
              </Text>
            </View>
          </View>
          <View style={styles.tutorialDivider} />
          <View style={styles.tutorialRow}>
            <View style={styles.tutorialHintWrap}><TapHint size={30} /></View>
            <Text style={styles.tutorialStep} maxFontSizeMultiplier={theme.maxFontScale}>
              {t(tutorialKeys[step] ?? "tut.0", lang)}
            </Text>
          </View>
          <View style={styles.tutorialDots}>
            {tutorialKeys.map((_, index) => (
              <View
                key={index}
                style={[styles.tutorialDot, index === step ? styles.tutorialDotActive : null]}
              />
            ))}
          </View>
          <View style={styles.tutorialActions}>
            <Pressable style={styles.skipButton} onPress={onSkip} onPressIn={() => playSound("tap")}>
              <Text style={styles.skipText} maxFontSizeMultiplier={theme.maxFontScale}>{t("tut.skip", lang)}</Text>
            </Pressable>
            <Pressable style={styles.nextButton} onPress={onNext} onPressIn={() => playSound("tap")}>
              <Text style={styles.nextText} maxFontSizeMultiplier={theme.maxFontScale}>
                {step === tutorialKeys.length - 1 ? t("tut.play", lang) : t("tut.next", lang)}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const glass = "rgba(17, 20, 14, 0.78)";

const styles = StyleSheet.create({
  safeScreen: {
    flex: 1,
    backgroundColor: "#0f1710"
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent"
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  backgroundFallback: {
    flex: 1,
    backgroundColor: "#0f281c"
  },
  backgroundShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(4, 10, 7, 0.18)"
  },
  content: {
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    gap: 6
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  heroBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center"
  },
  avatarMedallion: {
    width: 54,
    height: 54,
    zIndex: 2,
    borderRadius: 27,
    borderWidth: 2.5,
    borderColor: "#e2b15a",
    backgroundColor: "#1b2b19",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6
  },
  avatarClip: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center"
  },
  avatar: {
    width: 50,
    height: 50
  },
  avatarArt: {
    top: 5,
    transform: [{ scale: 1.55 }]
  },
  levelSeal: {
    position: "absolute",
    right: -5,
    bottom: -5,
    minWidth: 38,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#e2b15a",
    backgroundColor: "#4f8f3a",
    paddingHorizontal: 4
  },
  levelSealText: {
    color: theme.colors.paper,
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  namePlate: {
    flexShrink: 1,
    flexGrow: 1,
    maxWidth: 190,
    minHeight: 44,
    justifyContent: "center",
    marginLeft: -12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.32)",
    backgroundColor: glass,
    paddingLeft: 20,
    paddingRight: 14,
    paddingVertical: 4,
    overflow: "hidden"
  },
  clanName: {
    color: theme.colors.paper,
    fontSize: theme.type.body,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  clanSubtitle: {
    marginTop: 1,
    color: "#d7c99d",
    fontSize: 11,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  topButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  gemPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: "rgba(14, 12, 7, 0.85)",
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: "rgba(120, 200, 255, 0.45)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  gemIcon: {
    width: 20,
    height: 20
  },
  gemText: {
    color: "#bfe6ff",
    fontSize: theme.type.title,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy
  },
  gemPlus: {
    marginLeft: 2,
    width: 15,
    height: 15,
    borderRadius: 8,
    overflow: "hidden",
    textAlign: "center",
    lineHeight: 15,
    color: "#0e2417",
    backgroundColor: "#7ec86a",
    fontSize: theme.type.small,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy
  },
  topPill: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: glass,
    paddingHorizontal: theme.spacing.sm,
    overflow: "hidden"
  },
  topPillText: {
    color: theme.colors.paper,
    fontSize: 13,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  topAccent: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#e49a25"
  },
  topAccentText: {
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  topIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.4)",
    backgroundColor: "rgba(14, 12, 7, 0.85)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  topIconText: {
    color: theme.colors.paper,
    fontSize: 17,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  topIconWrap: {
    position: "relative"
  },
  topIconBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#1a140a",
    backgroundColor: "#d94b36",
    paddingHorizontal: 4
  },
  topIconBadgeText: {
    color: theme.colors.paper,
    fontSize: theme.type.small,
    lineHeight: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  resourceBar: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2
  },
  resourceChip: {
    flex: 1,
    minWidth: 0,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.42)",
    backgroundColor: "rgba(14, 12, 7, 0.85)",
    paddingLeft: 3,
    paddingRight: 9,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  resourceIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.55)",
    overflow: "hidden",
    backgroundColor: "rgba(74, 56, 28, 0.85)",
    alignItems: "center",
    justifyContent: "center"
  },
  resourceIconArt: {
    width: 24,
    height: 24
  },
  resourceChipCompact: {
    height: 32,
    gap: 3,
    paddingRight: 6,
    paddingLeft: 2
  },
  resourceIconCompact: {
    width: 25,
    height: 25,
    borderRadius: 13
  },
  resourceIconArtCompact: {
    width: 19,
    height: 19
  },
  resourceValueCompact: {
    fontSize: 12.5
  },
  resourceFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  resourceFallbackText: {
    position: "absolute",
    color: theme.colors.ink,
    fontSize: 11,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  resourceValue: {
    flex: 1,
    color: "#ffe9ad",
    fontSize: theme.type.title,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "right"
  },
  hiddenLabel: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0
  },
  dockTabs: {
    flexDirection: "row",
    gap: 6,
    marginTop: theme.spacing.xs
  },
  dockTab: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.16)",
    backgroundColor: "rgba(54, 43, 27, 0.84)",
    paddingHorizontal: 10
  },
  dockTabActive: {
    borderColor: "rgba(198, 238, 137, 0.5)",
    backgroundColor: "rgba(68, 101, 45, 0.92)"
  },
  dockTabPressed: {
    transform: [{ scale: 0.98 }]
  },
  dockTabLabel: {
    color: "#d8ccb0",
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  dockTabLabelActive: {
    color: theme.colors.paper
  },
  dockTabBadge: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: "#d94b36"
  },
  dockTabBadgeText: {
    color: theme.colors.paper,
    fontSize: 11,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  raidStage: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xs
  },
  boardShell: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xs,
    borderRadius: 20,
    backgroundColor: "transparent",
    shadowColor: "#07150b",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8
  },
  boardShellInner: {
    borderRadius: 18,
    overflow: "hidden"
  },
  // Event buttons float over the board corner, Clash-style.
  boardFloaters: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 50,
    gap: 8,
    alignItems: "center"
  },
  hintPanel: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: theme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.3)",
    backgroundColor: glass,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden"
  },
  hintAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.55)",
    backgroundColor: "rgba(74, 56, 28, 0.85)",
    overflow: "hidden",
    alignItems: "center"
  },
  hintAvatarArt: {
    position: "absolute",
    top: -3,
    width: 56,
    height: 84
  },
  hintText: {
    flex: 1,
    color: "#e8dcbb",
    fontSize: 13,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  buildingOwnedPanel: {
    gap: 8,
    marginTop: theme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.32)",
    backgroundColor: glass,
    padding: theme.spacing.sm,
    overflow: "hidden"
  },
  trainingNestPanel: {
    gap: 8,
    marginTop: theme.spacing.xs,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.42)",
    backgroundColor: "rgba(16, 21, 14, 0.94)",
    padding: theme.spacing.sm,
    overflow: "hidden"
  },
  trainingTitleCopy: { flex: 1, minWidth: 0 },
  trainingTabs: {
    flexDirection: "row",
    gap: 5,
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.25)",
    backgroundColor: "rgba(7, 12, 7, 0.78)"
  },
  trainingTab: {
    flex: 1,
    minWidth: 0,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderRadius: 9
  },
  trainingTabActive: {
    borderWidth: 1,
    borderColor: "rgba(255, 225, 139, 0.68)",
    backgroundColor: "rgba(111, 78, 29, 0.92)"
  },
  trainingTabText: {
    color: "#b9ae90",
    fontSize: 11,
    fontFamily: theme.fonts.heavy
  },
  trainingTabTextActive: { color: "#fff0bd" },
  trainingTabBody: { gap: 6 },
  ownershipHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  ownershipTitle: { color: theme.colors.paper, fontSize: 14, fontWeight: "900", fontFamily: theme.fonts.heavy, textTransform: "uppercase" },
  ownershipMeta: { color: "#d8ccb0", fontSize: 11, fontWeight: "800", fontFamily: theme.fonts.bold },
  capacityBadge: { color: "#f1cd74", fontSize: 12, fontWeight: "900", fontFamily: theme.fonts.heavy },
  powerBadge: { color: "#9be39a", fontSize: 11, textAlign: "right", fontFamily: theme.fonts.heavy },
  armySummaryStack: { alignItems: "flex-end", gap: 2 },
  trainingSectionTitle: { color: "#d8ccb0", fontSize: 11, textTransform: "uppercase", fontFamily: theme.fonts.heavy },
  trainingCards: { flexDirection: "row", gap: 6 },
  troopCardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  troopTrainingCard: { width: "48.8%", minHeight: 188, borderRadius: 12, borderWidth: 1, borderColor: "rgba(226,177,90,0.34)", backgroundColor: "rgba(23,28,18,0.86)", padding: 7, overflow: "hidden" },
  troopTrainingCardLocked: { opacity: 0.72 },
  troopCardArt: { width: "100%", height: 76 },
  troopCardCopy: { flex: 1 },
  troopCardName: { color: theme.colors.paper, fontSize: 13, fontFamily: theme.fonts.heavy },
  troopRole: { minHeight: 24, color: "#c9b991", fontSize: 9.5, lineHeight: 12, fontFamily: theme.fonts.bold },
  troopMeta: { color: "#9be39a", fontSize: 8.5, lineHeight: 11, fontFamily: theme.fonts.bold },
  troopLock: { position: "absolute", left: 6, right: 6, top: 54, borderRadius: 7, backgroundColor: "rgba(44,25,14,0.9)", padding: 4 },
  troopLockText: { color: "#ffd58a", fontSize: 9, textAlign: "center", fontFamily: theme.fonts.heavy },
  trainTroopButton: { minHeight: 30, alignItems: "center", justifyContent: "center", marginTop: 5, borderRadius: 8, backgroundColor: "#d69227" },
  trainTroopButtonActive: { borderWidth: 1, borderColor: "#fff1a8" },
  trainTroopButtonDisabled: { opacity: 0.42 },
  trainTroopButtonText: { color: "#2d2515", fontSize: 10, fontFamily: theme.fonts.heavy },
  currentArmyRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 },
  currentArmyChip: { width: "48.8%", minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 9, backgroundColor: "rgba(28,32,20,0.86)", padding: 5 },
  currentArmyIcon: { width: 36, height: 36 },
  currentArmyCount: { color: "#f1cd74", fontSize: 12, fontFamily: theme.fonts.heavy },
  currentArmyName: { flex: 1, color: "#ddd1af", fontSize: 9, fontFamily: theme.fonts.bold },
  troopUpgradeGroup: { marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.12)", paddingTop: 6 },
  troopUpgradeName: { color: "#f1cd74", fontSize: 12, fontFamily: theme.fonts.heavy },
  troopUpgradeRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)", paddingVertical: 4 },
  troopUpgradeCopy: { flex: 1 },
  troopUpgradeStat: { color: "#e6dbba", fontSize: 10.5, fontFamily: theme.fonts.heavy },
  troopUpgradeValues: { color: "#9be39a", fontSize: 10, fontFamily: theme.fonts.bold },
  troopUpgradeButton: { width: 70, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#d69227" },
  troopUpgradeButtonText: { color: "#2d2515", fontSize: 9.5, textAlign: "center", fontFamily: theme.fonts.heavy },
  unlockRow: { minHeight: 28, flexDirection: "row", alignItems: "center", gap: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.08)" },
  unlockMark: { width: 20, color: "#91df70", fontSize: 13, fontWeight: "900" },
  unlockText: { flex: 1, color: "#eee2c1", fontSize: 11.5, fontWeight: "800", fontFamily: theme.fonts.bold },
  unlockLevel: { color: "#e2b15a", fontSize: 10.5, fontWeight: "900", fontFamily: theme.fonts.heavy },
  lockedText: { color: "#827d70" },
  raidSummaryRow: { flexDirection: "row", gap: 6 },
  summaryStat: { flex: 1, minWidth: 0, alignItems: "center", paddingVertical: 6, borderRadius: 9, backgroundColor: "rgba(20,24,16,0.7)" },
  summaryStatValue: { color: "#f1cd74", fontSize: 17, fontWeight: "900", fontFamily: theme.fonts.heavy },
  summaryStatLabel: { color: "#bdb294", fontSize: 9, fontWeight: "800", fontFamily: theme.fonts.bold },
  repeatRewardInfo: { color: "#cfc19c", fontSize: 10.5, textAlign: "center", fontFamily: theme.fonts.bold },
  queuePanel: {
    marginTop: theme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.32)",
    backgroundColor: glass,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    overflow: "hidden"
  },
  queueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6
  },
  queueTitle: {
    color: theme.colors.paper,
    fontSize: 13,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy,
    textTransform: "uppercase"
  },
  rushButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(120, 200, 255, 0.4)",
    backgroundColor: "rgba(40, 70, 95, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  rushGem: {
    width: 16,
    height: 16
  },
  rushText: {
    color: "#bfe6ff",
    fontSize: 12,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy
  },
  queueSlots: {
    flexDirection: "row",
    gap: 6
  },
  queueEmpty: { flex: 1, color: "#9e9989", fontSize: 11, textAlign: "center", fontFamily: theme.fonts.bold },
  queueSlot: {
    width: 46,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.16)",
    backgroundColor: "rgba(28, 32, 20, 0.85)"
  },
  queueIcon: {
    width: 30,
    height: 30
  },
  queueIconFallback: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255, 224, 151, 0.2)"
  },
  queueTimer: {
    color: "#f1cd74",
    fontSize: 11,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy
  },
  upgradePanel: {
    marginTop: theme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.35)",
    backgroundColor: glass,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    overflow: "hidden"
  },
  upgradeMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: 56
  },
  rosterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.4)",
    backgroundColor: "rgba(28, 32, 20, 0.85)",
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  rosterCount: {
    color: theme.colors.paper,
    fontSize: 13,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  rosterEmpty: {
    flex: 1,
    color: "#d8ccb0",
    fontSize: 12,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  upgradeInfo: {
    flex: 1,
    minWidth: 0
  },
  upgradeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  upgradeName: {
    flexShrink: 1,
    color: theme.colors.paper,
    fontSize: 15,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  upgradeLevelChip: {
    minWidth: 38,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#f3d27a",
    backgroundColor: "#6b3f16",
    paddingHorizontal: 5
  },
  upgradeLevelChipText: {
    color: "#fff4d6",
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy
  },
  effectComparison: {
    marginTop: 4,
    gap: 2
  },
  effectLine: {
    color: "#c8edaa",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: theme.fonts.bold
  },
  effectLabel: {
    color: "#8bc76a"
  },
  nextEffectRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4
  },
  effectArrow: {
    color: "#f3d27a",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy
  },
  nextEffectLine: {
    flex: 1,
    color: "#e7ddc4",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: theme.fonts.regular
  },
  nextEffectLabel: {
    color: "#f3d27a",
    fontFamily: theme.fonts.bold
  },
  upgradeButton: {
    minWidth: 108,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(122, 52, 14, 0.95)",
    backgroundColor: "#a34a10",
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5
  },
  upgradeButtonDisabled: {
    opacity: 0.55
  },

  upgradeButtonLabel: {
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textShadowColor: "rgba(60, 20, 4, 0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  },
  upgradeButtonCost: {
    color: "#ffe9ad",
    fontSize: 11,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textShadowColor: "rgba(60, 20, 4, 0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  upgradeClose: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.35)"
  },
  upgradeCloseText: {
    color: theme.colors.paper,
    fontSize: 20,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    lineHeight: 22
  },
  objectivePanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.15)",
    backgroundColor: glass,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
    overflow: "hidden"
  },
  objectiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 248, 217, 0.1)"
  },
  objectiveTitle: {
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textTransform: "uppercase"
  },
  objectiveCounter: {
    color: "#e2b15a",
    fontSize: 12,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  objectiveRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 248, 217, 0.08)"
  },
  objectiveText: {
    flex: 1,
    color: "#d8ccb0",
    fontSize: 12,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  objectiveValue: {
    color: "#d8ccb0",
    fontSize: 12,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  objectiveTextDone: {
    color: "#a7df80"
  },
  panel: {
    minHeight: 74,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.18)",
    backgroundColor: "rgba(15, 40, 28, 0.84)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    overflow: "hidden"
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  panelTitle: {
    flex: 1,
    color: theme.colors.paper,
    fontSize: 16,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  hpText: {
    color: "#a7df80",
    fontSize: 13,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  panelText: {
    marginTop: 3,
    color: "#d8ccb0",
    fontSize: 13,
    fontWeight: "700", fontFamily: theme.fonts.regular
  },
  panelHint: {
    marginTop: 5,
    color: "#e3f2cf",
    fontSize: 12,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  bottomDock: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 7,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.32)",
    backgroundColor: "rgba(42, 38, 29, 0.9)",
    padding: 6,
    overflow: "hidden"
  },
  actionCards: {
    flex: 1,
    flexDirection: "row",
    gap: 6
  },
  actionCard: {
    flex: 1,
    minHeight: 104,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#e9dcb1",
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 13,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5
  },
  actionCardDisabled: {
    borderColor: "rgba(60, 44, 22, 0.9)"
  },
  actionCardActive: {
    borderColor: "rgba(255, 210, 106, 0.9)",
    shadowColor: "#ffd66e",
    shadowOpacity: 0.5,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7
  },
  actionCardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14, 13, 8, 0.52)"
  },
  actionCardBody: {
    alignItems: "center",
    justifyContent: "center"
  },
  actionCardFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(217, 75, 54, 0.55)"
  },
  actionAsset: {
    width: 46,
    height: 46,
    marginTop: 2
  },

  actionGlyph: {
    color: "#6b4a17",
    fontSize: 26,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  actionTitle: {
    marginTop: 2,
    color: "#4a3314",
    fontSize: 12,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  costRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 4,
    marginTop: 1,
    paddingHorizontal: 6
  },
  costChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1
  },
  costIcon: {
    width: 11,
    height: 11
  },
  costIconFallback: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(107, 74, 23, 0.4)"
  },
  costAmount: {
    color: "#6b4a17",
    fontSize: 10,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  costAmountLight: {
    color: "#ffe9ad",
    textShadowColor: "rgba(60, 20, 4, 0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  raidButton: {
    width: 96,
    minHeight: 104,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#8a3d10",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.48,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 12
  },
  raidIcon: {
    color: theme.colors.paper,
    fontSize: 22,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  },
  raidText: {
    color: theme.colors.paper,
    fontSize: 20,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  },

  modalScrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6, 16, 10, 0.82)",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl
  },
  tutorialCard: {
    width: "100%",
    maxWidth: 370,
    minHeight: 360,
    maxHeight: "92%",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#8a5b24",
    backgroundColor: theme.colors.panel,
    paddingTop: 66,
    paddingBottom: 60,
    paddingHorizontal: 62,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20
  },
  tutorialHeader: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  tutorialStepBadge: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#d39c35",
    backgroundColor: "#5d3b18"
  },
  tutorialStepBadgeText: {
    color: "#fff0b3",
    fontSize: 10,
    lineHeight: 13,
    fontFamily: theme.fonts.heavy
  },
  tutorialHeaderCopy: {
    flex: 1,
    minWidth: 0
  },
  tutorialKicker: {
    color: "#74643d",
    fontSize: 8,
    lineHeight: 10,
    fontFamily: theme.fonts.heavy,
    textTransform: "uppercase"
  },
  tutorialTitle: {
    marginTop: 1,
    color: theme.colors.ink,
    fontSize: 16,
    lineHeight: 19,
    fontFamily: theme.fonts.heavy
  },
  tutorialDivider: {
    height: 1,
    marginTop: 6,
    backgroundColor: "rgba(101, 76, 31, 0.26)"
  },
  tutorialRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10
  },
  tutorialHintWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1
  },
  tutorialStep: {
    flex: 1,
    minHeight: 82,
    color: theme.colors.ink,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: theme.fonts.bold
  },
  tutorialDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 5
  },
  tutorialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9b9368"
  },
  tutorialDotActive: {
    width: 20,
    backgroundColor: theme.colors.player
  },
  tutorialActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: 10
  },
  skipButton: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(86, 73, 42, 0.35)",
    backgroundColor: "rgba(255, 248, 217, 0.36)",
    paddingHorizontal: 8
  },
  skipText: {
    color: "#62583a",
    fontSize: 11,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  nextButton: {
    flex: 1.2,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#d29b25",
    backgroundColor: theme.colors.banana,
    paddingHorizontal: 8,
    shadowColor: "#8c5d14",
    shadowOpacity: 0.26,
    shadowRadius: 5,
    elevation: 4
  },
  nextText: {
    color: theme.colors.ink,
    fontSize: 12,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  surfaceTexture: {
    ...StyleSheet.absoluteFillObject
  },
  surfaceDarkFallback: {
    flex: 1,
    backgroundColor: glass
  },
  surfaceLightFallback: {
    flex: 1,
    backgroundColor: theme.colors.panel
  },
  iconFrame: {
    ...StyleSheet.absoluteFillObject
  },
  iconFrameFallback: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.36)",
    backgroundColor: "rgba(255, 255, 255, 0.08)"
  }
});
