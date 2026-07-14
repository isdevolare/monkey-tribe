import { QUESTS, isQuestComplete } from "../config/quests";
import { useGameStore } from "../state/gameStore";
import type { GameState } from "../types/game";
import { hapticImpact, hapticOutcome } from "./haptics";
import { playBattleHit, playSound, setBackgroundLoop, setVillageAmbience } from "./soundManager";

// Live HP total of every unit plus both camps; any drop means damage landed.
function totalHp(state: GameState) {
  let hp = state.playerCampHp + state.enemyCampHp;
  for (const unit of state.units) {
    if (unit.state !== "dead") {
      hp += Math.max(0, unit.hp);
    }
  }
  return hp;
}

function buildingLevelSum(state: GameState) {
  return state.buildings.reduce((sum, building) => sum + building.level, 0);
}

function targetBackgroundLoop(state: GameState) {
  return state.currentScreen === "game" && state.gameStatus === "playing" ? "main" : null;
}

function targetVillageAmbience(state: GameState) {
  return state.currentScreen === "game" && state.gameStatus === "playing" && state.gameMode === "village";
}

// Quest progress is cumulative, so a quest can only cross its goal once —
// counting completions makes the unlock jingle fire exactly once each.
function completedQuestCount(state: GameState) {
  return QUESTS.filter((quest) => isQuestComplete(state.questProgress, quest)).length;
}

let started = false;
let lastHitHapticAt = 0;

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
  setBackgroundLoop(targetBackgroundLoop(prev));
  setVillageAmbience(targetVillageAmbience(prev));

  useGameStore.subscribe((state) => {
    const hp = totalHp(state);
    const levels = buildingLevelSum(state);
    setBackgroundLoop(targetBackgroundLoop(state));
    setVillageAmbience(targetVillageAmbience(state));

    // Raid lifecycle: horn on attack, jingle + loot coins on the outcome.
    if (state.raidStatus !== prev.raidStatus) {
      if (state.raidStatus === "active") {
        playSound("raid");
        hapticImpact("medium");
      } else if (state.raidStatus === "victory") {
        playSound("victory");
        hapticOutcome("success");
        setTimeout(() => playSound("coins"), 700);
      } else if (state.raidStatus === "defeat") {
        playSound("defeat");
        hapticOutcome("error");
      }
    }

    // Combat impacts (throttled + rotated inside playBattleHit).
    if (state.raidStatus === "active" && hp < prevHp) {
      playBattleHit();
      // Buzz less often than the hit sounds so combat doesn't turn into
      // a continuous vibration; big damage chunks thump harder.
      const hapticNow = Date.now();
      if (hapticNow - lastHitHapticAt >= 450) {
        lastHitHapticAt = hapticNow;
        hapticImpact(prevHp - hp >= 30 ? "medium" : "light");
      }
    }

    if (state.gameStatus === "playing" && prev.gameStatus === "playing") {
      // Unit queued for production vs. finished training.
      if (state.productionQueue.length > prev.productionQueue.length) {
        playSound("queue");
      } else if (state.productionQueue.length < prev.productionQueue.length) {
        playSound("confirm");
        hapticImpact("light");
      }

      // Building upgraded.
      if (levels > prevLevels) {
        playSound("build");
        hapticImpact("light");
      }

      // Existing economy spends keep their coin cue. Cosmetic collection
      // unlocks intentionally use only the shared button-click sound.
      const unlockedProfileMonkey =
        state.unlockedProfileMonkeys.length > prev.unlockedProfileMonkeys.length;
      const unlockedProfileSkin = state.ownedProfileSkins.length > prev.ownedProfileSkins.length;
      if (state.gems < prev.gems && !unlockedProfileMonkey && !unlockedProfileSkin) {
        playSound("coins");
      }
    }

    // A quest just crossed its goal — achievement unlocked (fires once,
    // because progress only ever counts up).
    if (completedQuestCount(state) > completedQuestCount(prev)) {
      playSound("achievement");
      hapticOutcome("success");
    }

    // Reward actually banked: quest claim or daily calendar claim. Watching
    // the store means failed claims (reducer returns same state) stay silent.
    if (
      state.questsClaimed.length > prev.questsClaimed.length ||
      (state.dailyLastClaim !== prev.dailyLastClaim && state.dailyLastClaim != null)
    ) {
      playSound("reward");
      hapticImpact("medium");
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
