import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  useWindowDimensions
} from "react-native";
import Svg, { Ellipse, Line, Path } from "react-native-svg";
import { AssetImage } from "./AssetImage";
import { PopIn, PulseRing } from "./Vfx";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { buildingName } from "../../game/config/buildings";
import { t } from "../../game/i18n";
import {
  createBuildingHitTargets,
  selectBuildingAtPoint
} from "../../game/ui/buildingHitboxes";
import type { BananaWorkerClass, Lang, LumberWorkerClass, StoneWorkerClass, Tile, VillageBuilding, VillageBuildingType, WorkerExpedition } from "../../game/types/game";
import { theme } from "../../theme/theme";

type VillageBoardProps = {
  tiles: Tile[];
  buildings: VillageBuilding[];
  lang: Lang;
  maxSize?: number;
  feedbackText?: string;
  feedbackOpacity?: Animated.Value;
  selectedType?: VillageBuildingType | null;
  bananaWorkers?: WorkerExpedition[];
  bananaGroveStorage?: number;
  bananaGroveCapacity?: number;
  lumberWorkers?: WorkerExpedition[];
  lumberCampStorage?: number;
  lumberCampCapacity?: number;
  stoneWorkers?: WorkerExpedition[];
  stoneQuarryStorage?: number;
  stoneQuarryCapacity?: number;
  onBuildingPress: (type: VillageBuildingType) => void;
};

type Point = {
  x: number;
  y: number;
};

type SceneItem = {
  key: string;
  center: Point;
  size: number;
  zIndex: number;
  node: ReactNode;
};

const CAMPFIRE_SLOT: Point = { x: 50, y: 58 };

const VISUAL_BUILDING_POINTS: Record<VillageBuildingType, Point> = {
  clanHall: { x: 50, y: 39 },
  watchTower: { x: 74, y: 22 },
  bananaGrove: { x: 25, y: 22 },
  lumberCamp: { x: 28, y: 69 },
  stoneQuarry: { x: 79, y: 49 },
  workerShelter: { x: 21, y: 49 },
  trainingNest: { x: 69, y: 69 }
};

// Reference-matched visual composition. The touch geometry mirrors these
// centers in buildingHitboxes.ts so art and interaction remain aligned.
const BUILDING_LAYOUT: Record<
  VillageBuildingType,
  { point: Point; size: number; asset: GameAssetKey }
> = {
  clanHall: { point: VISUAL_BUILDING_POINTS.clanHall, size: 30, asset: "buildingPlayerCamp" },
  bananaGrove: { point: VISUAL_BUILDING_POINTS.bananaGrove, size: 18, asset: "terrainBananaTree" },
  lumberCamp: { point: VISUAL_BUILDING_POINTS.lumberCamp, size: 23, asset: "buildingLumberCampReference" },
  stoneQuarry: { point: VISUAL_BUILDING_POINTS.stoneQuarry, size: 18, asset: "terrainRock" },
  watchTower: { point: VISUAL_BUILDING_POINTS.watchTower, size: 19, asset: "buildingArcherTower" },
  workerShelter: { point: VISUAL_BUILDING_POINTS.workerShelter, size: 22, asset: "buildingHut" },
  trainingNest: { point: VISUAL_BUILDING_POINTS.trainingNest, size: 23, asset: "buildingWarriorBarracks" }
};

