import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { create } from "zustand";

const SOUND_PREF_KEY = "monkey-tribe:sound-enabled";

// All SFX are CC0 from Kenney (kenney.nl); see assets/game/audio/CREDITS.md.
const SOUND_FILES = {
  tap: require("../../../assets/game/audio/tap.m4a"),
  open: require("../../../assets/game/audio/open.m4a"),
  close: require("../../../assets/game/audio/close.m4a"),
  confirm: require("../../../assets/game/audio/confirm.m4a"),
  error: require("../../../assets/game/audio/error.m4a"),
  queue: require("../../../assets/game/audio/queue.m4a"),
  coins: require("../../../assets/game/audio/coins.m4a"),
  build: require("../../../assets/game/audio/build.m4a"),
  hit0: require("../../../assets/game/audio/hit0.m4a"),
  hit1: require("../../../assets/game/audio/hit1.m4a"),
  hit2: require("../../../assets/game/audio/hit2.m4a"),
  arrow: require("../../../assets/game/audio/arrow.m4a"),
  raid: require("../../../assets/game/audio/raid.m4a"),
  victory: require("../../../assets/game/audio/victory.m4a"),
  defeat: require("../../../assets/game/audio/defeat.m4a")
} as const;

export type SoundName = keyof typeof SOUND_FILES;

const VOLUMES: Record<SoundName, number> = {
  tap: 0.5,
  open: 0.5,
  close: 0.5,
  confirm: 0.65,
  error: 0.55,
  queue: 0.6,
  coins: 0.7,
  build: 0.7,
  hit0: 0.55,
  hit1: 0.55,
  hit2: 0.55,
  arrow: 0.45,
  raid: 0.75,
  victory: 0.85,
  defeat: 0.8
};

export const useSoundStore = create<{
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}>((set) => ({
  enabled: true,
  setEnabled: (enabled) => {
    set({ enabled });
    void AsyncStorage.setItem(SOUND_PREF_KEY, enabled ? "true" : "false");
  }
}));

void AsyncStorage.getItem(SOUND_PREF_KEY)
  .then((stored) => {
    if (stored === "false") {
      useSoundStore.setState({ enabled: false });
    }
  })
  .catch(() => undefined);

let audioModeReady = false;
const players = new Map<SoundName, AudioPlayer>();
const lastPlayedAt: Partial<Record<SoundName, number>> = {};

function ensureAudioMode() {
  if (audioModeReady) {
    return;
  }
  audioModeReady = true;
  // Let SFX play even when the phone's ringer switch is on silent.
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
}

export function playSound(name: SoundName, options?: { throttleMs?: number }) {
  if (!useSoundStore.getState().enabled) {
    return;
  }

  const now = Date.now();
  if (options?.throttleMs && now - (lastPlayedAt[name] ?? 0) < options.throttleMs) {
    return;
  }
  lastPlayedAt[name] = now;

  try {
    ensureAudioMode();
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(SOUND_FILES[name]);
      player.volume = VOLUMES[name];
      players.set(name, player);
    }
    void player.seekTo(0);
    player.play();
  } catch {
    // Audio is flavor, never let it break gameplay (e.g. web autoplay rules).
  }
}

// Battle hits rotate through variants so rapid combat doesn't sound robotic.
const HIT_VARIANTS: SoundName[] = ["hit0", "hit1", "hit2"];
let hitIndex = 0;

export function playBattleHit() {
  hitIndex = (hitIndex + 1) % HIT_VARIANTS.length;
  playSound(HIT_VARIANTS[hitIndex] ?? "hit0", { throttleMs: 160 });
}
