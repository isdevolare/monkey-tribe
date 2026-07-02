import { useGameStore } from "../state/gameStore";
import { playBattleHit, playSound } from "./soundManager";

// Live HP total of every unit plus both camps; any drop means damage landed.
function totalHp(state: ReturnType<typeof useGameStore.getState>) {
  let hp = state.playerCampHp + state.enemyCampHp;
  for (const unit of state.units) {
    if (unit.state !== "dead") {
      hp += Math.max(0, unit.hp);
    }
  }
  return hp;
}

function buildingLevelSum(state: ReturnType<typeof useGameStore.getState>) {
  return state.buildings.reduce((sum, building) => sum + building.level, 0);
}

let started = false;

/**
 * Watches game-state transitions and plays matching SFX. Keeps the store's
 * reducers pure: all audio side effects live here.
 */
export function initGameSounds() {
  if (started) {
    return;
  }
  started = true;

  let prev = useGameStore.getState();
  let prevHp = totalHp(prev);
  let prevLevels = buildingLevelSum(prev);

  useGameStore.subscribe((state) => {
    const hp = totalHp(state);
    const levels = buildingLevelSum(state);

    // Raid lifecycle: horn on attack, jingle + loot coins on the outcome.
    if (state.raidStatus !== prev.raidStatus) {
      if (state.raidStatus === "active") {
        playSound("raid");
      } else if (state.raidStatus === "victory") {
        playSound("victory");
        setTimeout(() => playSound("coins"), 700);
      } else if (state.raidStatus === "defeat") {
        playSound("defeat");
      }
    }

    // Combat impacts (throttled + rotated inside playBattleHit).
    if (state.raidStatus === "active" && hp < prevHp) {
      playBattleHit();
    }

    if (state.gameStatus === "playing" && prev.gameStatus === "playing") {
      // Unit queued for production vs. finished training.
      if (state.productionQueue.length > prev.productionQueue.length) {
        playSound("queue");
      } else if (state.productionQueue.length < prev.productionQueue.length) {
        playSound("confirm");
      }

      // Building upgraded.
      if (levels > prevLevels) {
        playSound("build");
      }

      // Gems spent on a rush.
      if (state.gems < prev.gems) {
        playSound("coins");
      }
    }

    // Rejected actions surface as feedback (not enough resources/gems/etc.).
    if (
      state.feedback &&
      state.feedback.id !== prev.feedback?.id &&
      /gerek|yeterli|dolu|önce|need|not enough|full|first/i.test(state.feedback.text)
    ) {
      playSound("error", { throttleMs: 250 });
    }

    prev = state;
    prevHp = hp;
    prevLevels = levels;
  });
}
