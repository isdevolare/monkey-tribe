# Monkey Tribe Asset Guide

Monkey Tribe is now prepared for drop-in PNG production art. Place files at the exact paths below.

## Visual Style

- Cartoon 3D jungle survival/RTS look.
- Warm golden lighting, dark premium jungle backdrop, readable silhouettes.
- Mobile-first readability: units and resources must be recognizable at 32-48 px.
- Use chunky shapes, high contrast, and friendly monkey expressions.
- Avoid tiny detail that disappears on a phone.

## Visual Mode Switch

Asset mode is enabled by default in:

```ts
src/game/assets/gameAssets.ts
```

Set:

```ts
export const VISUAL_MODE = "fallback";
```

to debug with vector fallbacks only.

## Folder Structure

```text
assets/game/ui/
assets/game/units/
assets/game/buildings/
assets/game/terrain/
assets/game/resources/
assets/game/backgrounds/
assets/game/fx/
```

## Required PNG Names

### Terrain

Place in `assets/game/terrain/`.

| File | Recommended Size | Notes |
| --- | ---: | --- |
| `terrain_grass.png` | 256x256 | Seamless tile, no transparency required |
| `terrain_jungle.png` | 256x256 | Seamless darker foliage tile |
| `terrain_mud.png` | 256x256 | Seamless path tile |
| `terrain_rock.png` | 256x256 | Tile or transparent rock prop |
| `terrain_water.png` | 256x256 | Seamless tile for future maps |
| `terrain_banana_tree.png` | 512x512 | Transparent background prop |
| `terrain_wood_tree.png` | 512x512 | Transparent background prop |

### Units

Place in `assets/game/units/`. Use transparent backgrounds.

| File | Recommended Size |
| --- | ---: |
| `unit_worker.png` | 512x512 |
| `unit_fighter.png` | 512x512 |
| `unit_scout.png` | 512x512 |
| `unit_enemy_fighter.png` | 512x512 |

### Buildings

Place in `assets/game/buildings/`. Use transparent backgrounds.

| File | Recommended Size |
| --- | ---: |
| `building_player_camp.png` | 768x768 |
| `building_enemy_camp.png` | 768x768 |
| `building_hut.png` | 512x512 |
| `building_training_nest.png` | 512x512 |
| `building_watch_post.png` | 512x512 |

### Resources

Place in `assets/game/resources/`. Use transparent backgrounds.

| File | Recommended Size |
| --- | ---: |
| `resource_banana.png` | 256x256 |
| `resource_stone.png` | 256x256 |
| `resource_wood.png` | 256x256 |
| `resource_population.png` | 256x256 |

### UI

Place in `assets/game/ui/`. Use transparent backgrounds unless noted.

| File | Recommended Size | Notes |
| --- | ---: | --- |
| `ui_button_build.png` | 256x256 | Build tab icon |
| `ui_button_monkeys.png` | 256x256 | Unit tab icon |
| `ui_button_map.png` | 256x256 | Map tab icon |
| `ui_button_raid.png` | 256x256 | Raid tab icon |
| `ui_panel_dark.png` | 512x256 | Optional panel texture |
| `ui_panel_light.png` | 512x256 | Optional panel texture |

### Backgrounds

Place in `assets/game/backgrounds/`.

| File | Recommended Size | Notes |
| --- | ---: | --- |
| `bg_main_menu.png` | 1440x2560 | Full portrait title background |
| `bg_jungle_game.png` | 1440x2560 | Full portrait gameplay background |

## Export Requirements

- PNG format.
- Transparent background for units, buildings, resource icons, props, and UI icons.
- Full-bleed backgrounds should not be transparent.
- Keep important content inside a 10% safe margin.
- Use sRGB color.
- Avoid baked text inside images; text remains native for localization and accessibility.

## Fallback Behavior

The app renders vector fallbacks underneath asset images. If a PNG is missing or fails to load, gameplay remains usable and the fallback stays visible.
