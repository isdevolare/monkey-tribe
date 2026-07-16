import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { AppState } from "react-native";
import { create } from "zustand";

// Legacy master toggle key; migrated into the per-channel mutes below.
const SOUND_PREF_KEY = "monkey-tribe:sound-enabled";
const MUSIC_VOLUME_PREF_KEY = "monkey-tribe:music-volume";
const SFX_VOLUME_PREF_KEY = "monkey-tribe:sfx-volume";
const MUSIC_MUTED_PREF_KEY = "monkey-tribe:music-muted";
const SFX_MUTED_PREF_KEY = "monkey-tribe:sfx-muted";

// Short SFX are CC0 from Kenney (kenney.nl); see assets/game/audio/CREDITS.md.
const SOUND_FILES = {
  tap: require("../../../assets/game/audio/button_click.mp3"),
  open: require("../../../assets/game/audio/button_click.mp3"),
  close: require("../../../assets/game/audio/button_click.mp3"),
  confirm: require("../../../assets/game/audio/button_click.mp3"),
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
  defeat: require("../../../assets/game/audio/defeat.m4a"),
  achievement: require("../../../assets/game/audio/achievement_unlock.mp3"),
  workerReady: require("../../../assets/game/audio/worker_task_ready.mp3"),
  reward: require("../../../assets/game/audio/reward_claim.mp3"),
  festivalChest: require("../../../assets/game/audio/festival_chest_open.mp3")
} as const;

export type SoundName = keyof typeof SOUND_FILES;
export type BackgroundLoopName = "main";

// One background track for the whole game; the reconciler below owns
// every play/pause on it (single instance, fades, AppState handling).
const BACKGROUND_LOOP_FILES = {
  main: require("../../../assets/game/audio/jungle_village_theme.mp3")
} as const;

const VILLAGE_AMBIENCE_FILE = require("../../../assets/game/audio/ambient_forest_cc0.mp3");
const VILLAGE_AMBIENCE_GAIN = 0.12;

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
  defeat: 0.8,
  achievement: 0.85,
  workerReady: 0.58,
  reward: 0.75,
  festivalChest: 0.85
};

const BUTTON_CLICK_SOUNDS = new Set<SoundName>(["tap", "open", "close", "confirm"]);
const BUTTON_CLICK_THROTTLE_MS = 180;
const DEFAULT_MUSIC_VOLUME = 0.6;
const DEFAULT_SFX_VOLUME = 0.8;
const FADE_STEP_MS = 40;

type SoundSettings = {
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMusicMuted: (muted: boolean) => void;
  setSfxMuted: (muted: boolean) => void;
};

// Mutes are separate flags so unmuting restores the previous slider value.
export const useSoundStore = create<SoundSettings>((set) => ({
  musicVolume: DEFAULT_MUSIC_VOLUME,
  sfxVolume: DEFAULT_SFX_VOLUME,
  musicMuted: false,
  sfxMuted: false,
  setMusicVolume: (musicVolume) => {
    const volume = clampVolume(musicVolume);
    set({ musicVolume: volume });
    void AsyncStorage.setItem(MUSIC_VOLUME_PREF_KEY, String(volume));
    reconcileBackgroundLoop();
  },
  setSfxVolume: (sfxVolume) => {
    const volume = clampVolume(sfxVolume);
    set({ sfxVolume: volume });
    void AsyncStorage.setItem(SFX_VOLUME_PREF_KEY, String(volume));
  },
  setMusicMuted: (musicMuted) => {
    set({ musicMuted });
    void AsyncStorage.setItem(MUSIC_MUTED_PREF_KEY, musicMuted ? "true" : "false");
    reconcileBackgroundLoop();
  },
  setSfxMuted: (sfxMuted) => {
    set({ sfxMuted });
    void AsyncStorage.setItem(SFX_MUTED_PREF_KEY, sfxMuted ? "true" : "false");
  }
}));

void AsyncStorage.multiGet([
  MUSIC_VOLUME_PREF_KEY,
  SFX_VOLUME_PREF_KEY,
  MUSIC_MUTED_PREF_KEY,
  SFX_MUTED_PREF_KEY,
  SOUND_PREF_KEY
])
  .then((entries) => {
    const next: Partial<SoundSettings> = {};
    let sawMuteKeys = false;
    let legacyDisabled = false;

    for (const [key, raw] of entries) {
      // Unset keys come back as null (and Number(null) is 0) — keep defaults.
      if (raw == null || raw === "") {
        continue;
      }
      if (key === MUSIC_VOLUME_PREF_KEY || key === SFX_VOLUME_PREF_KEY) {
        const volume = Number(raw);
        if (Number.isFinite(volume)) {
          next[key === MUSIC_VOLUME_PREF_KEY ? "musicVolume" : "sfxVolume"] = clampVolume(volume);
        }
      } else if (key === MUSIC_MUTED_PREF_KEY) {
        next.musicMuted = raw === "true";
        sawMuteKeys = true;
      } else if (key === SFX_MUTED_PREF_KEY) {
        next.sfxMuted = raw === "true";
        sawMuteKeys = true;
      } else if (key === SOUND_PREF_KEY) {
        legacyDisabled = raw === "false";
      }
    }

    // One-time migration: old "sound off" master switch becomes both mutes.
    if (legacyDisabled && !sawMuteKeys) {
      next.musicMuted = true;
      next.sfxMuted = true;
    }

    if (Object.keys(next).length > 0) {
      useSoundStore.setState(next);
      reconcileBackgroundLoop();
    }
  })
  .catch(() => undefined);

