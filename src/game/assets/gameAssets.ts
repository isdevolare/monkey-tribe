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
  | "unitWorker"
  | "unitFighter"
  | "unitScout"
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
  | "uiButtonBuild"
  | "uiButtonMonkeys"
  | "uiButtonMap"
  | "uiButtonRaid"
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
  terrainGrass: asset("terrainGrass", "terrain", "terrain_grass.png", "256x256 tile"),
  terrainJungle: asset("terrainJungle", "terrain", "terrain_jungle.png", "256x256 tile"),
  terrainMud: asset("terrainMud", "terrain", "terrain_mud.png", "256x256 tile"),
  terrainRock: asset("terrainRock", "terrain", "terrain_rock.png", "256x256 tile"),
  terrainWater: asset("terrainWater", "terrain", "terrain_water.png", "256x256 tile"),
  terrainBananaTree: {
    ...asset("terrainBananaTree", "terrain", "terrain_banana_tree.png", "512x512 transparent prop"),
    source: require("../../../assets/game/terrain/terrain_banana_tree.png") as ImageSourcePropType
  },
  terrainWoodTree: {
    ...asset("terrainWoodTree", "terrain", "terrain_wood_tree.png", "512x512 transparent prop"),
    source: require("../../../assets/game/terrain/terrain_wood_tree.png") as ImageSourcePropType
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
  resourceBanana: asset(
    "resourceBanana",
    "resources",
    "resource_banana.png",
    "256x256 transparent icon"
  ),
  resourceStone: asset(
    "resourceStone",
    "resources",
    "resource_stone.png",
    "256x256 transparent icon"
  ),
  resourceWood: asset("resourceWood", "resources", "resource_wood.png", "256x256 transparent icon"),
  resourcePopulation: asset(
    "resourcePopulation",
    "resources",
    "resource_population.png",
    "256x256 transparent icon"
  ),
  uiLogo: {
    ...asset("uiLogo", "ui", "logo.png", "1024x1024 transparent or square logo"),
    source: require("../../../assets/game/ui/logo.png") as ImageSourcePropType
  },
  unitMonkeySheet: {
    ...asset("unitMonkeySheet", "units", "monkey_units_sheet.png", "1341x1173 sprite sheet"),
    source: require("../../../assets/game/units/monkey_units_sheet.png") as ImageSourcePropType
  },
  uiButtonBuild: asset("uiButtonBuild", "ui", "ui_button_build.png", "256x256 transparent icon"),
  uiButtonMonkeys: asset("uiButtonMonkeys", "ui", "ui_button_monkeys.png", "256x256 transparent icon"),
  uiButtonMap: asset("uiButtonMap", "ui", "ui_button_map.png", "256x256 transparent icon"),
  uiButtonRaid: asset("uiButtonRaid", "ui", "ui_button_raid.png", "256x256 transparent icon"),
  uiPanelDark: asset("uiPanelDark", "ui", "ui_panel_dark.png", "512x256 nine-slice style panel"),
  uiPanelLight: asset("uiPanelLight", "ui", "ui_panel_light.png", "512x256 nine-slice style panel"),
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
