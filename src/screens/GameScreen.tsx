import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
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
import { RaidBoard } from "../components/game/RaidBoard";
import { SpriteSheetImage } from "../components/game/SpriteSheetImage";
import { VillageBoard } from "../components/game/VillageBoard";
import { getGameAsset } from "../game/assets/gameAssets";
import { UNIT_COSTS } from "../game/config/constants";
import { BUILDING_NAMES, buildingEffect, upgradeCost } from "../game/config/buildings";
import { useGameStore } from "../game/state/gameStore";
import type { Resources, VillageBuilding, VillageBuildingType } from "../game/types/game";
import { theme } from "../theme/theme";

const TUTORIAL_KEY = "monkey-tribe:tutorial-seen";
const PHONE_FRAME_WIDTH = 430;
const tutorialSteps = [
  "Binalar zamanla muz, odun ve taş üretir.",
  "Bir binaya dokun ve Geliştir ile seviyesini yükselt.",
  "İşçi ve savaşçı üret; Eğitim Yuvası savaşçıları açar.",
  "Savaşçın hazır olunca BASKIN ile düşman kampına saldır."
];

function levelOf(buildings: VillageBuilding[], type: VillageBuildingType) {
  return buildings.find((building) => building.type === type)?.level ?? 0;
}

export function GameScreen() {
  const state = useGameStore();
  const { width } = useWindowDimensions();
  const layoutWidth = Math.min(width, PHONE_FRAME_WIDTH);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState<VillageBuildingType | null>(null);
  const population = state.units.filter(
    (unit) => unit.owner === "player" && unit.state !== "dead" && unit.hp > 0
  ).length;
  const boardMaxSize = Math.max(260, Math.min(layoutWidth - 20, 404));

  useEffect(() => {
    const timer = setInterval(() => {
      state.tickGame();
    }, 150);

    return () => clearInterval(timer);
  }, [state.tickGame]);

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
    if (tutorialStep >= tutorialSteps.length - 1) {
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
  const sheet = getGameAsset("unitMonkeySheet");

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
          <View style={styles.clanCard}>
            <PanelTexture dark />
            <View style={styles.avatarRing}>
              <IconFrame />
              <SpriteSheetImage
                source={sheet.source}
                sheetWidth={1341}
                sheetHeight={1173}
                frame={{ x: 1084, y: 18, width: 230, height: 256 }}
                style={styles.avatar}
                fallback={<AvatarFallback />}
              />
            </View>
            <View style={styles.clanCopy}>
              <Text style={styles.clanName}>Monkey Tribe</Text>
              <Text style={styles.clanSubtitle}>Young Clan</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>1</Text>
            </View>
          </View>

          <View style={styles.topButtons}>
            <TopPill label="Tasks" accent="!" />
            <TopIcon label="Trophy" glyph="T" />
            <TopIcon label="Settings" glyph="S" onPress={state.resetGame} />
          </View>
        </View>

        <View style={styles.resourceBar}>
          <ResourceChip label="Muz" value={Math.floor(state.resources.bananas)} assetKey="resourceBanana" />
          <ResourceChip label="Taş" value={Math.floor(state.resources.stones)} assetKey="resourceStone" />
          <ResourceChip label="Odun" value={Math.floor(state.resources.wood)} assetKey="resourceWood" />
          <ResourceChip
            label="Nüfus"
            value={`${population}/${state.maxPopulation}`}
            assetKey="resourcePopulation"
          />
        </View>

        {state.gameMode === "raid" ? (
          <View style={styles.raidStage}>
            <RaidBoard
              units={state.units}
              enemyCampHp={state.enemyCampHp}
              raidStatus={state.raidStatus}
              maxSize={Math.min(width - theme.spacing.md * 2, 404)}
              feedbackText={state.feedback?.text}
              onReturn={state.returnToVillage}
            />
          </View>
        ) : (
          <>
            <View style={styles.boardShell}>
              <VillageBoard
                tiles={state.mapTiles}
                units={state.units}
                buildings={state.buildings}
                maxSize={boardMaxSize}
                feedbackText={state.feedback?.text}
                selectedType={selectedBuilding}
                onBuildingPress={setSelectedBuilding}
              />
            </View>

            {selectedBuilding ? (
              <UpgradePanel
                buildings={state.buildings}
                resources={state.resources}
                type={selectedBuilding}
                onUpgrade={() => state.upgradeBuilding(selectedBuilding)}
                onClose={() => setSelectedBuilding(null)}
              />
            ) : (
              <View style={styles.hintPanel}>
                <PanelTexture dark />
                <Text style={styles.hintText}>Geliştirmek için bir binaya dokun</Text>
              </View>
            )}

            <View style={styles.bottomDock}>
              <PanelTexture dark />
              <View style={styles.actionCards}>
                <ActionCard
                  title="İşçi"
                  cost={costText(UNIT_COSTS.worker)}
                  glyph="M"
                  assetKey="unitWorker"
                  disabled={createWorkerDisabled}
                  onPress={state.createWorker}
                />
                <ActionCard
                  title="Savaşçı"
                  cost={costText(UNIT_COSTS.fighter)}
                  glyph="X"
                  assetKey="unitFighter"
                  disabled={trainFighterDisabled}
                  onPress={state.trainFighter}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={state.raidEnemyCamp}
                style={({ pressed }) => [styles.raidButton, pressed ? styles.raidButtonPressed : null]}
              >
                <AssetImage
                  assetKey="uiButtonRaidLarge"
                  resizeMode="stretch"
                  style={styles.raidButtonArt}
                  fallback={
                    <AssetImage
                      assetKey="uiButtonRaid"
                      resizeMode="stretch"
                      style={styles.raidButtonArt}
                      fallback={<View style={styles.raidButtonFallback} />}
                    />
                  }
                />
                <Text style={styles.raidIcon}>X</Text>
                <Text style={styles.raidText}>BASKIN!</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <TutorialOverlay
        visible={showTutorial}
        step={tutorialStep}
        onNext={nextTutorialStep}
        onSkip={closeTutorial}
      />
    </View>
  );

}

function UpgradePanel({
  buildings,
  resources,
  type,
  onUpgrade,
  onClose
}: {
  buildings: VillageBuilding[];
  resources: Resources;
  type: VillageBuildingType;
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
          {BUILDING_NAMES[type]}
        </Text>
        <Text style={styles.upgradeMeta}>
          Seviye {level} · {buildingEffect(type, level)}
        </Text>
        <Text style={styles.upgradeNext}>
          Sonraki: {buildingEffect(type, level + 1)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onUpgrade}
        style={({ pressed }) => [
          styles.upgradeButton,
          disabled ? styles.upgradeButtonDisabled : null,
          pressed && !disabled ? styles.upgradeButtonPressed : null
        ]}
      >
        <Text style={styles.upgradeButtonLabel}>Geliştir</Text>
        <Text style={styles.upgradeButtonCost}>{gated ? "Klan Salonu gerek" : costText(cost)}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.upgradeClose}>
        <Text style={styles.upgradeCloseText}>×</Text>
      </Pressable>
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
  assetKey
}: {
  label: string;
  value: number | string;
  assetKey: "resourceBanana" | "resourceStone" | "resourceWood" | "resourcePopulation";
}) {
  return (
    <View style={styles.resourceChip}>
      <PanelTexture dark />
      <View style={styles.resourceIcon}>
        <IconFrame />
        <AssetImage assetKey={assetKey} style={styles.resourceIconArt} fallback={<ResourceFallback assetKey={assetKey} />} />
      </View>
      <View style={styles.resourceCopy}>
        <Text style={styles.resourceValue}>{value}</Text>
      </View>
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

function TopPill({ label, accent }: { label: string; accent: string }) {
  return (
    <View style={styles.topPill}>
      <PanelTexture dark />
      <Text style={styles.topPillText}>{label}</Text>
      <View style={styles.topAccent}>
        <Text style={styles.topAccentText}>{accent}</Text>
      </View>
    </View>
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

function ActionCard({
  title,
  cost,
  glyph,
  assetKey,
  disabled,
  onPress
}: {
  title: string;
  cost: string;
  glyph: string;
  assetKey?: "buildingHut" | "buildingTrainingNest" | "buildingWatchPost" | "unitWorker" | "unitFighter";
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        disabled ? styles.actionCardDisabled : null,
        pressed && !disabled ? styles.actionCardPressed : null
      ]}
    >
      <AssetImage
        assetKey="uiCardBuilding"
        resizeMode="stretch"
        style={styles.cardTexture}
        fallback={<View style={styles.cardTextureFallback} />}
      />
      <View style={styles.actionIcon}>
        {assetKey ? (
          <AssetImage
            assetKey={assetKey}
            style={styles.actionAsset}
            fallback={<Text style={styles.actionGlyph}>{glyph}</Text>}
          />
        ) : (
          <Text style={styles.actionGlyph}>{glyph}</Text>
        )}
      </View>
      <Text style={styles.actionTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.actionCost}>{cost}</Text>
    </Pressable>
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
  onNext,
  onSkip
}: {
  visible: boolean;
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalScrim}>
        <View style={styles.tutorialCard}>
          <PanelTexture dark={false} />
          <Text style={styles.tutorialKicker}>Quick Start</Text>
          <Text style={styles.tutorialStep}>
            {step + 1}. {tutorialSteps[step]}
          </Text>
          <View style={styles.tutorialDots}>
            {tutorialSteps.map((_, index) => (
              <View
                key={index}
                style={[styles.tutorialDot, index === step ? styles.tutorialDotActive : null]}
              />
            ))}
          </View>
          <View style={styles.tutorialActions}>
            <Pressable style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable style={styles.nextButton} onPress={onNext}>
              <Text style={styles.nextText}>
                {step === tutorialSteps.length - 1 ? "Play" : "Next"}
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
  clanCard: {
    flex: 1,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.16)",
    backgroundColor: glass,
    padding: theme.spacing.sm,
    overflow: "hidden"
  },
  avatarRing: {
    width: 46,
    height: 46,
    overflow: "hidden",
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "#6aa04f",
    backgroundColor: "#1b2b19",
    alignItems: "center",
    justifyContent: "center"
  },
  avatar: {
    width: 46,
    height: 46
  },
  clanCopy: {
    flex: 1
  },
  clanName: {
    color: theme.colors.paper,
    fontSize: 17,
    fontWeight: "900"
  },
  clanSubtitle: {
    marginTop: 2,
    color: "#d7c99d",
    fontSize: 12,
    fontWeight: "800"
  },
  levelBadge: {
    width: 28,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#5b8f3d"
  },
  levelText: {
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: "900"
  },
  topButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
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
    fontWeight: "900"
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
    fontWeight: "900"
  },
  topIcon: {
    width: 44,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: glass,
    overflow: "hidden"
  },
  topIconText: {
    color: theme.colors.paper,
    fontSize: 17,
    fontWeight: "900"
  },
  resourceBar: {
    flexDirection: "row",
    gap: 5
  },
  resourceChip: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 11,
    backgroundColor: glass,
    paddingHorizontal: 8,
    paddingVertical: 6,
    overflow: "hidden"
  },
  resourceIcon: {
    width: 31,
    height: 31,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center"
  },
  resourceIconArt: {
    width: 26,
    height: 26
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
    fontWeight: "900"
  },
  resourceCopy: {
    minWidth: 0
  },
  resourceValue: {
    color: theme.colors.paper,
    fontSize: 17,
    fontWeight: "900"
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
    fontWeight: "900"
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
    fontWeight: "900"
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.2)",
    backgroundColor: "rgba(20, 27, 15, 0.24)",
    padding: 2
  },
  hintPanel: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.14)",
    backgroundColor: glass,
    overflow: "hidden"
  },
  hintText: {
    color: "#d8ccb0",
    fontSize: 13,
    fontWeight: "800"
  },
  upgradePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: 64,
    marginTop: theme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.2)",
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
    fontWeight: "900"
  },
  upgradeMeta: {
    marginTop: 2,
    color: "#a7df80",
    fontSize: 12,
    fontWeight: "800"
  },
  upgradeNext: {
    marginTop: 1,
    color: "#d8ccb0",
    fontSize: 11,
    fontWeight: "700"
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
    fontWeight: "900"
  },
  upgradeButtonCost: {
    color: "#ffe9ad",
    fontSize: 11,
    fontWeight: "900"
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
    fontWeight: "900",
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
    fontWeight: "900",
    textTransform: "uppercase"
  },
  objectiveCounter: {
    color: "#e2b15a",
    fontSize: 12,
    fontWeight: "900"
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
    fontWeight: "800"
  },
  objectiveValue: {
    color: "#d8ccb0",
    fontSize: 12,
    fontWeight: "900"
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
    fontWeight: "900"
  },
  hpText: {
    color: "#a7df80",
    fontSize: 13,
    fontWeight: "900"
  },
  panelText: {
    marginTop: 3,
    color: "#d8ccb0",
    fontSize: 13,
    fontWeight: "700"
  },
  panelHint: {
    marginTop: 5,
    color: "#e3f2cf",
    fontSize: 12,
    fontWeight: "800"
  },
  bottomDock: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.14)",
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
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 224, 151, 0.12)",
    backgroundColor: "rgba(28, 32, 20, 0.92)",
    padding: 6,
    overflow: "hidden"
  },
  actionCardDisabled: {
    opacity: 0.48
  },
  actionCardPressed: {
    transform: [{ translateY: 2 }, { scale: 0.98 }]
  },
  actionIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(255, 224, 151, 0.12)",
    overflow: "hidden"
  },
  actionAsset: {
    width: "100%",
    height: "100%"
  },
  cardTexture: {
    ...StyleSheet.absoluteFillObject
  },
  cardTextureFallback: {
    flex: 1,
    backgroundColor: "rgba(28, 32, 20, 0.92)"
  },
  actionGlyph: {
    color: "#e2b15a",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  actionTitle: {
    marginTop: 4,
    minHeight: 25,
    color: theme.colors.paper,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center"
  },
  actionCost: {
    color: "#f1cd74",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center"
  },
  raidButton: {
    width: 92,
    minHeight: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#7b330e",
    backgroundColor: "#d96516",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.48,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 12
  },
  raidButtonPressed: {
    transform: [{ translateY: 2 }, { scale: 0.98 }]
  },
  raidIcon: {
    color: theme.colors.paper,
    fontSize: 22,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  },
  raidText: {
    color: theme.colors.paper,
    fontSize: 20,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  },
  raidButtonArt: {
    ...StyleSheet.absoluteFillObject
  },
  raidButtonFallback: {
    flex: 1,
    backgroundColor: "#d96516"
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
    fontWeight: "900",
    textTransform: "uppercase"
  },
  tutorialStep: {
    marginTop: theme.spacing.sm,
    minHeight: 70,
    color: theme.colors.ink,
    fontSize: 21,
    fontWeight: "900"
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
    fontWeight: "900"
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
    fontWeight: "900"
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
