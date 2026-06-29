# Monkey Tribe

Monkey Tribe is a mobile-first 2D jungle strategy prototype built with Expo, React Native, TypeScript, Zustand, and an asset-ready image pipeline with vector fallbacks.

## Game Concept

You grow a monkey tribe from a jungle camp. The game has two layers:

- **Village (base management):** A calm, passive base. Tap resource nodes to instantly collect bananas, stones, and wood, then spend them to grow your population and put up buildings. No enemies attack the village.
- **Raid (combat):** When you have fighters, press RAID to send them into a separate battle scene against an enemy camp. Combat resolves automatically; win to earn rewards, then return to the village to prepare for the next raid.

## How It Plays

### Village

- Tap a banana tree, stone pile, or wood grove to collect that resource instantly.
- Use the bottom dock to create workers, train fighters, and build upgrades.
- Build a **Training Nest** before training fighters.
- Build a **Hut** to raise your max population.
- Build a **Watch Post** as an additional camp upgrade.
- Press **RAID** once you have at least one fighter.

### Raid

- Your fighters deploy into the raid scene and automatically attack the enemy camp.
- Enemy fighters defend and fight back.
- Destroy the enemy camp before your fighters fall to win rewards.
- Win or lose, use **Return to Village** (or **Retreat**) to go back and regroup.

## Current Features

- Two-mode loop: passive village base management and active raid combat.
- Tap-to-collect village resources (bananas, stones, wood).
- Worker and fighter unit types with a population cap.
- Hut, Training Nest, and Watch Post buildings.
- Painted top-down village and raid scenes (background art + positioned sprites).
- Typed PNG asset registry with safe vector fallback rendering.
- Auto-resolved raid combat with attack cooldowns and health bars.
- Raid rewards added to village stores on victory.
- First-start tutorial overlay.
- Objectives panel and action feedback text.

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
- Tap banana trees, stone piles, and wood groves and confirm resources increase.
- Create a worker when you have enough bananas.
- Build a Hut and confirm population capacity increases.
- Build a Training Nest and confirm fighters unlock.
- Train a fighter when you have enough bananas, stones, and wood.
- Build a Watch Post.
- Press RAID with at least one fighter and confirm the raid scene opens.
- Let the raid auto-resolve and confirm victory rewards or a failed-raid message.
- Return to the village and confirm you are back in base management.

## Asset Pipeline

Drop production PNGs into `assets/game/...` using the exact file names in [DESIGN_GUIDE.md](./DESIGN_GUIDE.md). Asset mode is enabled by default in `src/game/assets/gameAssets.ts`; switch `VISUAL_MODE` to `"fallback"` to debug with vector placeholders only. If a PNG is missing or fails to load, the matching vector fallback stays visible and gameplay is unaffected.

## Known Limitations

- Village is intentionally passive: no manual unit selection, no tile-by-tile movement, and no enemies attacking the village.
- Raid combat is auto-resolved; there is no manual unit control during a raid yet.
- Only one of each building can be built in this prototype.
- Enemy raid force is a fixed group rather than scaling AI.
- No save progression, multiplayer, ads, IAP, fog of war, or multiple maps.
