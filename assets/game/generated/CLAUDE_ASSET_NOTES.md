# Claude Integration Notes - Monkey Tribe Generated Assets

These assets are transparent PNGs generated for the Monkey Tribe mobile base-builder direction. They are intended to be wired into the game by Claude without changing gameplay rules.

## Main Menu Assets

Use these to make the title screen richer:

- `menu/menu_monkey_chief_mascot.png`
  - Main mascot near the logo or beside the start buttons.
  - Suggested size: 140-220 px tall on mobile.
- `menu/menu_title_plaque.png`
  - Wooden title/logo backing plate or panel behind menu copy.
  - Suggested size: 280-360 px wide.
- `menu/menu_jungle_totem.png`
  - Side decoration, left/right foreground prop.
  - Suggested size: 90-150 px tall.
- `menu/menu_jungle_torch.png`
  - Side decoration near buttons or bottom corners.
  - Suggested size: 100-170 px tall.

## Camp / Building Assets

Use these for upgrades and new building options:

- `camps/camp_player_level2.png`
  - Player camp upgrade level 2.
  - Replace or overlay after camp upgrade.
- `camps/camp_player_level3.png`
  - Player camp upgrade level 3 / chief hall.
  - Use as late upgrade centerpiece.
- `camps/camp_archer_tower.png`
  - Archer tower / watch post visual.
  - Good replacement for watch post when defense improves.
- `camps/camp_warrior_barracks.png`
  - Warrior barracks / fighter training building.
  - Good alternative or upgrade for Training Nest.

Suggested in-game sizes:

- Camps: 96-150 px wide depending on scene scale.
- Towers: 72-110 px tall.
- Barracks: 90-130 px wide.

## Unit Assets

Use these for unit classes and raid enemies:

- `units/unit_archer_monkey.png`
  - Player ranged unit.
  - Suggested role: unlocked from archer tower or later training building.
- `units/unit_warrior_monkey.png`
  - Player melee warrior upgrade.
  - Suggested role: stronger fighter variant.
- `units/unit_enemy_archer_monkey.png`
  - Enemy ranged defender in raid mode.
- `units/unit_enemy_warrior_monkey.png`
  - Enemy melee defender in raid mode.

Suggested in-game sizes:

- Village idle units: 42-58 px tall.
- Raid combat units: 54-72 px tall.
- Use no card/square background behind these units.

## Resource Assets

Use these as resource nodes, rewards, or UI resource detail icons:

- `resources/resource_banana_pile.png`
  - Banana collection pile or reward icon.
- `resources/resource_stone_pile.png`
  - Stone collection pile or reward icon.
- `resources/resource_wood_bundle.png`
  - Wood collection pile or reward icon.
- `resources/resource_jungle_gem.png`
  - Premium/upgrade currency concept.

Suggested sizes:

- Map nodes: 48-80 px.
- UI icons: 28-44 px.
- Reward popups: 64-96 px.

## Existing Prop Pack

Already available in `assets/game/props/`:

- `prop_campfire.png`
- `prop_crate.png`
- `prop_barrel.png`
- `prop_log_pile.png`
- `prop_banana_basket.png`
- `prop_rope_coil.png`
- `prop_fence_segment.png`
- `prop_training_dummy.png`

Use these to make the village feel alive around buildings. Best placement:

- Campfire in front of player camp.
- Crates/barrels/rope near camp and barracks.
- Log pile near wood resource or build area.
- Banana basket near banana trees or camp storage.
- Fence segment around the village ring.
- Training dummy near Training Nest / Warrior Barracks.

## Visual Rules

- Keep these PNGs transparent; do not place them inside dark cards on the map.
- Render units/buildings as absolute-positioned scene sprites.
- Keep visible grid hidden on the village screen.
- Enemy units/buildings should stay in raid mode, not the village screen.
- Use scale variation so the scene feels hand-composed instead of tile-stamped.
