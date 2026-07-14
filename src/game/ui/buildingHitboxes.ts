import type { VillageBuildingType } from "../types/game";

export type BuildingGeometry = {
  point: { x: number; y: number };
  size: number;
  hitbox: {
    width: number;
    height: number;
    offsetY: number;
  };
};

export type BuildingHitTarget = {
  type: VillageBuildingType;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  order: number;
};

export const MIN_BUILDING_HITBOX_PT = 48;

/** Fixed art geometry plus independently tunable touch geometry, in scene percentages. */
export const BUILDING_GEOMETRY: Record<VillageBuildingType, BuildingGeometry> = {
  clanHall: {
    point: { x: 50, y: 39 },
    size: 30,
    hitbox: { width: 28, height: 28, offsetY: -5.4 }
  },
  bananaGrove: {
    point: { x: 25, y: 22 },
    size: 17,
    hitbox: { width: 16.5, height: 22, offsetY: -3.1 }
  },
  lumberCamp: {
    point: { x: 28, y: 69 },
    size: 21,
    hitbox: { width: 24, height: 24, offsetY: -3.8 }
  },
  stoneQuarry: {
    point: { x: 79, y: 49 },
    size: 15,
    hitbox: { width: 20, height: 18, offsetY: -2.7 }
  },
  watchTower: {
    point: { x: 74, y: 22 },
    size: 20,
    hitbox: { width: 22, height: 22, offsetY: -3.6 }
  },
  workerShelter: {
    point: { x: 21, y: 49 },
    size: 22,
    hitbox: { width: 24, height: 23, offsetY: -4 }
  },
  trainingNest: {
    point: { x: 69, y: 69 },
    size: 21,
    hitbox: { width: 24, height: 23, offsetY: -3.8 }
  }
};

export function createBuildingHitTargets(
  types: VillageBuildingType[],
  sceneWidth: number,
  sceneHeight: number
): BuildingHitTarget[] {
  return types.map((type, order) => {
    const geometry = BUILDING_GEOMETRY[type];
    return {
      type,
      centerX: (geometry.point.x / 100) * sceneWidth,
      centerY: ((geometry.point.y + geometry.hitbox.offsetY) / 100) * sceneHeight,
      width: Math.max(MIN_BUILDING_HITBOX_PT, (geometry.hitbox.width / 100) * sceneWidth),
      height: Math.max(MIN_BUILDING_HITBOX_PT, (geometry.hitbox.height / 100) * sceneHeight),
      order
    };
  });
}

/** Selects only containing targets, resolving overlaps by nearest visual center. */
export function selectBuildingAtPoint(
  targets: BuildingHitTarget[],
  x: number,
  y: number
): VillageBuildingType | null {
  const candidates = targets
    .filter(
      (target) =>
        Math.abs(x - target.centerX) <= target.width / 2 &&
        Math.abs(y - target.centerY) <= target.height / 2
    )
    .map((target) => ({
      target,
      distanceSquared:
        Math.pow(x - target.centerX, 2) + Math.pow(y - target.centerY, 2)
    }))
    .sort(
      (a, b) =>
        a.distanceSquared - b.distanceSquared || a.target.order - b.target.order
    );

  return candidates[0]?.target.type ?? null;
}