export function VillageBoard({
  tiles: _tiles,
  buildings,
  lang,
  maxSize = 430,
  feedbackText,
  feedbackOpacity,
  selectedType,
  bananaWorkers = [],
  bananaGroveStorage = 0,
  bananaGroveCapacity = 100,
  lumberWorkers = [],
  lumberCampStorage = 0,
  lumberCampCapacity = 100,
  stoneWorkers = [],
  stoneQuarryStorage = 0,
  stoneQuarryCapacity = 100,
  onBuildingPress
}: VillageBoardProps) {
  const { width } = useWindowDimensions();
  const sceneWidth = Math.min(width - theme.spacing.sm * 2, maxSize);
  const sceneHeight = sceneWidth * (1450 / 941);
  const prevLevelsRef = useRef<Record<string, number>>({});
  const [upgradeFx, setUpgradeFx] = useState<{ key: number; point: Point; size: number } | null>(null);
  const fxSeq = useRef(0);
  useEffect(() => {
    for (const building of buildings) {
      const previous = prevLevelsRef.current[building.type];
      prevLevelsRef.current[building.type] = building.level;
      if (previous !== undefined && building.level > previous) {
        const layout = BUILDING_LAYOUT[building.type];
        fxSeq.current += 1;
        setUpgradeFx({ key: fxSeq.current, point: layout.point, size: layout.size });
      }
    }
  }, [buildings]);
  useEffect(() => {
    if (!upgradeFx) {
      return;
    }
    const timer = setTimeout(() => setUpgradeFx(null), 750);
    return () => clearTimeout(timer);
  }, [upgradeFx]);

  const decorativeItems = useMemo(
    () => settlementProps().sort((a, b) => a.zIndex - b.zIndex),
    []
  );
  const buildingSprites = buildings
    .map((building) => ({ building, layout: BUILDING_LAYOUT[building.type] }))
    .sort((a, b) => a.layout.point.y - b.layout.point.y);
  const hitTargets = useMemo(
    () =>
      createBuildingHitTargets(
        buildings.map((building) => building.type),
        sceneWidth,
        sceneHeight
      ),
    [buildings, sceneHeight, sceneWidth]
  );
  const handleBoardPress = useCallback(
    (event: GestureResponderEvent) => {
      const type = selectBuildingAtPoint(
        hitTargets,
        event.nativeEvent.locationX,
        event.nativeEvent.locationY
      );
      if (type) {
        onBuildingPress(type);
      }
    },
    [hitTargets, onBuildingPress]
  );

  return (
    <View style={[styles.scene, { width: sceneWidth, height: sceneHeight }]}>
      <SceneBackground />
      <VillageGround />
      <CampfireGlow />

      <View style={styles.decorLayer} pointerEvents="none">
        {decorativeItems.map((item) => (
          <SceneSprite item={item} key={item.key} />
        ))}
      </View>

      <DecorativeWorkers sceneWidth={sceneWidth} />

      <View style={styles.buildingLayer} pointerEvents="none">
        {buildingSprites.map(({ building, layout }) => (
          <MemoBuildingSprite
            key={building.type}
            building={building}
            layout={layout}
            lang={lang}
            selected={selectedType === building.type}
            bananaWorkers={building.type === "bananaGrove" ? bananaWorkers : []}
            bananaGroveStorage={building.type === "bananaGrove" ? bananaGroveStorage : 0}
            bananaGroveCapacity={building.type === "bananaGrove" ? bananaGroveCapacity : 100}
            lumberWorkers={building.type === "lumberCamp" ? lumberWorkers : []}
            lumberCampStorage={building.type === "lumberCamp" ? lumberCampStorage : 0}
            lumberCampCapacity={building.type === "lumberCamp" ? lumberCampCapacity : 100}
            stoneWorkers={building.type === "stoneQuarry" ? stoneWorkers : []}
            stoneQuarryStorage={building.type === "stoneQuarry" ? stoneQuarryStorage : 0}
            stoneQuarryCapacity={building.type === "stoneQuarry" ? stoneQuarryCapacity : 100}
            onAccessibilityPress={() => onBuildingPress(building.type)}
          />
        ))}
      </View>

      <CampfireLife />

      <Pressable
        accessible={false}
        onPress={handleBoardPress}
        style={styles.hitLayer}
      />

      {upgradeFx ? (
        <View
          key={upgradeFx.key}
          pointerEvents="none"
          style={[
            styles.upgradeFxAnchor,
            {
              left: `${upgradeFx.point.x - upgradeFx.size * 0.75}%`,
              top: `${upgradeFx.point.y - upgradeFx.size}%`,
              width: `${upgradeFx.size * 1.5}%`,
              height: `${upgradeFx.size * 1.5}%`
            }
          ]}
        >
          <PulseRing size={Math.round((sceneWidth * upgradeFx.size * 1.5) / 100)} />
        </View>
      ) : null}

      <Fireflies />
      <AmbientLife sceneWidth={sceneWidth} />

      {feedbackText ? (
        <Animated.View style={[styles.feedbackBanner, feedbackOpacity ? { opacity: feedbackOpacity } : null]} pointerEvents="none">
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function CampfireGlow() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1150,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.5] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.12] });

  return (
    <View style={styles.campGlowWrap} pointerEvents="none">
      <Animated.View style={[styles.campGlowOuter, { opacity, transform: [{ scale }] }]} />
      <Animated.View style={[styles.campGlowInner, { opacity, transform: [{ scale }] }]} />
    </View>
  );
}

const CampfireLife = memo(function CampfireLife() {
  const flicker = useRef(new Animated.Value(0)).current;
  const smoke = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 610, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    const smokeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(smoke, { toValue: 1, duration: 2700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(smoke, { toValue: 0, duration: 1, useNativeDriver: true })
      ])
    );
    flameLoop.start();
    smokeLoop.start();
    return () => {
      flameLoop.stop();
      smokeLoop.stop();
    };
  }, [flicker, smoke]);

  const flameScale = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.13] });
  const flameShift = flicker.interpolate({ inputRange: [0, 1], outputRange: [1, -1] });
  const smokeY = smoke.interpolate({ inputRange: [0, 1], outputRange: [0, -24] });
  const smokeX = smoke.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 4, 1] });
  const smokeOpacity = smoke.interpolate({ inputRange: [0, 0.15, 0.72, 1], outputRange: [0, 0.24, 0.12, 0] });

  return (
    <View pointerEvents="none" style={styles.campfireLife}>
      <Animated.View style={[styles.campfireLight, { opacity: flicker.interpolate({ inputRange: [0, 1], outputRange: [0.26, 0.48] }) }]} />
      <Animated.View style={[styles.campfireFlameArt, { transform: [{ translateY: flameShift }, { scaleY: flameScale }] }]}>
        <Svg width="100%" height="100%" viewBox="0 0 24 32">
          <Path d="M12 30 C4 26 4 19 9 14 C12 11 11 7 13 2 C21 10 22 19 18 25 C16 28 14 30 12 30 Z" fill="#ef7420" />
          <Path d="M12 27 C8 24 9 20 12 17 C14 15 14 12 15 10 C18 17 17 23 12 27 Z" fill="#ffd75b" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.campfireSmoke, { opacity: smokeOpacity, transform: [{ translateX: smokeX }, { translateY: smokeY }, { scale: smoke.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.45] }) }] }]} />
      <Animated.View style={[styles.campfireSmoke, styles.campfireSmokeSecond, { opacity: smokeOpacity, transform: [{ translateX: Animated.multiply(smokeX, -0.7) }, { translateY: Animated.multiply(smokeY, 0.78) }] }]} />
    </View>
  );
});

