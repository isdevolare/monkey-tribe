import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
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
import { AssetImage } from "../components/game/AssetImage";
import { FadeIn } from "../components/game/FadeIn";
import { RaidBoard } from "../components/game/RaidBoard";
import { RaidMapScreen } from "../components/game/RaidMapScreen";
import { SettingsModal } from "../components/game/SettingsModal";
import { SpringPressable } from "../components/game/SpringPressable";
import { SpriteSheetImage } from "../components/game/SpriteSheetImage";
import { VillageBoard } from "../components/game/VillageBoard";
import { playSound } from "../game/audio/soundManager";
import { getGameAsset, type GameAssetKey } from "../game/assets/gameAssets";
import { RUSH_GEM_COST, UNIT_COSTS } from "../game/config/constants";
import { buildingName, buildingEffect, upgradeCost } from "../game/config/buildings";
import { getCamp } from "../game/config/camps";
import { t } from "../game/i18n";
import { useGameStore } from "../game/state/gameStore";
import type {
  Lang,
  ProductionItem,
  Resources,
  UnitType,
  VillageBuilding,
  VillageBuildingType
} from "../game/types/game";
import { theme } from "../theme/theme";

const TUTORIAL_KEY = "monkey-tribe:tutorial-seen";
const PHONE_FRAME_WIDTH = 430;
const tutorialKeys = ["tut.0", "tut.1", "tut.2", "tut.3"];

function levelOf(buildings: VillageBuilding[], type: VillageBuildingType) {
  return buildings.find((building) => building.type === type)?.level ?? 0;
}

