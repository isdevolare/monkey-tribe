import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GameBoard } from "../components/game/GameBoard";
import { GameButton } from "../components/game/GameButton";
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

export function GameScreen() {
  const state = useGameStore();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const selectedUnit =
    state.units.find((unit) => unit.id === state.selectedUnitId && unit.state !== "dead") ??
    null;
  const population = state.units.filter(
    (unit) => unit.owner === "player" && unit.state !== "dead" && unit.hp > 0
  ).length;

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

  return (
    <View style={styles.safeScreen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Jungle Survival</Text>
            <Text style={styles.title}>Monkey Tribe</Text>
          </View>
          <Pressable style={styles.resetButton} onPress={state.resetGame}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        <View style={styles.hud}>
          <ResourceCard label="Bananas" value={state.resources.bananas} icon="B" />
          <ResourceCard label="Stones" value={state.resources.stones} icon="S" />
          <ResourceCard label="Wood" value={state.resources.wood} icon="W" />
          <ResourceCard label="Pop" value={`${population}/${state.maxPopulation}`} icon="P" />
        </View>

        <View style={styles.campStrip}>
          <CampStat label="Your Camp" value={state.playerCampHp} tone="player" />
          <CampStat label="Enemy Camp" value={state.enemyCampHp} tone="enemy" />
        </View>

        {state.feedback ? (
          <View style={styles.feedback}>
            <Text style={styles.feedbackText}>{state.feedback.text}</Text>
          </View>
        ) : null}

        <GameBoard
          tiles={state.mapTiles}
          units={state.units}
          selectedUnitId={state.selectedUnitId}
          playerCampHp={state.playerCampHp}
          enemyCampHp={state.enemyCampHp}
          onCellPress={handleCellPress}
        />

        <SelectedUnitPanel unit={selectedUnit} />

        <View style={styles.buildingStrip}>
          <BuildingBadge label="Hut" active={state.buildings.hut > 0} />
          <BuildingBadge label="Nest" active={state.buildings.trainingNest > 0} />
          <BuildingBadge label="Post" active={state.buildings.watchPost > 0} />
        </View>

        <View style={styles.actions}>
          <Text style={styles.sectionTitle}>Tribe Actions</Text>
          <GameButton
            label="Create Worker"
            helperText={buttonHelper(
              createWorkerDisabled,
              population >= state.maxPopulation ? "Population full. Build a Hut." : costText(UNIT_COSTS.worker)
            )}
            disabled={createWorkerDisabled}
            onPress={state.createWorker}
          />
          <GameButton
            label="Train Fighter"
            helperText={buttonHelper(
              trainFighterDisabled,
              fighterLocked
                ? "Requires Training Nest"
                : population >= state.maxPopulation
                  ? "Population full. Build a Hut."
                  : costText(UNIT_COSTS.fighter)
            )}
            disabled={trainFighterDisabled}
            onPress={state.trainFighter}
          />
          <Text style={styles.sectionTitle}>Buildings</Text>
          <View style={styles.buildGrid}>
            <View style={styles.buildButton}>
              <GameButton
                label="Hut"
                helperText={state.buildings.hut > 0 ? "+2 capacity active" : costText(BUILDING_COSTS.hut)}
                tone="secondary"
                disabled={hutDisabled}
                onPress={state.buildHut}
              />
            </View>
            <View style={styles.buildButton}>
              <GameButton
                label="Training Nest"
                helperText={
                  state.buildings.trainingNest > 0
                    ? "Fighters unlocked"
                    : costText(BUILDING_COSTS.trainingNest)
                }
                tone="secondary"
                disabled={nestDisabled}
                onPress={state.buildTrainingNest}
              />
            </View>
            <View style={styles.buildButton}>
              <GameButton
                label="Watch Post"
                helperText={
                  state.buildings.watchPost > 0
                    ? "Camp defense active"
                    : costText(BUILDING_COSTS.watchPost)
                }
                tone="secondary"
                disabled={watchPostDisabled}
                onPress={state.buildWatchPost}
              />
            </View>
          </View>
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

function buttonHelper(disabled: boolean, text: string) {
  return disabled ? text : `Cost: ${text}`;
}

function ResourceCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <View style={styles.resourceCard}>
      <Text style={styles.resourceIcon}>{icon}</Text>
      <View>
        <Text style={styles.resourceValue}>{value}</Text>
        <Text style={styles.resourceLabel}>{label}</Text>
      </View>
    </View>
  );
}

function CampStat({ label, value, tone }: { label: string; value: number; tone: "player" | "enemy" }) {
  return (
    <View style={styles.campStat}>
      <Text style={styles.campLabel}>{label}</Text>
      <View style={styles.campTrack}>
        <View
          style={[
            styles.campFill,
            {
              width: `${Math.max(0, Math.round((value / 120) * 100))}%`,
              backgroundColor: tone === "player" ? theme.colors.player : theme.colors.enemy
            }
          ]}
        />
      </View>
      <Text style={styles.campValue}>{value} HP</Text>
    </View>
  );
}

function BuildingBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.buildingBadge, active ? styles.buildingBadgeActive : null]}>
      <Text style={[styles.buildingBadgeText, active ? styles.buildingBadgeTextActive : null]}>
        {label}
      </Text>
    </View>
  );
}

