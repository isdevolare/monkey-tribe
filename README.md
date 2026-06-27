# Monkey Tribe

Monkey Tribe is a mobile-first 2D top-down strategy prototype built with Expo, React Native, TypeScript, Zustand, and in-code SVG visuals.

## Game Concept

You command a small monkey tribe from a jungle camp. Worker monkeys gather bananas and stones, fighters defend the tribe, and the goal is to destroy the enemy monkey camp.

## Controls

- Tap a player monkey to select it.
- Tap an empty or grass tile to move the selected monkey.
- Select a worker, then tap a banana tree or stone rock to gather.
- Select any monkey, then tap an enemy monkey to attack.
- Select a monkey, then tap the enemy camp to attack it.
- Use the bottom buttons to create workers or train fighters when you have enough resources.

## Current Features

- 10x10 portrait-first top-down grid.
- Player camp, enemy camp, banana trees, stone rocks, and walkable grass/empty tiles.
- Worker and fighter unit types.
- Tick-based one-tile Manhattan movement.
- Worker gather, return, and deposit loop for one trip per command.
- Simple melee combat with attack cooldowns.
- Defensive enemy fighters with detection range.
- Enemy camp spawns an extra fighter every 45 seconds.
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

## Testing Checklist

- Start a new game from the main menu.
- Select the worker and gather bananas from a banana tree.
- Select the worker and gather stones from a stone rock.
- Confirm resources increase after the worker returns to camp.
- Create a worker when you have at least 10 bananas.
- Train a fighter when you have at least 15 bananas and 5 stones.
- Select a fighter and attack enemy units.
- Attack the enemy camp until its HP reaches 0 and confirm Victory.
- Let all player units die without enough resources to recover and confirm Defeat.

## Known Limitations

- No pathfinding beyond direct Manhattan stepping.
- Units can share target/resource/camp tiles.
- Workers complete one gather trip per command instead of repeating forever.
- Enemy AI only guards and reacts to nearby player units.
- No save progression, multiplayer, ads, IAP, fog of war, or multiple maps.