let audioModeReady = false;
const players = new Map<SoundName, AudioPlayer>();
const lastPlayedAt: Partial<Record<SoundName, number>> = {};
const backgroundPlayers = new Map<BackgroundLoopName, AudioPlayer>();
const fadeTimers = new Map<BackgroundLoopName, ReturnType<typeof setInterval>>();
let desiredBackgroundLoop: BackgroundLoopName | null = null;
let activeBackgroundLoop: BackgroundLoopName | null = null;
let backgroundTransitionId = 0;
let lastButtonClickAt = 0;
let appSuspended = false;
let villageAmbienceDesired = false;
let villageAmbiencePlaying = false;
let villageAmbiencePlayer: AudioPlayer | null = null;

function clampVolume(volume: number) {
  if (!Number.isFinite(volume)) {
    return 0;
  }

  return Math.min(1, Math.max(0, volume));
}

function ensureAudioMode() {
  if (audioModeReady) {
    return;
  }
  audioModeReady = true;
  // Let SFX play even when the phone's ringer switch is on silent.
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
}

function sfxGain() {
  const settings = useSoundStore.getState();
  return settings.sfxMuted ? 0 : clampVolume(settings.sfxVolume);
}

export function playSound(name: SoundName, options?: { throttleMs?: number }) {
  const gain = sfxGain();
  if (gain <= 0) {
    return;
  }

  const now = Date.now();
  const playerName = BUTTON_CLICK_SOUNDS.has(name) ? "tap" : name;
  if (BUTTON_CLICK_SOUNDS.has(name)) {
    if (now - lastButtonClickAt < BUTTON_CLICK_THROTTLE_MS) {
      return;
    }
    lastButtonClickAt = now;
  }

  if (options?.throttleMs && now - (lastPlayedAt[name] ?? 0) < options.throttleMs) {
    return;
  }
  lastPlayedAt[name] = now;

  try {
    ensureAudioMode();
    let player = players.get(playerName);
    if (!player) {
      player = createAudioPlayer(SOUND_FILES[playerName]);
      players.set(playerName, player);
    }
    player.volume = clampVolume(VOLUMES[name] * gain);
    void player.seekTo(0);
    player.play();
  } catch {
    // Audio is flavor, never let it break gameplay (e.g. web autoplay rules).
  }
}

function clearFade(name: BackgroundLoopName) {
  const timer = fadeTimers.get(name);
  if (timer) {
    clearInterval(timer);
    fadeTimers.delete(name);
  }
}

function musicGain() {
  const settings = useSoundStore.getState();
  return settings.musicMuted ? 0 : clampVolume(settings.musicVolume);
}

function reconcileVillageAmbience() {
  const gain = musicGain() * VILLAGE_AMBIENCE_GAIN;
  const shouldPlay = villageAmbienceDesired && !appSuspended && gain > 0;

  try {
    if (!villageAmbiencePlayer && shouldPlay) {
      ensureAudioMode();
      villageAmbiencePlayer = createAudioPlayer(VILLAGE_AMBIENCE_FILE, { keepAudioSessionActive: true });
      villageAmbiencePlayer.loop = true;
    }

    if (!villageAmbiencePlayer) {
      return;
    }

    villageAmbiencePlayer.volume = clampVolume(gain);
    if (shouldPlay && !villageAmbiencePlaying) {
      villageAmbiencePlayer.play();
      villageAmbiencePlaying = true;
    } else if (!shouldPlay && villageAmbiencePlaying) {
      villageAmbiencePlayer.pause();
      villageAmbiencePlaying = false;
    }
  } catch {
    // Ambient audio is optional flavor and must never affect gameplay.
  }
}

function getBackgroundPlayer(name: BackgroundLoopName) {
  let player = backgroundPlayers.get(name);
  if (!player) {
    player = createAudioPlayer(BACKGROUND_LOOP_FILES[name], { keepAudioSessionActive: true });
    player.loop = true;
    player.volume = 0;
    backgroundPlayers.set(name, player);
  }
  return player;
}