// Compact display so 4+ digit stockpiles fit the HUD pills on small screens.
function formatAmount(value: number) {
  if (value >= 100000) {
    return `${Math.floor(value / 1000)}K`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(value);
}

export function GameScreen() {
  const state = useGameStore();
  const { width } = useWindowDimensions();
  const layoutWidth = Math.min(width, PHONE_FRAME_WIDTH);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<VillageBuildingType | null>(null);
  const lang = state.language;
  const population = state.units.filter(
    (unit) => unit.owner === "player" && unit.state !== "dead" && unit.hp > 0
  ).length;
  const clanLevel = levelOf(state.buildings, "clanHall");
  const fighterCount = state.units.filter(
    (unit) =>
      unit.owner === "player" &&
      (unit.type === "fighter" || unit.type === "archer") &&
      unit.state !== "dead" &&
      unit.hp > 0
  ).length;
  const activeCampLoot = getCamp(state.activeCampId ?? "")?.loot ?? {
    bananas: 0,
    stones: 0,
    wood: 0
  };
  const boardMaxSize = Math.max(260, Math.min(layoutWidth - 20, 404));

  useEffect(() => {
    const timer = setInterval(() => {
      state.tickGame();
    }, 150);

    return () => clearInterval(timer);
  }, [state.tickGame]);

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

    AsyncStorage.getItem(TUTORIAL_KEY)
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
    void AsyncStorage.setItem(TUTORIAL_KEY, "true");
  }

  function nextTutorialStep() {
    if (tutorialStep >= tutorialKeys.length - 1) {
      closeTutorial();
      return;
    }

    setTutorialStep((step) => step + 1);
  }

  const createWorkerDisabled =
    population >= state.maxPopulation || !hasResources(state.resources, UNIT_COSTS.worker);
  const trainFighterDisabled =
    levelOf(state.buildings, "trainingNest") <= 0 ||
    population >= state.maxPopulation ||
    !hasResources(state.resources, UNIT_COSTS.fighter);
  const trainArcherDisabled =
    levelOf(state.buildings, "watchTower") <= 0 ||
    population >= state.maxPopulation ||
    !hasResources(state.resources, UNIT_COSTS.archer);
  const sheet = getGameAsset("unitMonkeySheet");
  const queuedTypes = new Set(state.productionQueue.map((item) => item.type));
  const compactHud = layoutWidth < 370;

  return (
    <View style={styles.safeScreen}>
      <AssetImage
        assetKey="bgJungleGame"
        resizeMode="cover"
        style={styles.backgroundArt}
        fallback={<View style={styles.backgroundFallback} />}
      />
      <View style={styles.backgroundShade} />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.heroBadge}>
            <View style={styles.avatarMedallion}>
              <View style={styles.avatarClip}>
                <SpriteSheetImage
                  source={sheet.source}
                  sheetWidth={1341}
                  sheetHeight={1173}
                  frame={{ x: 1084, y: 18, width: 230, height: 256 }}
                  style={styles.avatar}
                  fallback={<AvatarFallback />}
                />
              </View>
              <View style={styles.levelSeal}>
                <Text style={styles.levelSealText}>{clanLevel}</Text>
              </View>
            </View>
            <View style={styles.namePlate}>
              <PanelTexture dark />
              <Text style={styles.clanName} numberOfLines={1}>Monkey Tribe</Text>
              <Text style={styles.clanSubtitle} numberOfLines={1}>{t("clan.subtitle", lang)}</Text>
            </View>
          </View>

          <View style={styles.topButtons}>
            <View style={styles.gemPill}>
              <AssetImage assetKey="resourceJungleGem" style={styles.gemIcon} fallback={<View />} />
              <Text style={styles.gemText}>{state.gems}</Text>
            </View>
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
          <ResourceChip label="Muz" value={formatAmount(Math.floor(state.resources.bananas))} assetKey="resourceBanana" compact={compactHud} />
          <ResourceChip label="Taş" value={formatAmount(Math.floor(state.resources.stones))} assetKey="resourceStone" compact={compactHud} />
          <ResourceChip label="Odun" value={formatAmount(Math.floor(state.resources.wood))} assetKey="resourceWood" compact={compactHud} />
          <ResourceChip
            label="Nüfus"
            value={`${population}/${state.maxPopulation}`}
            assetKey="resourcePopulation"
            compact={compactHud}
          />
        </View>

        {state.gameMode === "raidMap" ? (
          <FadeIn key="raidmap">
            <RaidMapScreen
              fighterCount={fighterCount}
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
              lang={lang}
              maxSize={Math.min(width - theme.spacing.md * 2, 404)}
              feedbackText={state.feedback?.text}
              onReturn={state.returnToVillage}
            />
          </FadeIn>
        ) : (
          <>
            <View style={styles.boardShell}>
              <View style={styles.boardShellInner}>
                <VillageBoard
                  tiles={state.mapTiles}
                  units={state.units}
                  buildings={state.buildings}
                  lang={lang}
                  maxSize={boardMaxSize}
                  feedbackText={state.feedback?.text}
                  selectedType={selectedBuilding}
                  onBuildingPress={(type) => {
                    playSound("tap");
                    setSelectedBuilding(type);
                  }}
                />
              </View>
            </View>

            {selectedBuilding ? (
              <UpgradePanel
                buildings={state.buildings}
                resources={state.resources}
                type={selectedBuilding}
                lang={lang}
                onUpgrade={() => state.upgradeBuilding(selectedBuilding)}
                onClose={() => setSelectedBuilding(null)}
              />
            ) : (
              <View style={styles.hintPanel}>
                <PanelTexture dark />
                <View style={styles.hintAvatar}>
                  <AssetImage
                    assetKey="menuChiefMascot"
                    style={styles.hintAvatarArt}
                    fallback={<AvatarFallback />}
                  />
                </View>
                <Text style={styles.hintText} numberOfLines={2}>
                  {t("hint.tapBuilding", lang)}
                </Text>
              </View>
            )}

            {state.productionQueue.length > 0 ? (
              <ProductionQueue
                queue={state.productionQueue}
                lang={lang}
                onRush={state.rushProduction}
              />
            ) : null}

            <View style={styles.bottomDock}>
              <PanelTexture dark />
              <View style={styles.actionCards}>
                <ActionCard
                  title={t("unit.worker", lang)}
                  cost={UNIT_COSTS.worker}
                  glyph="M"
                  assetKey="unitWorker"
                  disabled={createWorkerDisabled}
                  active={queuedTypes.has("worker")}
                  onPress={state.createWorker}
                />
                <ActionCard
                  title={t("unit.fighter", lang)}
                  cost={UNIT_COSTS.fighter}
                  glyph="X"
                  assetKey="unitWarrior"
                  disabled={trainFighterDisabled}
                  active={queuedTypes.has("fighter")}
                  onPress={state.trainFighter}
                />
                <ActionCard
                  title={t("unit.archer", lang)}
                  cost={UNIT_COSTS.archer}
                  glyph="A"
                  assetKey="unitArcher"
                  disabled={trainArcherDisabled}
                  active={queuedTypes.has("archer")}
                  onPress={state.trainArcher}
                />
              </View>
              <Animated.View style={{ transform: [{ scale: raidPulse }] }}>
                <SpringPressable
                  accessibilityRole="button"
                  onPress={state.openRaidMap}
                  style={styles.raidButton}
                >
                  <AssetImage
                    assetKey="uiButtonRaid"
                    resizeMode="contain"
                    style={styles.raidButtonArt}
                    fallback={<View style={styles.raidButtonFallback} />}
                  />
                  <Text style={styles.raidText}>{t("dock.raid", lang)}</Text>
                </SpringPressable>
              </Animated.View>
            </View>
          </>
        )}
      </ScrollView>

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
        onReset={() => {
          setShowSettings(false);
          state.resetGame();
        }}
        onClose={() => setShowSettings(false)}
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
  onClose
}: {
  buildings: VillageBuilding[];
  resources: Resources;
  type: VillageBuildingType;
  lang: Lang;
  onUpgrade: () => void;
  onClose: () => void;
}) {
  const level = levelOf(buildings, type);
  const clanLevel = levelOf(buildings, "clanHall");
  const cost = upgradeCost(type, level);
  const gated = type !== "clanHall" && level >= clanLevel;
  const disabled = gated || !hasResources(resources, cost);

  return (
    <View style={styles.upgradePanel}>
      <PanelTexture dark />
      <View style={styles.upgradeInfo}>
        <Text style={styles.upgradeName} numberOfLines={1}>
          {buildingName(type, lang)}
        </Text>
        <Text style={styles.upgradeMeta}>
          {t("common.level", lang)} {level} · {buildingEffect(type, level, lang)}
        </Text>
        <Text style={styles.upgradeNext}>
          {t("upgrade.next", lang)}: {buildingEffect(type, level + 1, lang)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onUpgrade}
        onPressIn={() => playSound("tap")}
        style={({ pressed }) => [
          styles.upgradeButton,
          disabled ? styles.upgradeButtonDisabled : null,
          pressed && !disabled ? styles.upgradeButtonPressed : null
        ]}
      >
        <Text style={styles.upgradeButtonLabel}>{t("upgrade.button", lang)}</Text>
        <Text style={styles.upgradeButtonCost}>
          {gated ? t("upgrade.needClanHall", lang) : costText(cost)}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          playSound("close");
          onClose();
        }}
        style={styles.upgradeClose}
      >
        <Text style={styles.upgradeCloseText}>×</Text>
      </Pressable>
    </View>
  );
}

