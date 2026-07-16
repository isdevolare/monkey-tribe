import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { playSound } from "../../game/audio/soundManager";
import { storageCap } from "../../game/config/buildings";
import {
  resourceShopCapacityIssues,
  resourceShopItems,
  type ResourceShopCapacityIssue,
  type ShopItem
} from "../../game/config/shop";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang, Resources } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { BuyGemsButton } from "./GemStoreModal";
import { SpringPressable } from "./SpringPressable";

type ShopModalProps = {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
  onOpenGemStore: () => void;
};

export function ShopModal({ visible, lang, onClose, onOpenGemStore }: ShopModalProps) {
  const gems = useGameStore((state) => state.gems);
  const resources = useGameStore((state) => state.resources);
  const hallLevel = useGameStore((state) => state.buildings.find((building) => building.type === "clanHall")?.level ?? 1);
  const buy = useGameStore((state) => state.buyShopItem);
  const shopItems = resourceShopItems();

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.header}>
            <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("shop.title", lang)}
            </Text>
            <View style={styles.gemPill}>
              <AssetImage assetKey="resourceJungleGem" style={styles.gemIcon} fallback={<View />} />
              <Text style={styles.gemText} maxFontSizeMultiplier={theme.maxFontScale}>
                {gems}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("shop.subtitle", lang)}
          </Text>

          <BuyGemsButton lang={lang} onPress={onOpenGemStore} style={styles.buyGems} />

          <View style={styles.grid}>
            {shopItems.map((item) => {
              const capacityIssues = resourceShopCapacityIssues(
                item,
                resources,
                storageCap(hallLevel)
              );
              return (
                <ShopCard
                  key={item.id}
                  item={item}
                  lang={lang}
                  affordable={gems >= item.gemCost}
                  capacityIssues={capacityIssues}
                  onBuy={() => {
                    playSound("coins");
                    buy(item.id);
                  }}
                  onOpenGemStore={onOpenGemStore}
                />
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              playSound("close");
              onClose();
            }}
            style={styles.close}
          >
            <Text style={styles.closeText} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("settings.close", lang)}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ShopCard({
  item,
  lang,
  affordable,
  capacityIssues,
  onBuy,
  onOpenGemStore
}: {
  item: ShopItem;
  lang: Lang;
  affordable: boolean;
  capacityIssues: readonly ResourceShopCapacityIssue[];
  onBuy: () => void;
  onOpenGemStore: () => void;
}) {
  const rewards = (["bananas", "stones", "wood"] as (keyof Resources)[])
    .map((key) => ({ key, amount: item.reward[key] ?? 0 }))
    .filter((entry) => entry.amount > 0);

  const hasCapacity = capacityIssues.length === 0;
  const enabled = affordable && hasCapacity;
  // When storage is fine but the player is short on Gems, surface a direct
  // route to the Gem Store instead of a dead disabled button.
  const needsGems = hasCapacity && !affordable;

  return (
    <View style={styles.shopCard}>
      <Text style={styles.shopName} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
        {t(`shop.${item.id}`, lang)}
      </Text>
      <AssetImage
        assetKey={item.icon}
        style={styles.shopIcon}
        fallback={<View style={styles.shopIconFallback} />}
      />
      <View style={styles.rewardRow}>
        {rewards.map((entry) => (
          <View key={entry.key} style={styles.rewardChip}>
            <AssetImage
              assetKey={rewardAsset(entry.key)}
              style={styles.rewardIcon}
              fallback={<View style={styles.rewardIconFallback} />}
            />
            <Text style={styles.rewardText} maxFontSizeMultiplier={theme.maxFontScale}>
              {entry.amount}
            </Text>
          </View>
        ))}
      </View>
      {!hasCapacity ? (
        <View style={styles.storageWarning}>
          <Text style={styles.storageWarningTitle}>{t("shop.storageShort", lang)}</Text>
          {capacityIssues.map((issue) => (
            <Text key={issue.resource} style={styles.storageWarningText} numberOfLines={2}>
              {t("shop.storageNeed", lang, {
                resource: t(`res.${issue.resource}`, lang),
                free: issue.free,
                required: issue.requiredFree
              })}
            </Text>
          ))}
        </View>
      ) : null}
      {needsGems ? (
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t("gemStore.open", lang)}
          onPress={onOpenGemStore}
          style={[styles.buy, styles.buyNeedsGems]}
        >
          <AssetImage assetKey="resourceJungleGem" style={styles.buyGem} fallback={<View />} />
          <Text style={styles.buyText} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={theme.maxFontScale}>
            {t("gemStore.open", lang)}
          </Text>
        </SpringPressable>
      ) : (
        <SpringPressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !enabled }}
          accessibilityLabel={!hasCapacity ? t("shop.storageShort", lang) : undefined}
          disabled={!enabled}
          sound={null}
          onPress={onBuy}
          style={[styles.buy, enabled ? styles.buyReady : styles.buyLocked]}
        >
          {hasCapacity ? (
            <>
              <AssetImage assetKey="resourceJungleGem" style={styles.buyGem} fallback={<View />} />
              <Text style={styles.buyText} maxFontSizeMultiplier={theme.maxFontScale}>
                {item.gemCost}
              </Text>
            </>
          ) : (
            <Text style={styles.buyText} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={theme.maxFontScale}>
              {t("shop.storageShort", lang)}
            </Text>
          )}
        </SpringPressable>
      )}
    </View>
  );
}