function fadeVolume(
  name: BackgroundLoopName,
  toVolume: number,
  durationMs: number,
  onDone?: () => void
) {
  clearFade(name);
  const player = backgroundPlayers.get(name);
  if (!player) {
    onDone?.();
    return;
  }

  const fromVolume = clampVolume(player.volume);
  const target = clampVolume(toVolume);
  const steps = Math.max(1, Math.ceil(durationMs / FADE_STEP_MS));
  let step = 0;

  const timer = setInterval(() => {
    step += 1;
    const progress = Math.min(1, step / steps);
    player.volume = fromVolume + (target - fromVolume) * progress;

    if (progress >= 1) {
      clearFade(name);
      onDone?.();
    }
  }, FADE_STEP_MS);

  fadeTimers.set(name, timer);
}

function stopLoop(name: BackgroundLoopName, durationMs: number, onDone?: () => void) {
  const player = backgroundPlayers.get(name);
  if (!player) {
    if (activeBackgroundLoop === name) {
      activeBackgroundLoop = null;
    }
    onDone?.();
    return;
  }

  fadeVolume(name, 0, durationMs, () => {
    try {
      player.pause();
      void player.seekTo(0);
    } catch {
      // Audio is flavor, never let it break gameplay.
    }
    if (activeBackgroundLoop === name) {
      activeBackgroundLoop = null;
    }
    onDone?.();
  });
}

function startLoop(name: BackgroundLoopName, durationMs: number) {
  try {
    ensureAudioMode();
    const player = getBackgroundPlayer(name);
    player.loop = true;
    player.volume = 0;
    void player.seekTo(0);
    player.play();
    activeBackgroundLoop = name;
    fadeVolume(name, musicGain(), durationMs);
  } catch {
    // Audio is flavor, never let it break gameplay.
  }
}

function reconcileBackgroundLoop() {
  reconcileVillageAmbience();
  const transitionId = ++backgroundTransitionId;
  if (appSuspended) {
    return;
  }
  const nextLoop = musicGain() > 0 ? desiredBackgroundLoop : null;

  if (activeBackgroundLoop === nextLoop) {
    if (nextLoop) {
      const player = backgroundPlayers.get(nextLoop);
      if (player) {
        // Volume slider moved while this loop plays: chase the new level.
        fadeVolume(nextLoop, musicGain(), 120);
      }
    }
    return;
  }

  const previousLoop = activeBackgroundLoop;
  if (previousLoop) {
    stopLoop(previousLoop, 220, () => {
      if (transitionId !== backgroundTransitionId) {
        return;
      }
      if (nextLoop) {
        startLoop(nextLoop, 400);
      }
    });
    return;
  }

  if (nextLoop) {
    startLoop(nextLoop, 400);
  }
}

export function setBackgroundLoop(name: BackgroundLoopName | null) {
  if (desiredBackgroundLoop === name) {
    return;
  }

  desiredBackgroundLoop = name;
  reconcileBackgroundLoop();
}

export function setVillageAmbience(active: boolean) {
  if (villageAmbienceDesired === active) {
    return;
  }
  villageAmbienceDesired = active;
  reconcileVillageAmbience();
}

// Pause music while the app is backgrounded; resume the same player position
// when it comes back.
AppState.addEventListener("change", (status) => {
  const suspended = status !== "active";
  if (suspended === appSuspended) {
    return;
  }
  appSuspended = suspended;

  if (suspended) {
    backgroundTransitionId += 1;
    for (const name of backgroundPlayers.keys()) {
      clearFade(name);
    }
    const player = activeBackgroundLoop ? backgroundPlayers.get(activeBackgroundLoop) : null;
    try {
      player?.pause();
      villageAmbiencePlayer?.pause();
      villageAmbiencePlaying = false;
    } catch {
      // Audio is flavor, never let it break gameplay.
    }
  } else {
    reconcileVillageAmbience();
    const resumableLoop = activeBackgroundLoop;
    if (resumableLoop && resumableLoop === desiredBackgroundLoop && musicGain() > 0) {
      const player = backgroundPlayers.get(resumableLoop);
      try {
        player?.play();
        fadeVolume(resumableLoop, musicGain(), 120);
      } catch {
        // Audio is flavor, never let it break gameplay.
      }
    } else {
      reconcileBackgroundLoop();
    }
  }
});

// Battle hits rotate through variants so rapid combat doesn't sound robotic.
const HIT_VARIANTS: SoundName[] = ["hit0", "hit1", "hit2"];
let hitIndex = 0;

export function playBattleHit() {
  hitIndex = (hitIndex + 1) % HIT_VARIANTS.length;
  playSound(HIT_VARIANTS[hitIndex] ?? "hit0", { throttleMs: 160 });
}
