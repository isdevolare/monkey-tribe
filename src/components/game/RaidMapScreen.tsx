import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AssetImage } from "./AssetImage";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { RAID_CAMPS } from "../../game/config/camps";
import type { Resources } from "../../game/types/game";
import { theme } from "../../theme/theme";

type RaidMapScreenProps = {
  fighterCount: number;
  onAttack: (campId: string) => void;
  onClose: () => void;
};

export function RaidMapScreen({ fighterCount, onAttack, onClose }: RaidMapScreenProps) {
  const noFighters = fighterCount <= 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Baskın Hedefi</Text>
        <Text style={styles.subtitle}>{fighterCount} savaşçı hazır</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {RAID_CAMPS.map((camp) => (
          <View key={camp.id} style={styles.card}>
            <View style={styles.cardArt}>
              <AssetImage
                assetKey="buildingEnemyCamp"
                style={styles.cardArtImage}
                fallback={<View style={styles.cardArtFallback} />}
              />
              <View style={styles.levelTag}>
                <Text style={styles.levelTagText}>Sv {camp.level}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.campName}>{camp.name}</Text>
              <View style={styles.lootRow}>
                <LootChip assetKey="resourceBanana" amount={camp.loot.bananas} />
                <LootChip assetKey="resourceWood" amount={camp.loot.wood} />
                <LootChip assetKey="resourceStone" amount={camp.loot.stones} />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={noFighters}
              onPress={() => onAttack(camp.id)}
              style={({ pressed }) => [
                styles.attackButton,
                noFighters ? styles.attackButtonDisabled : null,
                pressed && !noFighters ? styles.attackButtonPressed : null
              ]}
            >
              <Text style={styles.attackText}>{noFighters ? "Savaşçı gerek" : "Saldırı"}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Pressable accessibilityRole="button" onPress={onClose} style={styles.backButton}>
        <Text style={styles.backText}>Köye Dön</Text>
      </Pressable>
    </View>
  );
}

function LootChip({ assetKey, amount }: { assetKey: GameAssetKey; amount: number }) {
  return (
    <View style={styles.lootChip}>
      <AssetImage assetKey={assetKey} style={styles.lootIcon} fallback={<View style={styles.lootIconFallback} />} />
      <Text style={styles.lootText}>{amount}</Text>
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
    borderWidth: 1,
    borderColor: "rgba(200, 86, 70, 0.5)",
    backgroundColor: "rgba(60, 22, 16, 0.85)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  title: {
    color: theme.colors.paper,
    fontSize: 17,
    fontWeight: "900", fontFamily: theme.fonts.heavy
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
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.18)",
    backgroundColor: glass,
    padding: theme.spacing.sm
  },
  cardArt: {
    width: 64,
    height: 64,
    borderRadius: 10,
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
    left: 4,
    top: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
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
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#7b330e",
    backgroundColor: "#d96516",
    paddingHorizontal: theme.spacing.md
  },
  attackButtonDisabled: {
    opacity: 0.5
  },
  attackButtonPressed: {
    transform: [{ translateY: 1 }, { scale: 0.98 }]
  },
  attackText: {
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  backButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.18)",
    backgroundColor: "rgba(42, 38, 29, 0.9)"
  },
  backText: {
    color: theme.colors.paper,
    fontSize: 15,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  }
});
