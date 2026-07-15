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
  | "bananaWorkerYoung"
  | "bananaWorkerExperienced"
  | "bananaWorkerMaster"
  | "lumberWorkerApprentice"
  | "lumberWorkerSkilled"
  | "lumberWorkerMaster"
  | "stoneWorkerApprentice"
  | "stoneWorkerExperienced"
  | "stoneWorkerMaster"
  | "workerBananaDelivery"
  | "workerMasterBuilder"
  | "unitFighter"
  | "unitScout"
  | "scoutJunglePathfinder"
  | "scoutMoonlightTracker"
  | "unitChief"
  | "unitEnemyFighter"
  | "buildingPlayerCamp"
  | "buildingEnemyCamp"
  | "buildingHut"
  | "buildingTrainingNest"
  | "buildingWatchPost"
  | "buildingLumberCampReference"
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
  | "bgJungleGame"
  | "bgJungleWorldDense"
  | "bgJungleWorldCompact"
  | "bgVillageBoardDense"
  | "bgVillageReferenceLayout"
  | "buildingPlayerCampL2"
  | "buildingPlayerCampL3"
  | "buildingArcherTower"
  | "buildingWarriorBarracks"
  | "unitWarrior"
  | "unitShieldGuardian"
  | "warriorSavageRaider"
  | "warriorAncientWarChief"
  | "unitArcher"
  | "unitCrossbowman"
  | "hunterEmeraldRanger"
  | "hunterRoyalEagleArcher"
  | "unitEnemyWarrior"
  | "unitEnemyArcher"
  | "resourceBananaPile"
  | "resourceStonePile"
  | "resourceWoodBundle"
  | "resourceJungleGem"
  | "menuChiefMascot"
  | "menuTitlePlaque"
  | "menuTotem"
  | "menuTorch"
  | "propCampfire"
  | "propCrate"
  | "propBarrel"
  | "propLogPile"
  | "propBananaBasket"
  | "propRopeCoil"
  | "propFenceSegment"
  | "propTrainingDummy";

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
  bananaWorkerYoung: {
    ...asset("bananaWorkerYoung", "units", "banana_worker_young.png", "1024x1024 transparent unit"),
    source: require("../../../assets/game/units/banana_worker_young.png") as ImageSourcePropType
  },
  bananaWorkerExperienced: {
    ...asset("bananaWorkerExperienced", "units", "banana_worker_experienced.png", "1024x1024 transparent unit"),
    source: require("../../../assets/game/units/banana_worker_experienced.png") as ImageSourcePropType
  },
  bananaWorkerMaster: {
    ...asset("bananaWorkerMaster", "units", "banana_worker_master.png", "1024x1024 transparent unit"),
    source: require("../../../assets/game/units/banana_worker_master.png") as ImageSourcePropType
  },
  lumberWorkerApprentice: {
    ...asset("lumberWorkerApprentice", "units", "generated/worker_lumber_apprentice.png", "generated 1254x1254 transparent lumber worker"),
    source: require("../../../assets/game/units/generated/worker_lumber_apprentice.png") as ImageSourcePropType
  },
  lumberWorkerSkilled: {
    ...asset("lumberWorkerSkilled", "units", "generated/worker_lumber_skilled.png", "generated 1254x1254 transparent lumber worker"),
    source: require("../../../assets/game/units/generated/worker_lumber_skilled.png") as ImageSourcePropType
  },
  lumberWorkerMaster: {
    ...asset("lumberWorkerMaster", "units", "generated/worker_lumber_master.png", "generated 1254x1254 transparent lumber worker"),
    source: require("../../../assets/game/units/generated/worker_lumber_master.png") as ImageSourcePropType
  },
  stoneWorkerApprentice: {
    ...asset("stoneWorkerApprentice", "units", "generated/worker_stone_apprentice.png", "1024x1536 transparent quarry worker"),
    source: require("../../../assets/game/units/generated/worker_stone_apprentice.png") as ImageSourcePropType
  },
  stoneWorkerExperienced: {
    ...asset("stoneWorkerExperienced", "units", "generated/worker_stone_experienced.png", "1122x1402 transparent quarry worker"),
    source: require("../../../assets/game/units/generated/worker_stone_experienced.png") as ImageSourcePropType
  },
  stoneWorkerMaster: {
    ...asset("stoneWorkerMaster", "units", "generated/worker_stone_master.png", "1024x1536 transparent quarry worker"),
    source: require("../../../assets/game/units/generated/worker_stone_master.png") as ImageSourcePropType
  },
  workerBananaDelivery: {
    ...asset("workerBananaDelivery", "units", "worker_banana_delivery.png", "1024x1024 transparent cosmetic unit"),
    source: require("../../../assets/game/units/worker_banana_delivery.png") as ImageSourcePropType
  },
  workerMasterBuilder: {
    ...asset("workerMasterBuilder", "units", "worker_master_builder.png", "1024x1024 transparent cosmetic unit"),
    source: require("../../../assets/game/units/worker_master_builder.png") as ImageSourcePropType
  },
  unitFighter: {
    ...asset("unitFighter", "units", "unit_fighter.png", "512x512 transparent unit"),
    source: require("../../../assets/game/units/unit_fighter.png") as ImageSourcePropType
  },
  unitScout: {
    ...asset("unitScout", "units", "unit_scout.png", "512x512 transparent unit"),
    source: require("../../../assets/game/units/unit_scout.png") as ImageSourcePropType
  },
  scoutJunglePathfinder: {
    ...asset("scoutJunglePathfinder", "units", "scout_jungle_pathfinder.png", "1024x1024 transparent cosmetic unit"),
    source: require("../../../assets/game/units/scout_jungle_pathfinder.png") as ImageSourcePropType
  },
  scoutMoonlightTracker: {
    ...asset("scoutMoonlightTracker", "units", "scout_moonlight_tracker.png", "1024x1024 transparent cosmetic unit"),
    source: require("../../../assets/game/units/scout_moonlight_tracker.png") as ImageSourcePropType
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
  buildingLumberCampReference: {
    ...asset("buildingLumberCampReference", "buildings", "building_lumber_camp_reference.png", "generated reference-matched transparent lumber camp"),
    source: require("../../../assets/game/buildings/building_lumber_camp_reference.png") as ImageSourcePropType
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
  },
  bgJungleWorldDense: {
    ...asset("bgJungleWorldDense", "backgrounds", "bg_jungle_world_dense.png", "941x1672 generated dense portrait jungle world"),
    source: require("../../../assets/game/backgrounds/bg_jungle_world_dense.png") as ImageSourcePropType
  },
  bgJungleWorldCompact: {
    ...asset("bgJungleWorldCompact", "backgrounds", "bg_jungle_world_compact.png", "941x1672 generated compact portrait jungle frame"),
    source: require("../../../assets/game/backgrounds/bg_jungle_world_compact.png") as ImageSourcePropType
  },
  bgVillageBoardDense: {
    ...asset("bgVillageBoardDense", "backgrounds", "bg_village_board_dense.png", "1254x1254 generated dense square village clearing"),
    source: require("../../../assets/game/backgrounds/bg_village_board_dense.png") as ImageSourcePropType
  },
  bgVillageReferenceLayout: {
    ...asset("bgVillageReferenceLayout", "backgrounds", "bg_village_reference_layout.png", "941x1450 reference-matched portrait village clearing"),
    source: require("../../../assets/game/backgrounds/bg_village_reference_layout.png") as ImageSourcePropType
  },
  buildingPlayerCampL2: {
    ...asset("buildingPlayerCampL2", "buildings", "camp_player_level2.png", "generated camp lvl 2"),
    source: require("../../../assets/game/generated/camps/camp_player_level2.png") as ImageSourcePropType
  },
  buildingPlayerCampL3: {
    ...asset("buildingPlayerCampL3", "buildings", "camp_player_level3.png", "generated camp lvl 3"),
    source: require("../../../assets/game/generated/camps/camp_player_level3.png") as ImageSourcePropType
  },
  buildingArcherTower: {
    ...asset("buildingArcherTower", "buildings", "camp_archer_tower.png", "generated archer tower"),
    source: require("../../../assets/game/generated/camps/camp_archer_tower.png") as ImageSourcePropType
  },
  buildingWarriorBarracks: {
    ...asset("buildingWarriorBarracks", "buildings", "camp_warrior_barracks.png", "generated barracks"),
    source: require("../../../assets/game/generated/camps/camp_warrior_barracks.png") as ImageSourcePropType
  },
  unitWarrior: {
    ...asset("unitWarrior", "units", "unit_warrior_monkey.png", "generated warrior unit"),
    source: require("../../../assets/game/generated/units/unit_warrior_monkey.png") as ImageSourcePropType
  },
  unitShieldGuardian: {
    ...asset("unitShieldGuardian", "units", "unit_shield_guardian_monkey.png", "1536x1536 transparent heavy tank unit"),
    source: require("../../../assets/game/generated/units/unit_shield_guardian_monkey.png") as ImageSourcePropType
  },
  warriorSavageRaider: {
    ...asset("warriorSavageRaider", "units", "warrior_savage_raider.png", "1024x1024 transparent cosmetic unit"),
    source: require("../../../assets/game/units/warrior_savage_raider.png") as ImageSourcePropType
  },
  warriorAncientWarChief: {
    ...asset("warriorAncientWarChief", "units", "warrior_ancient_warchief.png", "1024x1024 transparent cosmetic unit"),
    source: require("../../../assets/game/units/warrior_ancient_warchief.png") as ImageSourcePropType
  },
  unitArcher: {
    ...asset("unitArcher", "units", "unit_archer_monkey.png", "generated archer unit"),
    source: require("../../../assets/game/generated/units/unit_archer_monkey.png") as ImageSourcePropType
  },
  unitCrossbowman: {
    ...asset("unitCrossbowman", "units", "unit_crossbowman_monkey.png", "1536x1536 transparent heavy ranged unit"),
    source: require("../../../assets/game/generated/units/unit_crossbowman_monkey.png") as ImageSourcePropType
  },
  hunterEmeraldRanger: {
    ...asset("hunterEmeraldRanger", "units", "hunter_emerald_ranger.png", "1024x1024 transparent cosmetic unit"),
    source: require("../../../assets/game/units/hunter_emerald_ranger.png") as ImageSourcePropType
  },
  hunterRoyalEagleArcher: {
    ...asset("hunterRoyalEagleArcher", "units", "hunter_royal_eagle_archer.png", "1024x1024 transparent cosmetic unit"),
    source: require("../../../assets/game/units/hunter_royal_eagle_archer.png") as ImageSourcePropType
  },
  unitEnemyWarrior: {
    ...asset("unitEnemyWarrior", "units", "unit_enemy_warrior_monkey.png", "generated enemy warrior"),
    source: require("../../../assets/game/generated/units/unit_enemy_warrior_monkey.png") as ImageSourcePropType
  },
  unitEnemyArcher: {
    ...asset("unitEnemyArcher", "units", "unit_enemy_archer_monkey.png", "generated enemy archer"),
    source: require("../../../assets/game/generated/units/unit_enemy_archer_monkey.png") as ImageSourcePropType
  },
  resourceBananaPile: {
    ...asset("resourceBananaPile", "resources", "resource_banana_pile.png", "generated banana pile"),
    source: require("../../../assets/game/generated/resources/resource_banana_pile.png") as ImageSourcePropType
  },
  resourceStonePile: {
    ...asset("resourceStonePile", "resources", "resource_stone_pile.png", "generated stone pile"),
    source: require("../../../assets/game/generated/resources/resource_stone_pile.png") as ImageSourcePropType
  },
  resourceWoodBundle: {
    ...asset("resourceWoodBundle", "resources", "resource_wood_bundle.png", "generated wood bundle"),
    source: require("../../../assets/game/generated/resources/resource_wood_bundle.png") as ImageSourcePropType
  },
  resourceJungleGem: {
    ...asset("resourceJungleGem", "resources", "resource_jungle_gem.png", "generated jungle gem"),
    source: require("../../../assets/game/generated/resources/resource_jungle_gem.png") as ImageSourcePropType
  },
  menuChiefMascot: {
    ...asset("menuChiefMascot", "ui", "menu_monkey_chief_mascot.png", "generated menu mascot"),
    source: require("../../../assets/game/generated/menu/menu_monkey_chief_mascot.png") as ImageSourcePropType
  },
  menuTitlePlaque: {
    ...asset("menuTitlePlaque", "ui", "menu_title_plaque.png", "generated title plaque"),
    source: require("../../../assets/game/generated/menu/menu_title_plaque.png") as ImageSourcePropType
  },
  menuTotem: {
    ...asset("menuTotem", "ui", "menu_jungle_totem.png", "generated jungle totem"),
    source: require("../../../assets/game/generated/menu/menu_jungle_totem.png") as ImageSourcePropType
  },
  menuTorch: {
    ...asset("menuTorch", "ui", "menu_jungle_torch.png", "generated jungle torch"),
    source: require("../../../assets/game/generated/menu/menu_jungle_torch.png") as ImageSourcePropType
  },
  propCampfire: {
    ...asset("propCampfire", "fx", "prop_campfire.png", "village prop"),
    source: require("../../../assets/game/props/prop_campfire.png") as ImageSourcePropType
  },
  propCrate: {
    ...asset("propCrate", "fx", "prop_crate.png", "village prop"),
    source: require("../../../assets/game/props/prop_crate.png") as ImageSourcePropType
  },
  propBarrel: {
    ...asset("propBarrel", "fx", "prop_barrel.png", "village prop"),
    source: require("../../../assets/game/props/prop_barrel.png") as ImageSourcePropType
  },
  propLogPile: {
    ...asset("propLogPile", "fx", "prop_log_pile.png", "village prop"),
    source: require("../../../assets/game/props/prop_log_pile.png") as ImageSourcePropType
  },
  propBananaBasket: {
    ...asset("propBananaBasket", "fx", "prop_banana_basket.png", "village prop"),
    source: require("../../../assets/game/props/prop_banana_basket.png") as ImageSourcePropType
  },
  propRopeCoil: {
    ...asset("propRopeCoil", "fx", "prop_rope_coil.png", "village prop"),
    source: require("../../../assets/game/props/prop_rope_coil.png") as ImageSourcePropType
  },
  propFenceSegment: {
    ...asset("propFenceSegment", "fx", "prop_fence_segment.png", "village prop"),
    source: require("../../../assets/game/props/prop_fence_segment.png") as ImageSourcePropType
  },
  propTrainingDummy: {
    ...asset("propTrainingDummy", "fx", "prop_training_dummy.png", "village prop"),
    source: require("../../../assets/game/props/prop_training_dummy.png") as ImageSourcePropType
  }
} satisfies Record<GameAssetKey, GameAssetDefinition>;

export function getGameAsset(key: GameAssetKey) {
  return gameAssets[key];
}
