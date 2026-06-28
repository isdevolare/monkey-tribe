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
| `terrain_grass_tile.png` | 1024x1024 | Seamless grass tile, no transparency required |
| `terrain_jungle_tile.png` | 1024x1024 | Seamless darker foliage tile |
| `terrain_mud_path_tile.png` | 1024x1024 | Seamless path tile |
| `terrain_water_tile.png` | 1024x1024 | Seamless tile for future maps |
| `terrain_rock.png` | 1024x1024 | Transparent rock prop |
| `terrain_bush.png` | 1024x1024 | Transparent bush prop |
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
| `unit_chief.png` | 512x512 |
| `monkey_units_sheet.png` | 1341x1173 | Fallback only when individual unit PNGs are missing |

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

Place in `assets/game/ui/`. Use transparent backgrounds.

| File | Recommended Size |
| --- | ---: |
| `banana_icon.png` | 256x256 |
| `stone_icon.png` | 256x256 |
| `wood_icon.png` | 256x256 |
| `population_icon.png` | 256x256 |

### UI

Place in `assets/game/ui/`. Use transparent backgrounds unless noted.

| File | Recommended Size | Notes |
| --- | ---: | --- |
| `logo.png` | 1024x1024 | Main menu title/logo |
| `ui_button_wood_large.png` | Flexible 9-slice style | Main menu and wooden buttons |
| `ui_button_build.png` | 256x256 | Build tab icon |
| `ui_button_monkeys.png` | 256x256 | Unit tab icon |
| `ui_button_map.png` | 256x256 | Map tab icon |
| `ui_button_raid.png` | Flexible 9-slice style | Raid button fallback |
| `ui_button_raid_large.png` | Flexible 9-slice style | Preferred large raid button if available |
| `ui_button_attack.png` | Flexible 9-slice style | Attack/action button |
| `ui_card_building.png` | 512x512 | Building/action dock card |
| `ui_icon_frame.png` | 256x256 | Clan avatar, unit portrait, resource/menu icon frame |
| `ui_panel_dark.png` | 512x256 | Optional panel texture |
| `ui_panel_light.png` | 512x256 | Optional panel texture |
| `ui_sprite_sheet.png` | Varies | Optional UI atlas if exported later |
| `ui_game_sheet.png` | Varies | Current available UI atlas |

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
