import type { ImageSourcePropType } from "react-native";

export type VisualMode = "assets" | "fallback";

export const VISUAL_MODE: VisualMode = "assets";

export type GameAssetFolder =
  | "ui"
  | "units"
  | "buildings"
  | "terrain"
  | "resources"
  | "backgrounds"
  | "fx";

export type GameAssetKey =
  | "uiLogo"
  | "unitMonkeySheet"
  | "terrainGrass"
  | "terrainJungle"
  | "terrainMud"
  | "terrainRock"
  | "terrainWater"
  | "terrainBananaTree"
  | "terrainWoodTree"
  | "terrainBush"
  | "terrainGrassTile"
  | "terrainJungleTile"
  | "terrainMudPathTile"
  | "terrainWaterTile"
  | "unitWorker"
  | "unitFighter"
  | "unitScout"
  | "unitChief"
  | "unitEnemyFighter"
  | "buildingPlayerCamp"
  | "buildingEnemyCamp"
  | "buildingHut"
  | "buildingTrainingNest"
  | "buildingWatchPost"
  | "resourceBanana"
  | "resourceStone"
  | "resourceWood"
  | "resourcePopulation"
  | "uiButtonWoodLarge"
  | "uiButtonBuild"
  | "uiButtonMonkeys"
  | "uiButtonMap"
  | "uiButtonRaid"
  | "uiButtonAttack"
  | "uiButtonRaidLarge"
  | "uiCardBuilding"
  | "uiIconFrame"
  | "uiSpriteSheet"
  | "uiGameSheet"
  | "uiPanelDark"
  | "uiPanelLight"
  | "bgMainMenu"
  | "bgJungleGame";

export type GameAssetDefinition = {
  key: GameAssetKey;
  folder: GameAssetFolder;
  fileName: string;
  uri: string;
  recommendedSize: string;
  source?: ImageSourcePropType;
};

function asset(
  key: GameAssetKey,
  folder: GameAssetFolder,
  fileName: string,
  recommendedSize: string
): GameAssetDefinition {
  return {
    key,
    folder,
    fileName,
    recommendedSize,
    uri: `assets/game/${folder}/${fileName}`
  };
}

