# Monkey Tribe Sound Guide

Companion to `DESIGN_GUIDE.md`. The game ships with a working SFX set (CC0, Kenney);
this guide documents what exists, how it is wired, and which production audio is
still wanted. Drop-in files go to `assets/game/audio/` and are registered in
`src/game/audio/soundManager.ts` (`SOUND_FILES` map).

## Format Requirements

- **AAC in `.m4a`** container (iOS cannot decode ogg; m4a plays on iOS/Android/web).
- Mono, 44.1 kHz, ~96 kbps is plenty for SFX.
- Trim silence from both ends; SFX should start within ~10 ms.
- Loudness: normalize SFX to about −16 LUFS; per-sound gain lives in code
  (`VOLUMES` map), so deliver consistent files rather than pre-mixed levels.

## Current SFX Set (shipped, replaceable)

| File | Trigger | Length | Character |
| --- | --- | ---: | --- |
| `tap.m4a` | every button press-in | ~0.1s | soft wooden tick |
| `open.m4a` / `close.m4a` | modal open / close & cancels | ~0.2s | short whoosh up / down |
| `confirm.m4a` | unit trained, game start | ~0.3s | bright positive blip |
| `error.m4a` | rejected action (cost/capacity) | ~0.3s | muted double-buzz |
| `queue.m4a` | unit added to production queue | ~0.2s | pop |
| `coins.m4a` | loot gained, gem spent | ~0.5s | coin shuffle |
| `build.m4a` | building upgraded | ~0.3s | heavy wood thunk |
| `hit0/1/2.m4a` | battle hits (rotated, 160 ms throttle) | ~0.2s | punchy impacts, 3 variants |
| `arrow.m4a` | reserved for archer shots | ~0.3s | slice/whoosh |
| `raid.m4a` | raid starts | ~1s | dramatic stinger |
| `victory.m4a` | raid won | ~1s | rising pizzicato jingle |
| `defeat.m4a` | raid lost | ~1s | falling pizzicato jingle |

## Wanted Production Audio (not yet shipped)

| File | Purpose | Length | Direction |
| --- | --- | ---: | --- |
| `ambient_jungle.m4a` | village background loop | 30–60s seamless loop | distant birds, insects, light canopy wind; NO melodic content; sits at very low volume (~0.15) under SFX |
| `music_menu.m4a` | main-menu theme | 45–90s loop | warm marimba/kalimba + hand percussion, playful "tribe" mood, loopable without a hard downbeat |
| `music_battle.m4a` | raid battle loop | 30–60s loop | driving drums, low intensity so hit SFX stay readable |
| `stinger_levelup.m4a` | stronghold level-up callout | ~1.5s | short tribal drum + shaker rise |
| `chop.m4a` / `mine.m4a` | worker shift gather accents | ~0.3s | axe on wood / pick on stone, played sparsely while a shift runs |

Integration notes for loops: `soundManager.ts` needs a `playLoop(name, volume)`
helper (create the player once, `player.loop = true`); duck or pause the ambient
loop while jingles play. Wire menu/battle music to `currentScreen`/`gameMode`
transitions in `soundBridge.ts`.

## Haptics Map (expo-haptics, `src/game/audio/haptics.ts`)

Haptics share the sound on/off toggle. Web is a no-op.

| Event | Haptic |
| --- | --- |
| any button press-in | `selectionAsync` |
| battle hit (≥450 ms apart) | `impactAsync(Light)` — `Medium` when ≥30 damage lands at once |
| unit trained / building upgraded | `impactAsync(Light)` |
| raid started | `impactAsync(Medium)` |
| raid victory / defeat | `notificationAsync(Success / Error)` |
