import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AssetImage } from "./AssetImage";
import { NineSliceFrame } from "./NineSliceFrame";
import { SpringPressable } from "./SpringPressable";
import { WoodButton } from "./WoodButton";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { RAID_CAMPS, campName, strongholdCamp } from "../../game/config/camps";
import { t } from "../../game/i18n";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";

type RaidMapScreenProps = {
  fighterCount: number;
  raidLevel: number;
  lang: Lang;
  onAttack: (campId: string) => void;
  onClose: () => void;
};

export function RaidMapScreen({ fighterCount, raidLevel, lang, onAttack, onClose }: RaidMapScreenProps) {
  const noFighters = fighterCount <= 0;
  // The endless stronghold sits after the handcrafted camps and levels up
  // every time the player razes it.
  const camps = [...RAID_CAMPS, strongholdCamp(raidLevel)];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("raidmap.title", lang)}</Text>
        <Text style={styles.subtitle}>{t("raidmap.ready", lang, { n: fighterCount })}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {camps.map((camp) => {
          const endless = camp.id.startsWith("stronghold-");
          return (
          <View key={camp.id} style={[styles.card, endless ? styles.cardEndless : null]}>
            <View style={styles.cardArt}>
              <AssetImage
                assetKey="buildingEnemyCamp"
                style={styles.cardArtImage}
                fallback={<View style={styles.cardArtFallback} />}
              />
              <View style={styles.levelTag}>
                <Text style={styles.levelTagText}>{t("common.levelShort", lang)} {camp.level}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.campName} numberOfLines={1}>{campName(camp.id, lang)}</Text>
              {endless ? (
                <Text style={styles.endlessNote} numberOfLines={1}>
                  {t("raidmap.endless", lang)}
                </Text>
              ) : null}
              <View style={styles.lootRow}>
                <LootChip assetKey="resourceBanana" amount={camp.loot.bananas} />
                <LootChip assetKey="resourceWood" amount={camp.loot.wood} />
                <LootChip assetKey="resourceStone" amount={camp.loot.stones} />
              </View>
            </View>

            <SpringPressable
              accessibilityRole="button"
              accessibilityState={{ disabled: noFighters }}
              disabled={noFighters}
              onPress={() => onAttack(camp.id)}
              style={[styles.attackButton, noFighters ? styles.attackButtonDisabled : null]}
            >
              <NineSliceFrame preset="attackPlaque" cornerSize={18} style={StyleSheet.absoluteFill} />
              <Text style={styles.attackText} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
                {noFighters ? t("raidmap.needFighter", lang) : t("raidmap.attack", lang)}
              </Text>
            </SpringPressable>
          </View>
          );
        })}
      </ScrollView>

      <WoodButton label={t("raidmap.close", lang)} onPress={onClose} />
    </View>
  );
}

function LootChip({ assetKey, amount }: { assetKey: GameAssetKey; amount: number }) {
  return (
    <View style={styles.lootChip}>
      <AssetImage assetKey={assetKey} style={styles.lootIcon} fallback={<View style={styles.lootIconFallback} />} />
      <Text style={styles.lootText} maxFontSizeMultiplier={theme.maxFontScale}>{amount}</Text>
    </View>
  );
}

const glass = "rgba(17, 20, 14, 0.82)";

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.4)",
    backgroundColor: "rgba(60, 22, 16, 0.88)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5
  },
  title: {
    color: theme.colors.paper,
    fontSize: 16,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  subtitle: {
    color: "#e7b9a0",
    fontSize: 12,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  list: {
    gap: theme.spacing.sm,
    paddingBottom: 2
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.32)",
    backgroundColor: glass,
    padding: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  cardEndless: {
    borderColor: "rgba(216, 106, 84, 0.6)",
    backgroundColor: "rgba(46, 18, 13, 0.86)"
  },
  endlessNote: {
    marginTop: 1,
    color: "#e7b9a0",
    fontSize: 10.5,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  cardArt: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.45)",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.25)"
  },
  cardArtImage: {
    width: "100%",
    height: "100%"
  },
  cardArtFallback: {
    flex: 1,
    backgroundColor: "#7f2d25"
  },
  levelTag: {
    position: "absolute",
    left: 3,
    top: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(243, 210, 122, 0.8)",
    backgroundColor: "rgba(20, 12, 4, 0.78)",
    paddingHorizontal: 5,
    paddingVertical: 1
  },
  levelTagText: {
    color: "#ffd95a",
    fontSize: 10,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  cardBody: {
    flex: 1,
    minWidth: 0
  },
  campName: {
    color: theme.colors.paper,
    fontSize: 15,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  lootRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6
  },
  lootChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  lootIcon: {
    width: 18,
    height: 18
  },
  lootIconFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 224, 151, 0.4)"
  },
  lootText: {
    color: "#ffe9ad",
    fontSize: 13,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  attackButton: {
    minWidth: 96,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(122, 52, 14, 0.95)",
    backgroundColor: "#a34a10",
    overflow: "hidden",
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5
  },
  attackButtonDisabled: {
    opacity: 0.55
  },
  // Crop the attack plaque art to its stone body (the source PNG carries a
  // baked-in backdrop and a totem crest that don't fit a small button).
  attackArt: {
    position: "absolute",
    top: "-62%",
    left: "-11%",
    width: "122%",
    height: "196%"
  },
  attackArtFallback: {
    flex: 1,
    backgroundColor: "transparent"
  },
  attackText: {
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textShadowColor: "rgba(60, 20, 4, 0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  }
});