function SelectedUnitPanel({ unit }: { unit: Unit | null }) {
  if (!unit) {
    return (
      <View style={styles.panel}>
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

const styles = StyleSheet.create({
  safeScreen: {
    flex: 1,
    backgroundColor: theme.colors.jungle
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.jungle
  },
  content: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 34,
    gap: theme.spacing.md
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  kicker: {
    color: "#bddf96",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.paper,
    fontSize: 26,
    fontWeight: "900"
  },
  resetButton: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#152b1d",
    backgroundColor: "#efb0a7",
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center"
  },
  resetText: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  hud: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  resourceCard: {
    flexGrow: 1,
    flexBasis: "46%",
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#172f20",
    backgroundColor: theme.colors.panel,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  resourceIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: theme.colors.banana,
    color: theme.colors.ink,
    textAlign: "center",
    lineHeight: 30,
    fontSize: 13,
    fontWeight: "900"
  },
  resourceValue: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  resourceLabel: {
    color: "#4d5837",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  campStrip: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  campStat: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#172f20",
    backgroundColor: "rgba(255, 248, 217, 0.9)",
    padding: theme.spacing.sm
  },
  campLabel: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  campTrack: {
    height: 8,
    marginTop: 5,
    borderRadius: 4,
    backgroundColor: "rgba(23, 48, 34, 0.28)",
    overflow: "hidden"
  },
  campFill: {
    height: "100%"
  },
  campValue: {
    marginTop: 4,
    color: "#4d5837",
    fontSize: 11,
    fontWeight: "900"
  },
  feedback: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#4c371f",
    backgroundColor: "#ffe28b",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  feedbackText: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  },
  panel: {
    minHeight: 104,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.md
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  panelTitle: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  hpText: {
    color: theme.colors.enemyDark,
    fontSize: 14,
    fontWeight: "900"
  },
  panelText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  panelHint: {
    marginTop: theme.spacing.sm,
    color: "#4d5837",
    fontSize: 13,
    fontWeight: "800"
  },
  buildingStrip: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  buildingBadge: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 248, 217, 0.45)",
    backgroundColor: "rgba(19, 41, 28, 0.7)",
    paddingVertical: theme.spacing.sm
  },
  buildingBadgeActive: {
    borderColor: theme.colors.banana,
    backgroundColor: "#365b31"
  },
  buildingBadgeText: {
    color: "#bddf96",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  buildingBadgeTextActive: {
    color: theme.colors.paper
  },
  actions: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md
  },
  sectionTitle: {
    marginTop: theme.spacing.xs,
    color: theme.colors.paper,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  buildGrid: {
    gap: theme.spacing.sm
  },
  buildButton: {
    width: "100%"
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
    padding: theme.spacing.lg
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
  }
});
