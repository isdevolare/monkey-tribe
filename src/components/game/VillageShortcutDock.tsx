import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { buildingName } from "../../game/config/buildings";
import { t } from "../../game/i18n";
import type { Lang, VillageBuildingType } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";

export const VILLAGE_SHORTCUT_DOCK_HEIGHT = 84;

type ShortcutDefinition = {
  type: VillageBuildingType;
  asset: GameAssetKey;
  actionKey: string;
};

const SHORTCUTS: ShortcutDefinition[] = [
  { type: "clanHall", asset: "buildingPlayerCamp", actionKey: "shortcut.action.clanHall" },
  { type: "workerShelter", asset: "buildingHut", actionKey: "shortcut.action.workerShelter" },
  { type: "bananaGrove", asset: "terrainBananaTree", actionKey: "shortcut.action.bananaGrove" },
  { type: "lumberCamp", asset: "buildingLumberCampReference", actionKey: "shortcut.action.lumberCamp" },
  { type: "stoneQuarry", asset: "terrainRock", actionKey: "shortcut.action.stoneQuarry" },
  { type: "trainingNest", asset: "buildingWarriorBarracks", actionKey: "shortcut.action.trainingNest" },
  { type: "watchTower", asset: "buildingArcherTower", actionKey: "shortcut.action.watchTower" }
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
  const selectedDefinition = SHORTCUTS.find((shortcut) => shortcut.type === selectedType);

  useEffect(() => {
    if (!selectedType) {
      return;
    }
    const index = SHORTCUTS.findIndex((shortcut) => shortcut.type === selectedType);
    if (index >= 0) {
      scrollRef.current?.scrollTo({ x: Math.max(0, index * 36 - 32), animated: true });
    }
  }, [selectedType]);

  return (
    <View style={[styles.dock, { bottom: Math.max(bottomInset, 6) + 6 }]}>
      <View style={styles.helper}>
        <View style={styles.helperPortrait}>
          <AssetImage assetKey={helperAsset} style={styles.helperPortraitArt} resizeMode="contain" fallback={<View />} hideFallbackOnLoad />
        </View>
        <View style={styles.helperCopy}>
          <Text style={styles.helperTitle} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
            {selectedType ? buildingName(selectedType, lang) : t("shortcut.select", lang)}
          </Text>
          <Text style={styles.helperText} numberOfLines={3} maxFontSizeMultiplier={theme.maxFontScale}>
            {selectedDefinition ? t(selectedDefinition.actionKey, lang) : t("shortcut.defaultAction", lang)}
          </Text>
        </View>
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
          return (
            <SpringPressable
              key={shortcut.type}
              accessibilityRole="button"
              accessibilityLabel={buildingName(shortcut.type, lang)}
              accessibilityState={{ selected }}
              onPress={() => onSelect(shortcut.type)}
              sound={null}
              pressedScale={0.9}
              style={[
                styles.shortcut,
                shortcut.type === "watchTower" ? styles.shortcutWide : null,
                selected ? styles.shortcutSelected : null
              ]}
            >
              <View style={[styles.iconWrap, selected ? styles.iconWrapSelected : null]}>
                <AssetImage assetKey={shortcut.asset} style={styles.shortcutIcon} resizeMode="contain" fallback={<View style={styles.iconFallback} />} hideFallbackOnLoad />
              </View>
              <Text style={[styles.shortcutLabel, selected ? styles.shortcutLabelSelected : null]} numberOfLines={2} adjustsFontSizeToFit maxFontSizeMultiplier={theme.maxFontScale}>
                {buildingName(shortcut.type, lang)}
              </Text>
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
                </View>
              ) : null}
            </SpringPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 8,
    right: 8,
    height: VILLAGE_SHORTCUT_DOCK_HEIGHT,
    zIndex: 600,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.62)",
    backgroundColor: "rgba(13, 20, 13, 0.94)",
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14
  },
  helper: { width: 100, minWidth: 100, flexDirection: "row", alignItems: "center", gap: 5 },
  helperPortrait: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(240, 194, 91, 0.72)",
    backgroundColor: "rgba(68, 91, 43, 0.82)",
    alignItems: "center"
  },
  helperPortraitArt: { position: "absolute", top: -3, width: 47, height: 60 },
  helperCopy: { flex: 1, minWidth: 0 },
  helperTitle: { color: "#ffe6a2", fontSize: 10.5, lineHeight: 12, fontFamily: theme.fonts.heavy },
  helperText: { marginTop: 2, color: "#bfb596", fontSize: 8, lineHeight: 9.5, fontFamily: theme.fonts.bold },
  separator: { width: 1, alignSelf: "stretch", marginHorizontal: 2, backgroundColor: "rgba(226, 177, 90, 0.22)" },
  shortcutScroll: { flex: 1 },
  shortcutRow: { alignItems: "center", gap: 1, paddingRight: 2 },
  shortcut: {
    width: 34,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(151, 124, 70, 0.32)",
    backgroundColor: "rgba(43, 49, 31, 0.78)",
    paddingHorizontal: 1
  },
  shortcutWide: { width: 42 },
  shortcutSelected: {
    borderColor: "#e8c15e",
    backgroundColor: "rgba(86, 106, 49, 0.9)",
    shadowColor: "#c9f071",
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 }
  },
  iconWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(217, 178, 91, 0.34)",
    backgroundColor: "rgba(18, 29, 17, 0.92)",
    overflow: "hidden"
  },
  iconWrapSelected: { borderColor: "#f1cd74", backgroundColor: "rgba(45, 72, 34, 0.96)" },
  shortcutIcon: { width: "92%", height: "92%" },
  iconFallback: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#708c4c" },
  shortcutLabel: { width: "100%", minHeight: 18, marginTop: 2, color: "#cfc5aa", fontSize: 8, lineHeight: 8.5, textAlign: "center", fontFamily: theme.fonts.bold },
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
