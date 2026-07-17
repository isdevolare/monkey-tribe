import { memo, useCallback, useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { buildingName } from "../../game/config/buildings";
import { t } from "../../game/i18n";
import type { Lang, VillageBuildingType } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";

export const VILLAGE_SHORTCUT_DOCK_HEIGHT = 68;

type ShortcutDefinition = {
  type: VillageBuildingType;
  asset: GameAssetKey;
  labelKey: string;
};

const SHORTCUTS: ShortcutDefinition[] = [
  { type: "clanHall", asset: "buildingPlayerCamp", labelKey: "shortcut.clan" },
  { type: "workerShelter", asset: "buildingHut", labelKey: "shortcut.workers" },
  { type: "bananaGrove", asset: "terrainBananaTree", labelKey: "shortcut.banana" },
  { type: "lumberCamp", asset: "buildingLumberCampReference", labelKey: "shortcut.wood" },
  { type: "stoneQuarry", asset: "terrainRock", labelKey: "shortcut.stone" },
  { type: "trainingNest", asset: "buildingWarriorBarracks", labelKey: "shortcut.training" },
  { type: "watchTower", asset: "buildingArcherTower", labelKey: "shortcut.tower" },
  { type: "royalPalace", asset: "royalPalaceLevel6", labelKey: "shortcut.palace" }
];

export type VillageShortcutBadges = Partial<Record<VillageBuildingType, number>>;

export function VillageShortcutDock({
  lang,
  selectedType,
  helperAsset,
  badges,
  bottomInset,
  onSelect
}: {
  lang: Lang;
  selectedType: VillageBuildingType | null;
  helperAsset: GameAssetKey;
  badges: VillageShortcutBadges;
  bottomInset: number;
  onSelect: (type: VillageBuildingType) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (!selectedType) {
      return;
    }
    const index = SHORTCUTS.findIndex((shortcut) => shortcut.type === selectedType);
    if (index >= 0) {
      scrollRef.current?.scrollTo({ x: Math.max(0, index * 48 - 24), animated: true });
    }
  }, [selectedType]);

  return (
    <View style={[styles.dock, { bottom: Math.max(bottomInset, 6) + 6 }]}>
      <View style={styles.helper}>
        <View pointerEvents="none" style={styles.helperPortrait}>
          <AssetImage
            assetKey={helperAsset}
            style={styles.helperPortraitArt}
            resizeMode="contain"
            fallback={<View />}
            hideFallbackOnLoad
          />
        </View>
        <Text style={styles.helperTitle} numberOfLines={2} maxFontSizeMultiplier={theme.maxFontScale}>
          {selectedType ? buildingName(selectedType, lang) : t("shortcut.quickAccess", lang)}
        </Text>
      </View>

      <View style={styles.separator} />

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shortcutRow}
        style={styles.shortcutScroll}
      >
        {SHORTCUTS.map((shortcut) => {
          const selected = selectedType === shortcut.type;
          const badge = Math.max(0, Math.floor(badges[shortcut.type] ?? 0));
          return <ShortcutButton key={shortcut.type} shortcut={shortcut} lang={lang} selected={selected} badge={badge} onSelect={onSelect} />;
        })}
      </ScrollView>
    </View>
  );
}

const ShortcutButton = memo(function ShortcutButton({
  shortcut,
  lang,
  selected,
  badge,
  onSelect
}: {
  shortcut: ShortcutDefinition;
  lang: Lang;
  selected: boolean;
  badge: number;
  onSelect: (type: VillageBuildingType) => void;
}) {
  const handlePress = useCallback(() => onSelect(shortcut.type), [onSelect, shortcut.type]);

  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={buildingName(shortcut.type, lang)}
      accessibilityState={{ selected }}
      onPress={handlePress}
      sound={null}
      pressedScale={0.92}
      style={[styles.shortcut, selected ? styles.shortcutSelected : null]}
    >
      <View pointerEvents="none" style={[styles.iconWrap, selected ? styles.iconWrapSelected : null]}>
        <AssetImage
          assetKey={shortcut.asset}
          style={styles.shortcutIcon}
          resizeMode="contain"
          fallback={<View style={styles.iconFallback} />}
          hideFallbackOnLoad
        />
      </View>
      <Text
        style={[styles.shortcutLabel, selected ? styles.shortcutLabelSelected : null]}
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={theme.maxFontScale}
      >
        {t(shortcut.labelKey, lang)}
      </Text>
      {badge > 0 ? (
        <View pointerEvents="none" style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </SpringPressable>
  );
});

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 7,
    right: 7,
    height: VILLAGE_SHORTCUT_DOCK_HEIGHT,
    zIndex: 600,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.5)",
    backgroundColor: "rgba(13, 20, 13, 0.94)",
    padding: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 9
  },
  helper: { width: 54, minWidth: 54, alignItems: "center", justifyContent: "center" },
  helperPortrait: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(240, 194, 91, 0.72)",
    backgroundColor: "rgba(68, 91, 43, 0.82)",
    alignItems: "center"
  },
  helperPortraitArt: { position: "absolute", top: -3, width: 40, height: 50 },
  helperTitle: {
    width: "100%",
    minHeight: 16,
    marginTop: 2,
    color: "#ffe6a2",
    fontSize: 7.5,
    lineHeight: 8,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  separator: { width: 1, alignSelf: "stretch", marginHorizontal: 3, backgroundColor: "rgba(226, 177, 90, 0.18)" },
  shortcutScroll: { flex: 1 },
  shortcutRow: { alignItems: "center", gap: 3, paddingRight: 2 },
  shortcut: {
    width: 44,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(151, 124, 70, 0.32)",
    backgroundColor: "rgba(43, 49, 31, 0.78)",
    paddingHorizontal: 2
  },
  shortcutSelected: {
    borderColor: "#e8c15e",
    backgroundColor: "rgba(79, 96, 47, 0.9)"
  },
  iconWrap: {
    width: 29,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14.5,
    borderWidth: 1,
    borderColor: "rgba(217, 178, 91, 0.34)",
    backgroundColor: "rgba(18, 29, 17, 0.92)",
    overflow: "hidden"
  },
  iconWrapSelected: { borderColor: "#f1cd74", backgroundColor: "rgba(45, 72, 34, 0.96)" },
  shortcutIcon: { width: "92%", height: "92%" },
  iconFallback: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#708c4c" },
  shortcutLabel: { width: "100%", minHeight: 10, marginTop: 2, color: "#cfc5aa", fontSize: 7.5, lineHeight: 8.5, textAlign: "center", fontFamily: theme.fonts.bold },
  shortcutLabelSelected: { color: "#fff0b9" },
  badge: {
    position: "absolute",
    right: 1,
    top: 1,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffd470",
    backgroundColor: "#c94c31",
    paddingHorizontal: 3
  },
  badgeText: { color: "white", fontSize: 8.5, lineHeight: 10, fontFamily: theme.fonts.heavy }
});