function queueUnitAsset(type: UnitType): GameAssetKey {
  if (type === "archer") {
    return "unitArcher";
  }
  if (type === "fighter") {
    return "unitWarrior";
  }
  return "unitWorker";
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
      <PanelTexture dark />
      <View style={styles.queueHeader}>
        <Text style={styles.queueTitle}>{t("production.title", lang)}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onRush}
          onPressIn={() => playSound("tap")}
          style={styles.rushButton}
        >
          <AssetImage assetKey="resourceJungleGem" style={styles.rushGem} fallback={<View />} />
          <Text style={styles.rushText}>
            {t("production.rush", lang)} {RUSH_GEM_COST}
          </Text>
        </Pressable>
      </View>
      <View style={styles.queueSlots}>
        {queue.map((item) => {
          const remain = Math.max(0, Math.ceil((item.finishAt - now) / 1000));
          return (
            <View key={item.id} style={styles.queueSlot}>
              <AssetImage
                assetKey={queueUnitAsset(item.type)}
                style={styles.queueIcon}
                fallback={<View style={styles.queueIconFallback} />}
              />
              <Text style={styles.queueTimer}>{remain}s</Text>
            </View>
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

function costText(cost: Resources) {
  const parts = [
    cost.bananas > 0 ? `${cost.bananas}B` : null,
    cost.stones > 0 ? `${cost.stones}S` : null,
    cost.wood > 0 ? `${cost.wood}W` : null
  ].filter(Boolean);
  return parts.join(" + ");
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
      >
        {value}
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

function TopIcon({ label, glyph, onPress }: { label: string; glyph: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.topIcon}>
      <PanelTexture dark />
      <IconFrame />
      <Text style={styles.topIconText}>{glyph}</Text>
    </Pressable>
  );
}

function CostChips({ cost }: { cost: Resources }) {
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
          <Text style={styles.costAmount}>{entry.amount}</Text>
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
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionCard,
        active && !disabled ? styles.actionCardActive : null,
        disabled ? styles.actionCardDisabled : null
      ]}
    >
      <AssetImage
        assetKey="uiCardBuilding"
        resizeMode="stretch"
        style={styles.cardTexture}
        fallback={<View style={styles.cardTextureFallback} />}
      />
      {assetKey ? (
        <AssetImage
          assetKey={assetKey}
          style={styles.actionAsset}
          fallback={<Text style={styles.actionGlyph}>{glyph}</Text>}
        />
      ) : (
        <Text style={styles.actionGlyph}>{glyph}</Text>
      )}
      <Text style={styles.actionTitle} numberOfLines={1}>
        {title}
      </Text>
      <CostChips cost={cost} />
      {disabled ? <View style={styles.actionCardScrim} /> : null}
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
          <Text style={styles.tutorialKicker}>{t("tut.quickStart", lang)}</Text>
          <Text style={styles.tutorialStep}>
            {step + 1}. {t(tutorialKeys[step] ?? "tut.0", lang)}
          </Text>
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
              <Text style={styles.skipText}>{t("tut.skip", lang)}</Text>
            </Pressable>
            <Pressable style={styles.nextButton} onPress={onNext} onPressIn={() => playSound("tap")}>
              <Text style={styles.nextText}>
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
    backgroundColor: "rgba(4, 10, 7, 0.34)"
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
  levelSeal: {
    position: "absolute",
    right: -5,
    bottom: -5,
    minWidth: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2b15a",
    backgroundColor: "#4f8f3a",
    paddingHorizontal: 4
  },
  levelSealText: {
    color: theme.colors.paper,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  namePlate: {
    flexShrink: 1,
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
    fontSize: 14,
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
    gap: theme.spacing.xs
  },
  gemPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: "rgba(14, 12, 7, 0.85)",
    paddingHorizontal: 11,
    borderWidth: 1.5,
    borderColor: "rgba(120, 200, 255, 0.45)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  gemIcon: {
    width: 22,
    height: 22
  },
  gemText: {
    color: "#bfe6ff",
    fontSize: 15,
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
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
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
    fontSize: 15,
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
    borderWidth: 3,
    borderColor: "rgba(122, 84, 40, 0.9)",
    backgroundColor: "rgba(20, 27, 15, 0.3)",
    padding: 2,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8
  },
  boardShellInner: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.4)",
    overflow: "hidden"
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
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: 64,
    marginTop: theme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.35)",
    backgroundColor: glass,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    overflow: "hidden"
  },
  upgradeInfo: {
    flex: 1,
    minWidth: 0
  },
  upgradeName: {
    color: theme.colors.paper,
    fontSize: 15,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  upgradeMeta: {
    marginTop: 2,
    color: "#a7df80",
    fontSize: 12,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  upgradeNext: {
    marginTop: 1,
    color: "#d8ccb0",
    fontSize: 11,
    fontWeight: "700", fontFamily: theme.fonts.regular
  },
  upgradeButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#7b330e",
    backgroundColor: "#d96516",
    paddingHorizontal: theme.spacing.md
  },
  upgradeButtonDisabled: {
    opacity: 0.5
  },
  upgradeButtonPressed: {
    transform: [{ translateY: 1 }, { scale: 0.98 }]
  },
  upgradeButtonLabel: {
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  upgradeButtonCost: {
    color: "#ffe9ad",
    fontSize: 11,
    fontWeight: "900", fontFamily: theme.fonts.heavy
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
    borderWidth: 2,
    borderColor: "rgba(90, 62, 26, 0.9)",
    backgroundColor: "#231b0e",
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
  actionAsset: {
    width: 46,
    height: 46,
    marginTop: 2
  },
  // The card art has baked-in dark margins; oversize it so the gold frame
  // reaches the card edges instead of showing the muddy border.
  cardTexture: {
    position: "absolute",
    top: "-7%",
    left: "-9%",
    width: "118%",
    height: "122%"
  },
  cardTextureFallback: {
    flex: 1,
    backgroundColor: "#efe3bb"
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
  raidButton: {
    width: 96,
    minHeight: 104,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(226, 177, 90, 0.4)",
    backgroundColor: "#31200f",
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
  // Slightly oversized so the plaque art spans the full button width and the
  // rope ends sit at the edges instead of floating inside.
  raidButtonArt: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "-9%",
    width: "118%"
  },
  raidButtonFallback: {
    flex: 1,
    backgroundColor: "transparent"
  },
  modalScrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 23, 15, 0.68)",
    padding: theme.spacing.xl
  },
  tutorialCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#172f20",
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.lg,
    overflow: "hidden"
  },
  tutorialKicker: {
    color: "#4d5837",
    fontSize: 12,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textTransform: "uppercase"
  },
  tutorialStep: {
    marginTop: theme.spacing.sm,
    minHeight: 70,
    color: theme.colors.ink,
    fontSize: 21,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  tutorialDots: {
    flexDirection: "row",
    gap: 6,
    marginTop: theme.spacing.md
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
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg
  },
  skipButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md
  },
  skipText: {
    color: "#4d5837",
    fontSize: 15,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  nextButton: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: theme.colors.banana,
    paddingHorizontal: theme.spacing.lg
  },
  nextText: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "900", fontFamily: theme.fonts.heavy
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