type AmbientKind = "butterfly" | "bird" | "leaf" | "dust";
type AmbientSpec = {
  kind: AmbientKind;
  left: number;
  top: number;
  dx: number;
  dy: number;
  duration: number;
  delay: number;
  seed: number;
};

const AMBIENT_SPECS: AmbientSpec[] = [
  { kind: "butterfly", left: 18, top: 31, dx: 17, dy: 5, duration: 7200, delay: 700, seed: 1 },
  { kind: "butterfly", left: 74, top: 54, dx: -14, dy: -7, duration: 8300, delay: 3100, seed: 2 },
  { kind: "bird", left: -8, top: 17, dx: 116, dy: -3, duration: 11500, delay: 9000, seed: 3 },
  { kind: "leaf", left: 13, top: 14, dx: 26, dy: 37, duration: 10400, delay: 1800, seed: 4 },
  { kind: "leaf", left: 82, top: 25, dx: -22, dy: 32, duration: 12100, delay: 5200, seed: 5 },
  { kind: "dust", left: 39, top: 63, dx: 7, dy: -9, duration: 5400, delay: 300, seed: 6 },
  { kind: "dust", left: 55, top: 46, dx: -5, dy: -8, duration: 6100, delay: 2100, seed: 7 },
  { kind: "dust", left: 63, top: 68, dx: 6, dy: -10, duration: 5800, delay: 3900, seed: 8 }
];

const AmbientLife = memo(function AmbientLife({ sceneWidth }: { sceneWidth: number }) {
  return (
    <View pointerEvents="none" style={styles.ambientLifeLayer}>
      {AMBIENT_SPECS.map((spec) => <AmbientDrifter key={`${spec.kind}-${spec.seed}`} spec={spec} sceneWidth={sceneWidth} />)}
    </View>
  );
});

const AmbientDrifter = memo(function AmbientDrifter({ spec, sceneWidth }: { spec: AmbientSpec; sceneWidth: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(progress, { toValue: 1, duration: spec.duration, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: 1, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, spec.delay, spec.duration]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, sceneWidth * spec.dx / 100] });
  const translateY = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, sceneWidth * (spec.dy - 2) / 200, sceneWidth * spec.dy / 100] });
  const opacity = progress.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 0.72, 0.62, 0] });
  const rotate = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [`${-18 + spec.seed * 3}deg`, `${16 - spec.seed}deg`, `${58 + spec.seed * 2}deg`] });
  return (
    <Animated.View style={[styles.ambientDrifter, { left: `${spec.left}%`, top: `${spec.top}%`, opacity, transform: [{ translateX }, { translateY }, { rotate }] }]}>
      {spec.kind === "butterfly" ? <Butterfly /> : null}
      {spec.kind === "bird" ? <BirdSilhouette /> : null}
      {spec.kind === "leaf" ? <View style={[styles.floatingLeaf, spec.seed % 2 === 0 ? styles.floatingLeafGold : null]} /> : null}
      {spec.kind === "dust" ? <View style={styles.dustMote} /> : null}
    </Animated.View>
  );
});

function Butterfly() {
  return <View style={styles.butterfly}><View style={[styles.butterflyWing, styles.butterflyWingLeft]} /><View style={[styles.butterflyWing, styles.butterflyWingRight]} /><View style={styles.butterflyBody} /></View>;
}

function BirdSilhouette() {
  return <Svg width="30" height="12" viewBox="0 0 30 12"><Path d="M1 9 C7 2 11 3 15 8 C19 3 23 2 29 9 C22 6 19 7 15 11 C11 7 8 6 1 9 Z" fill="rgba(18,27,18,0.72)" /></Svg>;
}

type WorkerRoute = { asset: GameAssetKey; cargo?: GameAssetKey; left: number; top: number; dx: number; dy: number; duration: number; delay: number };
const DECORATIVE_WORKER_ROUTES: WorkerRoute[] = [
  { asset: "bananaWorkerYoung", cargo: "resourceBanana", left: 30, top: 35, dx: 10, dy: 7, duration: 7900, delay: 300 },
  { asset: "lumberWorkerApprentice", cargo: "resourceWood", left: 23, top: 52, dx: 13, dy: -4, duration: 9200, delay: 1900 },
  { asset: "stoneWorkerApprentice", cargo: "resourceStone", left: 68, top: 52, dx: -11, dy: -5, duration: 8700, delay: 3700 },
  { asset: "unitWorker", left: 32, top: 69, dx: 4, dy: -1, duration: 10800, delay: 6000 }
];

const DecorativeWorkers = memo(function DecorativeWorkers({ sceneWidth }: { sceneWidth: number }) {
  return <View pointerEvents="none" style={styles.decorativeWorkers}>{DECORATIVE_WORKER_ROUTES.map((route) => <DecorativeWorker key={route.asset} route={route} sceneWidth={sceneWidth} />)}</View>;
});