function rewardAsset(key: keyof Resources) {
  if (key === "bananas") return "resourceBanana" as const;
  if (key === "stones") return "resourceStone" as const;
  return "resourceWood" as const;
}

const glass = "rgba(40, 34, 20, 0.7)";

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 23, 15, 0.7)",
    padding: theme.spacing.xl
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(226, 177, 90, 0.5)",
    backgroundColor: "rgba(17, 20, 14, 0.97)",
    padding: theme.spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    color: theme.colors.paper,
    fontSize: theme.type.h1,
    fontFamily: theme.fonts.heavy
  },
  gemPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(120, 200, 255, 0.45)",
    backgroundColor: "rgba(14, 12, 7, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  gemIcon: {
    width: 18,
    height: 18
  },
  gemText: {
    color: "#bfe6ff",
    fontSize: theme.type.title,
    fontFamily: theme.fonts.heavy
  },
  subtitle: {
    marginTop: 2,
    marginBottom: theme.spacing.md,
    color: "#d8ccb0",
    fontSize: theme.type.label,
    fontFamily: theme.fonts.bold
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: theme.spacing.sm
  },
  shopCard: {
    width: "48%",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.28)",
    backgroundColor: glass,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 6
  },
  shopName: {
    color: theme.colors.paper,
    fontSize: theme.type.body,
    fontFamily: theme.fonts.heavy
  },
  shopIcon: {
    width: 44,
    height: 44,
    marginVertical: 6
  },
  shopIconFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginVertical: 6,
    backgroundColor: "rgba(255, 224, 151, 0.3)"
  },
  rewardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    minHeight: 18,
    marginBottom: 6
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  rewardIcon: {
    width: 13,
    height: 13
  },
  rewardIconFallback: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "rgba(255, 224, 151, 0.3)"
  },
  rewardText: {
    color: "#ffe9ad",
    fontSize: theme.type.small,
    fontFamily: theme.fonts.heavy
  },
  storageWarning: {
    width: "100%",
    minHeight: 34,
    justifyContent: "center",
    marginBottom: 5,
    borderRadius: 7,
    backgroundColor: "rgba(105, 43, 25, 0.72)",
    paddingHorizontal: 5,
    paddingVertical: 3
  },
  storageWarningTitle: {
    color: "#ffb68a",
    fontSize: 8.5,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  storageWarningText: {
    color: "#f3d3b8",
    fontSize: 7.5,
    lineHeight: 10,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  buy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    alignSelf: "stretch",
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: theme.spacing.sm
  },
  buyGems: {
    marginBottom: theme.spacing.md
  },
  buyReady: {
    borderColor: "rgba(120, 200, 255, 0.5)",
    backgroundColor: "rgba(40, 70, 95, 0.85)"
  },
  buyNeedsGems: {
    borderColor: "rgba(226, 177, 90, 0.6)",
    backgroundColor: "rgba(90, 62, 26, 0.92)"
  },
  buyLocked: {
    borderColor: "rgba(255, 224, 151, 0.14)",
    backgroundColor: "rgba(28, 32, 20, 0.85)",
    opacity: 0.5
  },
  buyGem: {
    width: 16,
    height: 16
  },
  buyText: {
    color: "#bfe6ff",
    fontSize: theme.type.body,
    fontFamily: theme.fonts.heavy
  },
  close: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.sm
  },
  closeText: {
    color: "#d8ccb0",
    fontSize: theme.type.body,
    fontFamily: theme.fonts.heavy
  }
});