export const gameAssets = {
  terrainGrass: asset("terrainGrass", "terrain", "terrain_grass.png", "legacy 256x256 tile"),
  terrainJungle: asset("terrainJungle", "terrain", "terrain_jungle.png", "legacy 256x256 tile"),
  terrainMud: asset("terrainMud", "terrain", "terrain_mud.png", "legacy 256x256 tile"),
  terrainRock: {
    ...asset("terrainRock", "terrain", "terrain_rock.png", "1024x1024 transparent prop"),
    source: require("../../../assets/game/terrain/terrain_rock.png") as ImageSourcePropType
  },
  terrainWater: asset("terrainWater", "terrain", "terrain_water.png", "legacy 256x256 tile"),
  terrainBananaTree: {
    ...asset("terrainBananaTree", "terrain", "terrain_banana_tree.png", "512x512 transparent prop"),
    source: require("../../../assets/game/terrain/terrain_banana_tree.png") as ImageSourcePropType
  },
  terrainWoodTree: {
    ...asset("terrainWoodTree", "terrain", "terrain_wood_tree.png", "512x512 transparent prop"),
    source: require("../../../assets/game/terrain/terrain_wood_tree.png") as ImageSourcePropType
  },
  terrainBush: {
    ...asset("terrainBush", "terrain", "terrain_bush.png", "1024x1024 transparent prop"),
    source: require("../../../assets/game/terrain/terrain_bush.png") as ImageSourcePropType
  },
  terrainGrassTile: {
    ...asset("terrainGrassTile", "terrain", "terrain_grass_tile.png", "1024x1024 seamless tile"),
    source: require("../../../assets/game/terrain/terrain_grass_tile.png") as ImageSourcePropType
  },
  terrainJungleTile: {
    ...asset("terrainJungleTile", "terrain", "terrain_jungle_tile.png", "1024x1024 seamless tile"),
    source: require("../../../assets/game/terrain/terrain_jungle_tile.png") as ImageSourcePropType
  },
  terrainMudPathTile: {
    ...asset("terrainMudPathTile", "terrain", "terrain_mud_path_tile.png", "1024x1024 seamless tile"),
    source: require("../../../assets/game/terrain/terrain_mud_path_tile.png") as ImageSourcePropType
  },
  terrainWaterTile: {
    ...asset("terrainWaterTile", "terrain", "terrain_water_tile.png", "1024x1024 seamless tile"),
    source: require("../../../assets/game/terrain/terrain_water_tile.png") as ImageSourcePropType
  },
  unitWorker: {
    ...asset("unitWorker", "units", "unit_worker.png", "512x512 transparent unit"),
    source: require("../../../assets/game/units/unit_worker.png") as ImageSourcePropType
  },
  unitFighter: {
    ...asset("unitFighter", "units", "unit_fighter.png", "512x512 transparent unit"),
    source: require("../../../assets/game/units/unit_fighter.png") as ImageSourcePropType
  },
  unitScout: {
    ...asset("unitScout", "units", "unit_scout.png", "512x512 transparent unit"),
    source: require("../../../assets/game/units/unit_scout.png") as ImageSourcePropType
  },
  unitChief: {
    ...asset("unitChief", "units", "unit_chief.png", "512x512 transparent unit"),
    source: require("../../../assets/game/units/unit_chief.png") as ImageSourcePropType
  },
  unitEnemyFighter: {
    ...asset("unitEnemyFighter", "units", "unit_enemy_fighter.png", "512x512 transparent unit"),
    source: require("../../../assets/game/units/unit_enemy_fighter.png") as ImageSourcePropType
  },
  buildingPlayerCamp: {
    ...asset("buildingPlayerCamp", "buildings", "building_player_camp.png", "768x768 transparent building"),
    source: require("../../../assets/game/buildings/building_player_camp.png") as ImageSourcePropType
  },
  buildingEnemyCamp: {
    ...asset("buildingEnemyCamp", "buildings", "building_enemy_camp.png", "768x768 transparent building"),
    source: require("../../../assets/game/buildings/building_enemy_camp.png") as ImageSourcePropType
  },
  buildingHut: {
    ...asset("buildingHut", "buildings", "building_hut.png", "512x512 transparent building"),
    source: require("../../../assets/game/buildings/building_hut.png") as ImageSourcePropType
  },
  buildingTrainingNest: {
    ...asset("buildingTrainingNest", "buildings", "building_training_nest.png", "512x512 transparent building"),
    source: require("../../../assets/game/buildings/building_training_nest.png") as ImageSourcePropType
  },
  buildingWatchPost: {
    ...asset("buildingWatchPost", "buildings", "building_watch_post.png", "512x512 transparent building"),
    source: require("../../../assets/game/buildings/building_watch_post.png") as ImageSourcePropType
  },
  resourceBanana: {
    ...asset("resourceBanana", "ui", "banana_icon.png", "256x256 transparent icon"),
    source: require("../../../assets/game/ui/banana_icon.png") as ImageSourcePropType
  },
  resourceStone: {
    ...asset("resourceStone", "ui", "stone_icon.png", "256x256 transparent icon"),
    source: require("../../../assets/game/ui/stone_icon.png") as ImageSourcePropType
  },
  resourceWood: {
    ...asset("resourceWood", "ui", "wood_icon.png", "256x256 transparent icon"),
    source: require("../../../assets/game/ui/wood_icon.png") as ImageSourcePropType
  },
  resourcePopulation: {
    ...asset("resourcePopulation", "ui", "population_icon.png", "256x256 transparent icon"),
    source: require("../../../assets/game/ui/population_icon.png") as ImageSourcePropType
  },
  uiLogo: {
    ...asset("uiLogo", "ui", "logo.png", "1024x1024 transparent or square logo"),
    source: require("../../../assets/game/ui/logo.png") as ImageSourcePropType
  },
  unitMonkeySheet: {
    ...asset("unitMonkeySheet", "units", "monkey_units_sheet.png", "1341x1173 sprite sheet"),
    source: require("../../../assets/game/units/monkey_units_sheet.png") as ImageSourcePropType
  },
  uiButtonWoodLarge: {
    ...asset("uiButtonWoodLarge", "ui", "ui_button_wood_large.png", "large wooden button"),
    source: require("../../../assets/game/ui/ui_button_wood_large.png") as ImageSourcePropType
  },
  uiButtonBuild: asset("uiButtonBuild", "ui", "ui_button_build.png", "256x256 transparent icon"),
  uiButtonMonkeys: asset("uiButtonMonkeys", "ui", "ui_button_monkeys.png", "256x256 transparent icon"),
  uiButtonMap: asset("uiButtonMap", "ui", "ui_button_map.png", "256x256 transparent icon"),
  uiButtonRaid: {
    ...asset("uiButtonRaid", "ui", "ui_button_raid.png", "raid button"),
    source: require("../../../assets/game/ui/ui_button_raid.png") as ImageSourcePropType
  },
  uiButtonAttack: {
    ...asset("uiButtonAttack", "ui", "ui_button_attack.png", "attack button"),
    source: require("../../../assets/game/ui/ui_button_attack.png") as ImageSourcePropType
  },
  uiButtonRaidLarge: asset("uiButtonRaidLarge", "ui", "ui_button_raid_large.png", "large raid button"),
  uiCardBuilding: {
    ...asset("uiCardBuilding", "ui", "ui_card_building.png", "building/action card frame"),
    source: require("../../../assets/game/ui/ui_card_building.png") as ImageSourcePropType
  },
  uiIconFrame: {
    ...asset("uiIconFrame", "ui", "ui_icon_frame.png", "icon portrait frame"),
    source: require("../../../assets/game/ui/ui_icon_frame.png") as ImageSourcePropType
  },
  uiSpriteSheet: asset("uiSpriteSheet", "ui", "ui_sprite_sheet.png", "UI sprite sheet"),
  uiGameSheet: {
    ...asset("uiGameSheet", "ui", "ui_game_sheet.png", "available UI sprite sheet"),
    source: require("../../../assets/game/ui/ui_game_sheet.png") as ImageSourcePropType
  },
  uiPanelDark: {
    ...asset("uiPanelDark", "ui", "ui_panel_dark.png", "512x256 nine-slice style panel"),
    source: require("../../../assets/game/ui/ui_panel_dark.png") as ImageSourcePropType
  },
  uiPanelLight: {
    ...asset("uiPanelLight", "ui", "ui_panel_light.png", "512x256 nine-slice style panel"),
    source: require("../../../assets/game/ui/ui_panel_light.png") as ImageSourcePropType
  },
  bgMainMenu: {
    ...asset("bgMainMenu", "backgrounds", "bg_main_menu.png", "1440x2560 portrait"),
    source: require("../../../assets/game/backgrounds/bg_main_menu.png") as ImageSourcePropType
  },
  bgJungleGame: {
    ...asset("bgJungleGame", "backgrounds", "bg_jungle_game.png", "1440x2560 portrait"),
    source: require("../../../assets/game/backgrounds/bg_jungle_game.png") as ImageSourcePropType
  }
} satisfies Record<GameAssetKey, GameAssetDefinition>;

export function getGameAsset(key: GameAssetKey) {
  return gameAssets[key];
}