const DecorativeWorker = memo(function DecorativeWorker({ route, sceneWidth }: { route: WorkerRoute; sceneWidth: number }) {
  const travel = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(route.delay),
      Animated.timing(travel, { toValue: 1, duration: route.duration, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(travel, { toValue: 0, duration: route.duration, easing: Easing.inOut(Easing.linear), useNativeDriver: true })
    ]));
    loop.start();
    return () => loop.stop();
  }, [route.delay, route.duration, travel]);
  const bob = travel.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -2, 0, -2, 0] });
  return (
    <Animated.View style={[styles.decorativeWorker, { left: `${route.left}%`, top: `${route.top}%`, width: sceneWidth * 0.075, height: sceneWidth * 0.075, transform: [
      { translateX: travel.interpolate({ inputRange: [0, 1], outputRange: [0, sceneWidth * route.dx / 100] }) },
      { translateY: Animated.add(bob, travel.interpolate({ inputRange: [0, 1], outputRange: [0, sceneWidth * route.dy / 100] })) }
    ] }]}>
      <AssetImage assetKey={route.asset} style={styles.full} fallback={<Text style={styles.decorativeWorkerFallback}>🐒</Text>} hideFallbackOnLoad />
      {route.cargo ? <View style={styles.workerCargo}><AssetImage assetKey={route.cargo} style={styles.full} fallback={<View />} /></View> : null}
    </Animated.View>
  );
});

const FIREFLY_SPOTS: Array<Point & { seed: number }> = [
  { x: 15, y: 35, seed: 1 },
  { x: 79, y: 36, seed: 2 },
  { x: 19, y: 69, seed: 3 },
  { x: 81, y: 66, seed: 4 }
];

function Fireflies() {
  return (
    <View style={styles.ambientLayer} pointerEvents="none">
      {FIREFLY_SPOTS.map((spot) => (
        <Firefly key={spot.seed} x={spot.x} y={spot.y} seed={spot.seed} />
      ))}
    </View>
  );
}

function Firefly({ x, y, seed }: { x: number; y: number; seed: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 2400 + (seed % 5) * 520;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t, seed]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -16 - (seed % 3) * 6] });
  const translateX = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 7 + (seed % 4) * 2, 0] });
  const opacity = t.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: [0.12, 0.9, 0.35, 0.85, 0.12]
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.firefly,
        { left: `${x}%`, top: `${y}%`, opacity, transform: [{ translateX }, { translateY }] }
      ]}
    />
  );
}

// The tick clones building objects every 150ms; compare by content so the
// sprites only re-render on real changes.
const MemoBuildingSprite = memo(
  BuildingSprite,
  (a, b) =>
    a.building.type === b.building.type &&
    a.building.level === b.building.level &&
    a.selected === b.selected &&
    a.bananaGroveStorage === b.bananaGroveStorage &&
    a.bananaGroveCapacity === b.bananaGroveCapacity &&
    a.bananaWorkers === b.bananaWorkers &&
    a.lumberCampStorage === b.lumberCampStorage &&
    a.lumberCampCapacity === b.lumberCampCapacity &&
    a.lumberWorkers === b.lumberWorkers &&
    a.stoneQuarryStorage === b.stoneQuarryStorage &&
    a.stoneQuarryCapacity === b.stoneQuarryCapacity &&
    a.stoneWorkers === b.stoneWorkers &&
    a.lang === b.lang
);

// Upgrade tiers add function-themed props without changing the sprite size.
// Offsets/sizes are in
// percent of the building's sprite box.
type TierProp = {
  minLevel: number;
  asset: GameAssetKey;
  left: number;
  top: number;
  size: number;
};

const TIER_PROPS: Record<VillageBuildingType, TierProp[]> = {
  clanHall: [],
  bananaGrove: [
    { minLevel: 1, asset: "propBananaBasket", left: 62, top: 64, size: 40 },
    { minLevel: 1, asset: "resourceBananaPile", left: -9, top: 69, size: 34 },
    { minLevel: 4, asset: "propBananaBasket", left: -8, top: 72, size: 30 }
  ],
  lumberCamp: [
    { minLevel: 1, asset: "propLogPile", left: 58, top: 66, size: 46 },
    { minLevel: 1, asset: "resourceWoodBundle", left: -10, top: 70, size: 34 },
    { minLevel: 4, asset: "propBarrel", left: -6, top: 70, size: 32 }
  ],
  stoneQuarry: [
    { minLevel: 1, asset: "resourceStonePile", left: 60, top: 62, size: 44 },
    { minLevel: 1, asset: "propCrate", left: -10, top: 70, size: 34 },
    { minLevel: 4, asset: "propCrate", left: -10, top: 66, size: 36 }
  ],
  watchTower: [
    { minLevel: 2, asset: "propRopeCoil", left: 64, top: 76, size: 30 },
    { minLevel: 4, asset: "propCrate", left: -4, top: 78, size: 28 }
  ],
  workerShelter: [
    { minLevel: 2, asset: "propCrate", left: 66, top: 64, size: 34 },
    { minLevel: 4, asset: "propBananaBasket", left: -8, top: 68, size: 30 }
  ],
  trainingNest: [
    { minLevel: 2, asset: "propTrainingDummy", left: 68, top: 56, size: 40 },
    { minLevel: 4, asset: "propRopeCoil", left: -6, top: 72, size: 28 }
  ]
};

const PENNANT_LEVEL = 4;
const GLOW_LEVEL = 6;

