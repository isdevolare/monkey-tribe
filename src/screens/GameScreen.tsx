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
import { GameBoard } from "../components/game/GameBoard";
import { SpriteSheetImage } from "../components/game/SpriteSheetImage";
import { getGameAsset } from "../game/assets/gameAssets";
import { BUILDING_COSTS, UNIT_COSTS } from "../game/config/constants";
import { useGameStore } from "../game/state/gameStore";
import type { Resources, Tile, Unit } from "../game/types/game";
import { theme } from "../theme/theme";

const TUTORIAL_KEY = "monkey-tribe:tutorial-seen";
const tutorialSteps = [
  "Select a worker monkey near your camp.",
  "Tap bananas, stone, or wood to send the worker gathering.",
  "Build a Training Nest, then train a fighter.",
  "Send fighters to destroy the enemy camp."
];

type ActionTab = "overview" | "monkeys" | "build" | "map" | "shop" | "settings";

export function GameScreen() {
  const state = useGameStore();
  const { width } = useWindowDimensions();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [actionTab, setActionTab] = useState<ActionTab>("overview");
  const selectedUnit =
    state.units.find((unit) => unit.id === state.selectedUnitId && unit.state !== "dead") ??
    null;
  const population = state.units.filter(
    (unit) => unit.owner === "player" && unit.state !== "dead" && unit.hp > 0
  ).length;
  const fighterCount = state.units.filter(
    (unit) =>
      unit.owner === "player" &&
      unit.type === "fighter" &&
      unit.state !== "dead" &&
      unit.hp > 0
  ).length;
  const boardMaxSize = Math.max(238, Math.min(width - 112, 392));

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

  function handleCellPress(tile: Tile, unit?: Unit) {
    if (state.gameStatus !== "playing") {
      return;
    }

    if (unit?.owner === "player") {
      state.selectUnit(unit.id);
      return;
    }

    if (!selectedUnit) {
      return;
    }

    if (unit?.owner === "enemy") {
      state.commandAttack({ kind: "unit", unitId: unit.id });
      return;
    }

    if (tile.type === "bananaTree" && selectedUnit.type === "worker") {
      state.commandGather(tile.x, tile.y, "bananas");
      return;
    }

    if (tile.type === "stoneRock" && selectedUnit.type === "worker") {
      state.commandGather(tile.x, tile.y, "stones");
      return;
    }

    if (tile.type === "woodGrove" && selectedUnit.type === "worker") {
      state.commandGather(tile.x, tile.y, "wood");
      return;
    }

    if (tile.type === "enemyCamp") {
      state.commandAttack({ kind: "camp", owner: "enemy" });
      return;
    }

    state.commandMove(tile.x, tile.y);
  }

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
  const fighterLocked = state.buildings.trainingNest <= 0;
  const trainFighterDisabled =
    fighterLocked ||
    population >= state.maxPopulation ||
    !hasResources(state.resources, UNIT_COSTS.fighter);
  const hutDisabled =
    state.buildings.hut > 0 || !hasResources(state.resources, BUILDING_COSTS.hut);
  const nestDisabled =
    state.buildings.trainingNest > 0 ||
    !hasResources(state.resources, BUILDING_COSTS.trainingNest);
  const watchPostDisabled =
    state.buildings.watchPost > 0 || !hasResources(state.resources, BUILDING_COSTS.watchPost);
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
          <ResourceChip label="Bananas" value={state.resources.bananas} rate="+18/turn" assetKey="resourceBanana" />
          <ResourceChip label="Stones" value={state.resources.stones} rate="+12/turn" assetKey="resourceStone" />
          <ResourceChip label="Wood" value={state.resources.wood} rate="+9/turn" assetKey="resourceWood" />
          <ResourceChip
            label="Population"
            value={`${population}/${state.maxPopulation}`}
            rate="+1/turn"
            assetKey="resourcePopulation"
          />
        </View>

        <View style={styles.mainStage}>
          <View style={styles.sideNav}>
            <SideNavButton
              label="Overview"
              glyph="O"
              active={actionTab === "overview"}
              onPress={() => setActionTab("overview")}
            />
            <SideNavButton
              label="Monkeys"
              glyph="M"
              badge={population}
              active={actionTab === "monkeys"}
              onPress={() => setActionTab("monkeys")}
            />
            <SideNavButton
              label="Build"
              glyph="B"
              active={actionTab === "build"}
              onPress={() => setActionTab("build")}
            />
            <SideNavButton
              label="Map"
              glyph="Map"
              active={actionTab === "map"}
              onPress={() => setActionTab("map")}
            />
            <SideNavButton
              label="Shop"
              glyph="Hut"
              active={actionTab === "shop"}
              onPress={() => setActionTab("shop")}
            />
            <SideNavButton
              label="Settings"
              glyph="S"
              active={actionTab === "settings"}
              onPress={() => setActionTab("settings")}
            />
          </View>

          <View style={styles.playColumn}>
            <View style={styles.boardShell}>
              <GameBoard
                tiles={state.mapTiles}
                units={state.units}
                selectedUnitId={state.selectedUnitId}
                buildings={state.buildings}
                playerCampHp={state.playerCampHp}
                enemyCampHp={state.enemyCampHp}
                maxSize={boardMaxSize}
                onCellPress={handleCellPress}
              />
            </View>

            {state.feedback ? (
              <View style={styles.feedback}>
                <Text style={styles.feedbackText}>{state.feedback.text}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.objectivePanel}>
          <PanelTexture dark />
          <View style={styles.objectiveHeader}>
            <Text style={styles.objectiveTitle}>Objectives</Text>
            <Text style={styles.objectiveCounter}>Tasks</Text>
          </View>
          <ObjectiveRow label="Build a Hut" value={`${state.buildings.hut > 0 ? 1 : 0}/1`} done={state.buildings.hut > 0} />
          <ObjectiveRow
            label="Gather 100 Bananas"
            value={`${Math.min(state.resources.bananas, 100)}/100`}
            done={state.resources.bananas >= 100}
          />
          <ObjectiveRow label="Train a Fighter" value={`${fighterCount > 0 ? 1 : 0}/1`} done={fighterCount > 0} />
          <ObjectiveRow label="Defeat Enemy Camp" value={`${state.enemyCampHp <= 0 ? 1 : 0}/1`} done={state.enemyCampHp <= 0} />
        </View>

        <SelectedUnitPanel unit={selectedUnit} />

        <View style={styles.bottomDock}>
          <PanelTexture dark />
          <View style={styles.actionCards}>{renderActionCards()}</View>
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
            <Text style={styles.raidText}>RAID!</Text>
          </Pressable>
        </View>
      </ScrollView>

      <TutorialOverlay
        visible={showTutorial}
        step={tutorialStep}
        onNext={nextTutorialStep}
        onSkip={closeTutorial}
      />
    </View>
  );

  function renderActionCards() {
    if (actionTab === "monkeys") {
      return (
        <>
          <ActionCard
            title="Worker"
            cost={costText(UNIT_COSTS.worker)}
            glyph="M"
            assetKey="unitWorker"
            disabled={createWorkerDisabled}
            onPress={state.createWorker}
          />
          <ActionCard
            title="Fighter"
            cost={fighterLocked ? "Nest" : costText(UNIT_COSTS.fighter)}
            glyph="X"
            assetKey="unitFighter"
            disabled={trainFighterDisabled}
            onPress={state.trainFighter}
          />
          <ActionCard title="Move" cost="Tap" glyph="Map" onPress={() => setActionTab("map")} />
        </>
      );
    }

    if (actionTab === "map") {
      return (
        <>
          <ActionCard title="Gather" cost="Tap resource" glyph="B" onPress={() => setActionTab("overview")} />
          <ActionCard title="Move" cost="Tap tile" glyph="Map" onPress={() => setActionTab("overview")} />
          <ActionCard title="Cancel" cost="Reset" glyph="!" onPress={state.resetGame} />
        </>
      );
    }

    return (
      <>
        <ActionCard
          title="Hut"
          cost={state.buildings.hut > 0 ? "Built" : costText(BUILDING_COSTS.hut)}
          glyph="Hut"
          assetKey="buildingHut"
          disabled={hutDisabled}
          onPress={state.buildHut}
        />
        <ActionCard
          title="Training Nest"
          cost={state.buildings.trainingNest > 0 ? "Built" : costText(BUILDING_COSTS.trainingNest)}
          glyph="Target"
          assetKey="buildingTrainingNest"
          disabled={nestDisabled}
          onPress={state.buildTrainingNest}
        />
        <ActionCard
          title="Watch Post"
          cost={state.buildings.watchPost > 0 ? "Built" : costText(BUILDING_COSTS.watchPost)}
          glyph="Tower"
          assetKey="buildingWatchPost"
          disabled={watchPostDisabled}
          onPress={state.buildWatchPost}
        />
        <ActionCard title="More" cost="..." glyph="More" onPress={() => setActionTab("shop")} />
      </>
    );
  }
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
  rate,
  assetKey
}: {
  label: string;
  value: number | string;
  rate: string;
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
        <Text style={styles.resourceRate}>{rate}</Text>
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

function SideNavButton({
  label,
  glyph,
  badge,
  active,
  onPress
}: {
  label: string;
  glyph: string;
  badge?: number;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.sideButton,
        active ? styles.sideButtonActive : null,
        pressed ? styles.sideButtonPressed : null
      ]}
    >
      <PanelTexture dark />
      <View style={styles.sideIconFrame}>
        <IconFrame />
        <Text style={styles.sideGlyph}>{glyph}</Text>
      </View>
      <Text style={[styles.sideLabel, active ? styles.sideLabelActive : null]}>{label}</Text>
      {badge ? (
        <View style={styles.sideBadge}>
          <Text style={styles.sideBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function ObjectiveRow({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <View style={styles.objectiveRow}>
      <Text style={[styles.objectiveText, done ? styles.objectiveTextDone : null]}>{label}</Text>
      <Text style={[styles.objectiveValue, done ? styles.objectiveTextDone : null]}>{value}</Text>
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

function SelectedUnitPanel({ unit }: { unit: Unit | null }) {
  if (!unit) {
    return (
      <View style={styles.panel}>
        <PanelTexture dark />
        <Text style={styles.panelTitle}>No monkey selected</Text>
        <Text style={styles.panelText}>Tap a player monkey, then tap a nearby tile or resource.</Text>
      </View>
    );
  }

  const carried = unit.carriedResource
    ? ` Carrying ${unit.carriedResource.amount} ${unit.carriedResource.kind}.`
    : "";

  return (
    <View style={styles.panel}>
      <PanelTexture dark />
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>
          {unit.type === "fighter" ? "Fighter Monkey" : "Worker Monkey"}
        </Text>
        <Text style={styles.hpText}>
          {unit.hp}/{unit.maxHp} HP
        </Text>
      </View>
      <Text style={styles.panelText}>
        State: {unit.state}.{carried}
      </Text>
      <Text style={styles.panelHint}>{hintForUnit(unit)}</Text>
    </View>
  );
}

function hintForUnit(unit: Unit) {
  if (unit.type === "worker") {
    return "Gather bananas, stones, or wood. Workers can fight, but only barely.";
  }

  return "Fighters hit hard. Tap enemy monkeys or the red camp.";
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
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    gap: 7
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  clanCard: {
    flex: 1,
    minHeight: 70,
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
    width: 54,
    height: 54,
    overflow: "hidden",
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#6aa04f",
    backgroundColor: "#1b2b19",
    alignItems: "center",
    justifyContent: "center"
  },
  avatar: {
    width: 54,
    height: 54
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
    minHeight: 56,
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
    width: 48,
    height: 56,
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
    gap: theme.spacing.xs
  },
  resourceChip: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 11,
    backgroundColor: glass,
    paddingHorizontal: 7,
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
    width: 25,
    height: 25
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
    fontSize: 15,
    fontWeight: "900"
  },
  resourceRate: {
    color: "#a7df80",
    fontSize: 9,
    fontWeight: "900"
  },
  hiddenLabel: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0
  },
  mainStage: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs
  },
  sideNav: {
    width: 78,
    gap: theme.spacing.xs
  },
  sideButton: {
    minHeight: 52,
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.14)",
    backgroundColor: "rgba(54, 43, 27, 0.84)",
    paddingHorizontal: 7,
    overflow: "hidden"
  },
  sideButtonActive: {
    borderColor: "rgba(198, 238, 137, 0.48)",
    backgroundColor: "rgba(68, 101, 45, 0.92)"
  },
  sideButtonPressed: {
    transform: [{ scale: 0.98 }]
  },
  sideGlyph: {
    color: theme.colors.paper,
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center"
  },
  sideIconFrame: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  sideLabel: {
    marginTop: 3,
    color: "#d8ccb0",
    fontSize: 10,
    fontWeight: "900"
  },
  sideLabelActive: {
    color: theme.colors.paper
  },
  sideBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#d94b36"
  },
  sideBadgeText: {
    color: theme.colors.paper,
    fontSize: 10,
    fontWeight: "900"
  },
  playColumn: {
    flex: 1,
    gap: theme.spacing.sm
  },
  boardShell: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.2)",
    backgroundColor: "rgba(20, 27, 15, 0.24)",
    padding: 3
  },
  feedback: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4c371f",
    backgroundColor: "#ffe28b",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  feedbackText: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  objectivePanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.15)",
    backgroundColor: glass,
    padding: theme.spacing.md,
    overflow: "hidden"
  },
  objectiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: theme.spacing.sm,
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
    minHeight: 33,
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
    minHeight: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.18)",
    backgroundColor: "rgba(15, 40, 28, 0.84)",
    padding: theme.spacing.md,
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
    marginTop: theme.spacing.xs,
    color: "#d8ccb0",
    fontSize: 13,
    fontWeight: "700"
  },
  panelHint: {
    marginTop: theme.spacing.sm,
    color: "#e3f2cf",
    fontSize: 12,
    fontWeight: "800"
  },
  bottomDock: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: theme.spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.14)",
    backgroundColor: "rgba(42, 38, 29, 0.9)",
    padding: theme.spacing.sm,
    overflow: "hidden"
  },
  actionCards: {
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  actionCard: {
    flex: 1,
    minHeight: 98,
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
    width: 46,
    height: 46,
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
    marginTop: 6,
    minHeight: 28,
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
    width: 95,
    minHeight: 98,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#7b330e",
    backgroundColor: "#d96516",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8
  },
  raidButtonPressed: {
    transform: [{ translateY: 2 }, { scale: 0.98 }]
  },
  raidIcon: {
    color: theme.colors.paper,
    fontSize: 24,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  },
  raidText: {
    color: theme.colors.paper,
    fontSize: 22,
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
