import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GameBoard } from "../components/game/GameBoard";
import { GameButton } from "../components/game/GameButton";
import { UNIT_COSTS } from "../game/config/constants";
import { useGameStore } from "../game/state/gameStore";
import type { Tile, Unit } from "../game/types/game";
import { theme } from "../theme/theme";

export function GameScreen() {
  const state = useGameStore();
  const selectedUnit =
    state.units.find((unit) => unit.id === state.selectedUnitId && unit.state !== "dead") ??
    null;

  useEffect(() => {
    const timer = setInterval(() => {
      state.tickGame();
    }, 150);

    return () => clearInterval(timer);
  }, [state.tickGame]);

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

    if (tile.type === "enemyCamp") {
      state.commandAttack({ kind: "camp", owner: "enemy" });
      return;
    }

    state.commandMove(tile.x, tile.y);
  }

  const canCreateWorker = state.resources.bananas >= UNIT_COSTS.worker.bananas;
  const canTrainFighter =
    state.resources.bananas >= UNIT_COSTS.fighter.bananas &&
    state.resources.stones >= UNIT_COSTS.fighter.stones;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hud}>
        <HudItem label="Bananas" value={state.resources.bananas} />
        <HudItem label="Stones" value={state.resources.stones} />
        <HudItem label="Your Camp" value={state.playerCampHp} />
        <HudItem label="Enemy Camp" value={state.enemyCampHp} />
      </View>

      <GameBoard
        tiles={state.mapTiles}
        units={state.units}
        selectedUnitId={state.selectedUnitId}
        onCellPress={handleCellPress}
      />

      <SelectedUnitPanel unit={selectedUnit} />

      <View style={styles.production}>
        <GameButton
          label="Create Worker  10 bananas"
          disabled={!canCreateWorker}
          onPress={state.createWorker}
        />
        <GameButton
          label="Train Fighter  15 bananas + 5 stones"
          disabled={!canTrainFighter}
          onPress={state.trainFighter}
        />
      </View>
    </ScrollView>
  );
}

function HudItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.hudItem}>
      <Text style={styles.hudValue}>{value}</Text>
      <Text style={styles.hudLabel}>{label}</Text>
    </View>
  );
}

function SelectedUnitPanel({ unit }: { unit: Unit | null }) {
  if (!unit) {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>No monkey selected</Text>
        <Text style={styles.panelText}>Tap a player monkey, then tap the map.</Text>
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
    return "Tap bananas or stone to gather, or tap an enemy for a weak attack.";
  }

  return "Tap an enemy monkey or the enemy camp to attack.";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.jungle
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md
  },
  hud: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  hudItem: {
    flexGrow: 1,
    flexBasis: "46%",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.panel,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  hudValue: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  hudLabel: {
    color: "#4d5837",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  panel: {
    minHeight: 98,
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
    fontWeight: "700"
  },
  production: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md
  }
});