// Small clan pennant planted once a building reaches tier 3.
function Pennant() {
  const wave = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(wave, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(wave, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
    ]));
    loop.start();
    return () => loop.stop();
  }, [wave]);
  return (
    <View style={styles.pennant} pointerEvents="none">
      <Animated.View style={[styles.full, { transform: [{ rotate: wave.interpolate({ inputRange: [0, 1], outputRange: ["-1.5deg", "1.5deg"] }) }, { scaleX: wave.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }] }]}>
        <Svg width="100%" height="100%" viewBox="0 0 20 34">
          <Line x1="4" y1="2" x2="4" y2="32" stroke="#6a4121" strokeWidth="2.6" />
          <Path d="M5 3 L18 7.5 L5 12 Z" fill="#4f8f3a" stroke="#2e5220" strokeWidth="1" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const BuildingIdleDetails = memo(function BuildingIdleDetails({ type }: { type: VillageBuildingType }) {
  const idle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(idle, { toValue: 1, duration: 2600 + type.length * 90, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(idle, { toValue: 0, duration: 3100 + type.length * 70, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
    ]));
    loop.start();
    return () => loop.stop();
  }, [idle, type]);

  const sway = idle.interpolate({ inputRange: [0, 1], outputRange: ["-2deg", "2deg"] });
  const flicker = idle.interpolate({ inputRange: [0, 1], outputRange: [0.52, 0.88] });

  if (type === "clanHall") {
    return <>
      <WavingFlag idle={idle} style={styles.clanFlagLeft} color="#2268ad" />
      <WavingFlag idle={idle} style={styles.clanFlagRight} color="#2268ad" mirrored />
    </>;
  }
  if (type === "workerShelter") {
    return <Animated.View style={[styles.lodgeLantern, { opacity: flicker, transform: [{ rotate: sway }] }]}><View style={styles.lanternGlow} /></Animated.View>;
  }
  if (type === "trainingNest") {
    return <>
      <Animated.View style={[styles.trainingTargetIdle, { transform: [{ rotate: sway }] }]}><AssetImage assetKey="propTrainingDummy" style={styles.full} fallback={<View />} /></Animated.View>
      <WavingFlag idle={idle} style={styles.trainingFlag} color="#a93b25" />
    </>;
  }
  if (type === "watchTower") {
    return <Animated.View style={[styles.lookoutIdle, { transform: [{ translateX: idle.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] }) }, { rotate: sway }] }]}><AssetImage assetKey="unitWorker" style={styles.full} fallback={<View />} /></Animated.View>;
  }
  if (type === "bananaGrove") {
    return <Animated.View style={[styles.resourceIdleIcon, { opacity: flicker, transform: [{ rotate: sway }] }]}><AssetImage assetKey="resourceBanana" style={styles.full} fallback={<View />} /></Animated.View>;
  }
  if (type === "lumberCamp") {
    return <Animated.View style={[styles.resourceIdleIcon, { opacity: flicker, transform: [{ rotate: sway }] }]}><AssetImage assetKey="resourceWood" style={styles.full} fallback={<View />} /></Animated.View>;
  }
  return <Animated.View style={[styles.quarryDust, { opacity: idle.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.08, 0.34, 0.08] }), transform: [{ translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [1, -5] }) }, { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) }] }]} />;
});

function WavingFlag({ idle, style, color, mirrored = false }: { idle: Animated.Value; style: object; color: string; mirrored?: boolean }) {
  return <Animated.View style={[styles.idleFlag, style, { transform: [{ rotate: idle.interpolate({ inputRange: [0, 1], outputRange: [mirrored ? "2deg" : "-2deg", mirrored ? "-2deg" : "2deg"] }) }, { scaleX: idle.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.04] }) }] }]}>
    <Svg width="100%" height="100%" viewBox="0 0 20 34">
      <Line x1="4" y1="2" x2="4" y2="32" stroke="#6b421e" strokeWidth="2.2" />
      <Path d="M5 4 C9 3 13 5 18 5 L16 13 C12 12 9 11 5 13 Z" fill={color} stroke="rgba(255,221,120,0.55)" strokeWidth="0.8" />
    </Svg>
  </Animated.View>;
}

