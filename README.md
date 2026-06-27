# Monkey Tribe

Monkey Tribe is a mobile-first 2D top-down strategy prototype built with Expo, React Native, TypeScript, Zustand, and an asset-ready image pipeline with vector fallbacks.

## Game Concept

You command a small monkey tribe from a jungle camp. Worker monkeys gather bananas, stones, and wood, buildings expand the tribe, fighters defend the camp, and the goal is to destroy the enemy monkey camp before its fighters overwhelm you.

## Controls

- Tap a player monkey to select it.
- Tap an empty or grass tile to move the selected monkey.
- Select a worker, then tap a banana tree, stone rock, or wood grove to gather.
- Select any monkey, then tap an enemy monkey to attack.
- Select a monkey, then tap the enemy camp to attack it.
- Use the bottom buttons to create workers, build camp upgrades, or train fighters when you have enough resources.
- Build a Training Nest before training fighters.
- Build a Hut to increase max population.
- Build a Watch Post to reduce incoming camp damage.

## Current Features

- 10x10 portrait-first top-down grid.
- Typed PNG asset registry with safe fallback rendering.
- Jungle-style board with grass, darker jungle, mud paths, bushes, banana trees, stone rocks, wood groves, and distinct camps.
- Worker and fighter unit types.
- Wood as a third resource.
- Hut, Training Nest, and Watch Post buildings.
- Max population and building unlocks.
- Tick-based one-tile Manhattan movement.
- Worker gather, return, and deposit loop for one trip per command.
- Simple melee combat with attack cooldowns.
- Defensive enemy fighters with detection range.
- Enemy camp slowly trains extra fighters.
- First-start tutorial overlay.
- Action feedback text for gathering, training, building, attacks, and enemy pressure.
- Selection highlight, reachable tile hint, attack hint, and unit/camp health bars.
- Victory and defeat result screen.
- Thumb-sized production buttons with resource cost gating.

## How To Run

Install dependencies:

```sh
npm install
```

Start Expo:

```sh
npm run start -- --port 19000 --lan --clear
```

Other scripts:

```sh
npm run typecheck
npm run doctor
```

## Asset Pipeline

Drop production PNGs into `assets/game/...` using the exact file names in [DESIGN_GUIDE.md](./DESIGN_GUIDE.md). Asset mode is enabled by default in `src/game/assets/gameAssets.ts`; switch `VISUAL_MODE` to `"fallback"` to debug with vector placeholders only.

## Testing Checklist

- Start a new game from the main menu.
- Select the worker and gather bananas from a banana tree.
- Select the worker and gather stones from a stone rock.
- Select the worker and gather wood from a wood grove.
- Confirm resources increase after the worker returns to camp.
- Create a worker when you have at least 10 bananas.
- Build a Hut and confirm population capacity increases.
- Build a Training Nest and confirm fighters unlock.
- Train a fighter when you have enough bananas, stones, and wood.
- Build a Watch Post and confirm enemy camp attacks are reduced.
- Select a fighter and attack enemy units.
- Attack the enemy camp until its HP reaches 0 and confirm Victory.
- Let all player units die without enough resources to recover and confirm Defeat.

## Known Limitations

- No pathfinding beyond direct Manhattan stepping.
- Units can share target/resource/camp tiles.
- Workers complete one gather trip per command instead of repeating forever.
- Enemy AI only guards and reacts to nearby player units.
- Only one of each building can be built in this prototype.
- No save progression, multiplayer, ads, IAP, fog of war, or multiple maps.