function BuildingSprite({
  building,
  layout,
  lang,
  selected,
  onAccessibilityPress,
  bananaWorkers,
  bananaGroveStorage,
  bananaGroveCapacity,
  lumberWorkers,
  lumberCampStorage,
  lumberCampCapacity,
  stoneWorkers,
  stoneQuarryStorage,
  stoneQuarryCapacity
}: {
  building: VillageBuilding;
  layout: { point: Point; size: number; asset: GameAssetKey };
  lang: Lang;
  selected: boolean;
  onAccessibilityPress: () => void;
  bananaWorkers: WorkerExpedition[];
  bananaGroveStorage: number;
  bananaGroveCapacity: number;
  lumberWorkers: WorkerExpedition[];
  lumberCampStorage: number;
  lumberCampCapacity: number;
  stoneWorkers: WorkerExpedition[];
  stoneQuarryStorage: number;
  stoneQuarryCapacity: number;
}) {
  const { point, asset } = layout;
  const size = layout.size;
  const art = assetForBuilding(building, asset);
  const props = TIER_PROPS[building.type].filter((prop) => building.level >= prop.minLevel);
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${buildingName(building.type, lang)}, ${t("common.levelBadge", lang, { n: building.level })}`}
      onAccessibilityTap={onAccessibilityPress}
      style={[
        styles.buildingSprite,
        {
          left: `${point.x - size / 2}%`,
          top: `${point.y - size * 0.68}%`,
          width: `${size}%`,
          height: `${size}%`,
          zIndex: Math.round(point.y)
        }
      ]}
    >
      <View style={styles.groundShadowSoft} pointerEvents="none" />
      <View style={styles.groundShadow} pointerEvents="none" />
      {building.level >= GLOW_LEVEL ? (
        <View style={styles.prestigeGlow} pointerEvents="none" />
      ) : null}
      {selected ? <View style={styles.buildingSelected} pointerEvents="none" /> : null}
      <AssetImage assetKey={art} style={styles.full} fallback={<View style={styles.assetMissing} />} />
      <BuildingIdleDetails type={building.type} />
      {building.type === "bananaGrove" ? (
        <BananaGroveActivity
          workers={bananaWorkers}
          storage={bananaGroveStorage}
          capacity={bananaGroveCapacity}
        />
      ) : null}
      {building.type === "lumberCamp" ? (
        <ResourceWorkplaceActivity kind="lumber" workers={lumberWorkers} storage={lumberCampStorage} capacity={lumberCampCapacity} />
      ) : null}
      {building.type === "stoneQuarry" ? (
        <ResourceWorkplaceActivity kind="stone" workers={stoneWorkers} storage={stoneQuarryStorage} capacity={stoneQuarryCapacity} />
      ) : null}
      {props.map((prop) => (
        <View
          key={`${prop.asset}-${prop.minLevel}`}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: `${prop.left}%`,
            top: `${prop.top}%`,
            width: `${prop.size}%`,
            height: `${prop.size}%`
          }}
        >
          <PopIn style={styles.full}>
            <AssetImage assetKey={prop.asset} style={styles.full} fallback={<View />} />
          </PopIn>
        </View>
      ))}
      {building.level >= PENNANT_LEVEL ? <Pennant /> : null}

      <View style={styles.nameTagWrap} pointerEvents="none">
        <View style={styles.nameTag}>
          <Text
            style={[styles.nameTagText, selected ? styles.nameTagTextSelected : null]}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={theme.maxFontScale}
          >
            {buildingName(building.type, lang)}
          </Text>
        </View>
      </View>

      <View style={styles.levelBadgeWrap} pointerEvents="none">
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("common.levelBadge", lang, { n: building.level })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const BANANA_WORKER_ASSET: Record<BananaWorkerClass, GameAssetKey> = {
  gatherer: "bananaWorkerYoung",
  skilled: "bananaWorkerExperienced",
  master: "bananaWorkerMaster"
};

function BananaGroveActivity({ workers, storage, capacity }: { workers: WorkerExpedition[]; storage: number; capacity: number }) {
  const spots = [
    { left: -5, top: 54 },
    { left: 61, top: 55 },
    { left: 29, top: 69 }
  ];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {workers.slice(0, 3).map((worker, index) => (
        <View
          key={worker.id}
          style={[styles.groveWorker, { left: `${spots[index]?.left ?? 0}%`, top: `${spots[index]?.top ?? 55}%` }]}
        >
          <AssetImage assetKey={BANANA_WORKER_ASSET[worker.workerClass as BananaWorkerClass]} style={styles.full} fallback={<Text>🐵</Text>} hideFallbackOnLoad />
        </View>
      ))}
      {storage > 0 ? (
        <View style={[styles.harvestBadge, storage >= capacity && styles.harvestBadgeFull]}>
          <AssetImage assetKey="resourceBanana" style={styles.harvestIcon} fallback={<Text>🍌</Text>} />
          <Text style={styles.harvestAmount}>{Math.floor(storage)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const LUMBER_WORKER_ASSET: Record<LumberWorkerClass, GameAssetKey> = {
  worker_lumber_apprentice: "lumberWorkerApprentice",
  worker_lumber_skilled: "lumberWorkerSkilled",
  worker_lumber_master: "lumberWorkerMaster"
};

const STONE_WORKER_ASSET: Record<StoneWorkerClass, GameAssetKey> = {
  worker_stone_apprentice: "stoneWorkerApprentice",
  worker_stone_experienced: "stoneWorkerExperienced",
  worker_stone_master: "stoneWorkerMaster"
};

function ResourceWorkplaceActivity({ kind, workers, storage, capacity }: { kind: "lumber" | "stone"; workers: WorkerExpedition[]; storage: number; capacity: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const worker = workers[0];
  const ready = worker?.storedReward !== undefined;
  useEffect(() => {
    if (!ready && storage <= 0) { pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, ready, storage]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {worker ? <View style={styles.lumberWorker}><AssetImage assetKey={kind === "lumber" ? LUMBER_WORKER_ASSET[worker.workerClass as LumberWorkerClass] : STONE_WORKER_ASSET[worker.workerClass as StoneWorkerClass]} style={styles.full} fallback={<Text>🐵</Text>} hideFallbackOnLoad /></View> : null}
    {ready || storage > 0 ? <Animated.View style={[styles.harvestBadge, styles.woodBadge, storage >= capacity && styles.harvestBadgeFull, { transform: [{ scale }] }]}><AssetImage assetKey={kind === "lumber" ? "resourceWood" : "resourceStone"} style={styles.harvestIcon} fallback={<Text>{kind === "lumber" ? "🪵" : "🪨"}</Text>} />{storage > 0 ? <Text style={styles.harvestAmount}>{Math.floor(storage)}</Text> : null}</Animated.View> : null}
  </View>;
}

function SceneBackground() {
  return (
    <>
      <AssetImage
        assetKey="bgVillageReferenceLayout"
        resizeMode="cover"
        style={styles.background}
        fallback={<View style={styles.backgroundFallback} />}
      />
      <View style={styles.depthShade} />
    </>
  );
}

function VillageGround() {
  return (
    <View style={styles.groundLayer} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 106">
        <Ellipse cx="50" cy="45" rx="31" ry="30" fill="rgba(255, 214, 112, 0.055)" />
        <Ellipse cx="50" cy="45" rx="18" ry="18" fill="rgba(255, 232, 156, 0.04)" />
      </Svg>
    </View>
  );
}

function prop(key: string, center: Point, size: number, asset: GameAssetKey): SceneItem {
  return item(key, center, size, Math.round(center.y * 10), (
    <AssetImage assetKey={asset} style={styles.full} fallback={<View style={styles.assetMissing} />} />
  ));
}

function settlementProps(): SceneItem[] {
  return [
    // A few purposeful props keep the compact village lived-in without noise.
    prop("prop-campfire", CAMPFIRE_SLOT, 12, "propCampfire"),
    prop("prop-log", { x: 18, y: 71 }, 10, "propLogPile"),
    prop("prop-dummy", { x: 79, y: 68 }, 9, "propTrainingDummy"),
    prop("prop-basket", { x: 34, y: 27 }, 7, "propBananaBasket")
  ];
}

function item(key: string, center: Point, size: number, zIndex: number, node: ReactNode): SceneItem {
  return { key, center, size, zIndex, node };
}

function SceneSprite({ item }: { item: SceneItem }) {
  return (
    <View
      style={[
        styles.sprite,
        {
          left: `${item.center.x - item.size / 2}%`,
          top: `${item.center.y - item.size * 0.68}%`,
          width: `${item.size}%`,
          height: `${item.size}%`,
          zIndex: item.zIndex
        }
      ]}
    >
      {item.node}
    </View>
  );
}

// Newer generated art for some buildings; the Clan Hall changes with level.
function assetForBuilding(building: VillageBuilding, fallback: GameAssetKey): GameAssetKey {
  if (building.type === "clanHall") {
    if (building.level >= 3) {
      return "buildingPlayerCampL3";
    }
    if (building.level >= 2) {
      return "buildingPlayerCampL2";
    }
    return "buildingPlayerCamp";
  }
  return fallback;
}

const styles = StyleSheet.create({
  scene: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#18331f",
    shadowColor: "#07150b",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  background: {
    ...StyleSheet.absoluteFillObject
  },
  backgroundFallback: {
    flex: 1,
    backgroundColor: "#24442b"
  },
  depthShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 25, 14, 0.035)"
  },
  groundLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.98
  },
  decorLayer: {
    ...StyleSheet.absoluteFillObject
  },
  campGlowWrap: {
    position: "absolute",
    left: "37%",
    top: "50%",
    width: "26%",
    height: "18%"
  },
  campGlowOuter: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: "rgba(255, 150, 48, 0.30)"
  },
  campGlowInner: {
    position: "absolute",
    top: "22%",
    left: "22%",
    right: "22%",
    bottom: "22%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 198, 96, 0.55)"
  },
  campfireLife: {
    position: "absolute",
    left: "47.5%",
    top: "54.7%",
    width: "5%",
    height: "6%",
    zIndex: 250,
    alignItems: "center",
    justifyContent: "center"
  },
  campfireLight: {
    position: "absolute",
    width: "170%",
    height: "82%",
    top: "42%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 143, 39, 0.42)",
    shadowColor: "#ff9b35",
    shadowOpacity: 0.68,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 }
  },
  campfireFlameArt: {
    position: "absolute",
    bottom: "16%",
    width: "48%",
    height: "58%",
    shadowColor: "#ff9a32",
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 }
  },
  campfireSmoke: {
    position: "absolute",
    top: "17%",
    left: "46%",
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#d6d2bd"
  },
  campfireSmokeSecond: { top: "25%", left: "33%", width: 3, height: 3 },
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 400
  },
  ambientLifeLayer: { ...StyleSheet.absoluteFillObject, zIndex: 410 },
  ambientDrifter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  butterfly: { width: 14, height: 10, alignItems: "center", justifyContent: "center" },
  butterflyWing: { position: "absolute", width: 7, height: 8, borderRadius: 7, backgroundColor: "rgba(248, 197, 64, 0.9)" },
  butterflyWingLeft: { left: 0, transform: [{ rotate: "-24deg" }] },
  butterflyWingRight: { right: 0, transform: [{ rotate: "24deg" }] },
  butterflyBody: { width: 2, height: 8, borderRadius: 2, backgroundColor: "#4b311c" },
  floatingLeaf: { width: 8, height: 13, borderTopLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: "rgba(92, 151, 52, 0.82)" },
  floatingLeafGold: { backgroundColor: "rgba(188, 145, 44, 0.76)" },
  dustMote: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(233, 204, 139, 0.42)" },
  decorativeWorkers: { ...StyleSheet.absoluteFillObject, zIndex: 190 },
  decorativeWorker: { position: "absolute" },
  decorativeWorkerFallback: { fontSize: 18 },
  workerCargo: { position: "absolute", right: "-8%", bottom: "4%", width: "34%", height: "34%" },
  firefly: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#f6ffbe",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 220, 0.9)",
    shadowColor: "#d6ff6a",
    shadowOpacity: 1,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 }
  },
  hitLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300
  },
  buildingLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200
  },
  upgradeFxAnchor: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200
  },
  buildingSprite: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-end"
  },
  idleFlag: { position: "absolute", width: "17%", height: "33%", zIndex: 7 },
  clanFlagLeft: { left: "11%", top: "18%" },
  clanFlagRight: { right: "11%", top: "18%" },
  lodgeLantern: { position: "absolute", right: "22%", top: "49%", width: "6%", height: "12%", transformOrigin: "top" },
  lanternGlow: { flex: 1, borderRadius: 999, backgroundColor: "#f4a52c", shadowColor: "#ffb43f", shadowOpacity: 0.95, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
  trainingTargetIdle: { position: "absolute", right: "-8%", top: "45%", width: "34%", height: "34%" },
  trainingFlag: { right: "8%", top: "19%" },
  lookoutIdle: { position: "absolute", left: "39%", top: "5%", width: "23%", height: "23%" },
  resourceIdleIcon: { position: "absolute", right: "5%", top: "48%", width: "16%", height: "16%", zIndex: 7 },
  quarryDust: { position: "absolute", right: "12%", top: "45%", width: "24%", height: "18%", borderRadius: 999, backgroundColor: "rgba(211,203,176,0.48)" },
  groveWorker: {
    position: "absolute",
    width: "43%",
    height: "43%",
    zIndex: 5
  },
  lumberWorker: { position: "absolute", width: "52%", height: "52%", left: "24%", top: "51%", zIndex: 5 },
  harvestBadge: {
    position: "absolute",
    top: "-28%",
    left: "18%",
    minWidth: "64%",
    height: "36%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#fff0a4",
    backgroundColor: "#4f9d3b",
    shadowColor: "#b9ff68",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 9
  },
  harvestBadgeFull: { backgroundColor: "#b4781f", borderColor: "#ffe27a" },
  woodBadge: { backgroundColor: "#9a5d2b", borderColor: "#ffe0a0" },
  harvestIcon: { width: "44%", height: "80%" },
  harvestAmount: { color: "white", fontSize: 8, fontWeight: "900" },
  // Soft contact shadow so buildings sit in the ground instead of floating.
  // The building's foot lands ~68% down its container (see top offset), so
  // the shadow straddles that line, not the container bottom.
  groundShadowSoft: {
    position: "absolute",
    left: "6%",
    right: "6%",
    top: "60%",
    height: "22%",
    borderRadius: 999,
    backgroundColor: "rgba(14, 22, 9, 0.16)"
  },
  groundShadow: {
    position: "absolute",
    left: "15%",
    right: "15%",
    top: "63%",
    height: "15%",
    borderRadius: 999,
    backgroundColor: "rgba(14, 22, 9, 0.3)"
  },
  prestigeGlow: {
    position: "absolute",
    left: "8%",
    right: "8%",
    top: "22%",
    bottom: "-2%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 214, 110, 0.16)",
    shadowColor: "#ffd66e",
    shadowOpacity: 0.75,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 }
  },
  pennant: {
    position: "absolute",
    top: "-14%",
    right: "2%",
    width: "26%",
    height: "44%"
  },
  buildingSelected: {
    position: "absolute",
    left: "-2%",
    right: "-2%",
    bottom: "-2%",
    height: "38%",
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#b9ff79",
    backgroundColor: "rgba(49, 198, 67, 0.24)",
    shadowColor: "#9dff62",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }
  },
  // Wider than the sprite so long names don't get squeezed into ellipsis.
  nameTagWrap: {
    position: "absolute",
    bottom: "-24%",
    left: "-70%",
    right: "-70%",
    alignItems: "center"
  },
  nameTag: {
    width: "78%",
    paddingHorizontal: 5,
    paddingVertical: 1,
    shadowColor: "#000",
    shadowOpacity: 0.9,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }
  },
  nameTagText: {
    color: "#fff4d6",
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
    fontFamily: theme.fonts.heavy
  },
  nameTagTextSelected: { color: "#ffe07d" },
  levelBadgeWrap: {
    position: "absolute",
    bottom: "-5%",
    left: 0,
    right: 0,
    alignItems: "center"
  },
  levelBadge: {
    minWidth: 35,
    height: 18,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#f3d27a",
    backgroundColor: "#6b3f16",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }
  },
  levelBadgeText: {
    color: "#fff4d6",
    fontSize: 9.5,
    lineHeight: 12,
    fontFamily: theme.fonts.heavy
  },
  sprite: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  hitZone: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  full: {
    width: "100%",
    height: "100%"
  },
  artWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  unbuiltAsset: {
    opacity: 0.46
  },
  assetMissing: {
    flex: 1
  },
  resourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 224, 91, 0.72)",
    shadowColor: "#85ff70",
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 }
  },
  selectedTileRing: {
    position: "absolute",
    width: 27,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(150, 255, 105, 0.95)",
    backgroundColor: "rgba(49, 198, 67, 0.18)"
  },
  feedbackBanner: {
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: "5%",
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 226, 139, 0.62)",
    backgroundColor: "rgba(44, 31, 15, 0.84)",
    paddingHorizontal: 12,
    zIndex: 500
  },
  feedbackText: {
    color: "#ffe28b",
    fontSize: 12,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
});
