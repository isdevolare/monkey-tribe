import { memo, useCallback, useEffect, useState } from "react";
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
  const [showInsufficientGems, setShowInsufficientGems] = useState(false);

  useEffect(() => {
    if (!visible) setShowInsufficientGems(false);
  }, [visible]);

  const handleClose = useCallback(() => {
    setShowInsufficientGems(false);
    onClose();
  }, [onClose]);
  const handleBuy = useCallback(
    (itemId: ShopItem["id"]) => {
      playSound("coins");
      buy(itemId);
    },
    [buy]
  );
  const handleNeedGems = useCallback(() => setShowInsufficientGems(true), []);
  const handleOpenGemStore = useCallback(() => {
    setShowInsufficientGems(false);
    onOpenGemStore();
  }, [onOpenGemStore]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.scrim} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.header}>
            <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("shop.title", lang)}
            </Text>
            <View pointerEvents="none" style={styles.gemPill}>
              <AssetImage assetKey="resourceJungleGem" style={styles.gemIcon} fallback={<View />} />
              <Text style={styles.gemText} maxFontSizeMultiplier={theme.maxFontScale}>
                {gems}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("shop.subtitle", lang)}
          </Text>

          <BuyGemsButton lang={lang} onPress={handleOpenGemStore} style={styles.buyGems} />

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
                  onBuy={handleBuy}
                  onNeedGems={handleNeedGems}
                />
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              playSound("close");
              handleClose();
            }}
            style={styles.close}
          >
            <Text style={styles.closeText} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("settings.close", lang)}
            </Text>
          </Pressable>
        </Pressable>

        {showInsufficientGems ? (
          <Pressable style={styles.noticeScrim} onPress={() => setShowInsufficientGems(false)}>
            <Pressable style={styles.noticeCard} onPress={() => undefined}>
              <View pointerEvents="none" style={styles.noticeIconWrap}>
                <AssetImage assetKey="resourceJungleGem" style={styles.noticeIcon} fallback={<View />} />
              </View>
              <Text style={styles.noticeTitle} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("shop.insufficientGems", lang)}
              </Text>
              <Text style={styles.noticeText} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("shop.insufficientMessage", lang)}
              </Text>
              <View style={styles.noticeActions}>
                <SpringPressable
                  accessibilityRole="button"
                  onPress={() => setShowInsufficientGems(false)}
                  style={[styles.noticeButton, styles.noticeCancel]}
                >
                  <Text style={styles.noticeCancelText} maxFontSizeMultiplier={theme.maxFontScale}>
                    {t("collection.cancel", lang)}
                  </Text>
                </SpringPressable>
                <SpringPressable
                  accessibilityRole="button"
                  onPress={handleOpenGemStore}
                  style={[styles.noticeButton, styles.noticeConfirm]}
                >
                  <Text style={styles.noticeConfirmText} numberOfLines={2} maxFontSizeMultiplier={theme.maxFontScale}>
                    {t("gemStore.open", lang)}
                  </Text>
                </SpringPressable>
              </View>
            </Pressable>
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const ShopCard = memo(function ShopCard({
  item,
  lang,
  affordable,
  capacityIssues,
  onBuy,
  onNeedGems
}: {
  item: ShopItem;
  lang: Lang;
  affordable: boolean;
  capacityIssues: readonly ResourceShopCapacityIssue[];
  onBuy: (itemId: ShopItem["id"]) => void;
  onNeedGems: () => void;
}) {
  const rewards = (["bananas", "stones", "wood"] as (keyof Resources)[])
    .map((key) => ({ key, amount: item.reward[key] ?? 0 }))
    .filter((entry) => entry.amount > 0);

  const hasCapacity = capacityIssues.length === 0;
  const needsGems = hasCapacity && !affordable;
  const handlePress = useCallback(
    () => (needsGems ? onNeedGems() : onBuy(item.id)),
    [item.id, needsGems, onBuy, onNeedGems]
  );

  return (
    <View style={styles.shopCard}>
      <Text style={styles.shopName} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
        {t(`shop.${item.id}`, lang)}
      </Text>
      <View pointerEvents="none">
        <AssetImage
          assetKey={item.icon}
          style={styles.shopIcon}
          fallback={<View style={styles.shopIconFallback} />}
        />
      </View>
      <View pointerEvents="none" style={styles.rewardRow}>
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
      <SpringPressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !hasCapacity }}
        accessibilityLabel={!hasCapacity ? t("shop.storageShort", lang) : undefined}
        disabled={!hasCapacity}
        sound={needsGems ? undefined : null}
        onPress={handlePress}
        style={[
          styles.buy,
          affordable && hasCapacity ? styles.buyReady : needsGems ? styles.buyNeedsGems : styles.buyLocked
        ]}
      >
        <View pointerEvents="none">
          <AssetImage assetKey="resourceJungleGem" style={styles.buyGem} fallback={<View />} />
        </View>
        <Text style={styles.buyText} maxFontSizeMultiplier={theme.maxFontScale}>
          {item.gemCost}
        </Text>
      </SpringPressable>
      {needsGems ? (
        <Text style={styles.insufficientText} maxFontSizeMultiplier={theme.maxFontScale}>
          {t("shop.insufficientGems", lang)}
        </Text>
      ) : null}
    </View>
  );
});

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
    minHeight: 44,
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
    borderColor: "rgba(205, 151, 102, 0.5)",
    backgroundColor: "rgba(67, 48, 38, 0.9)"
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
  insufficientText: {
    minHeight: 11,
    marginTop: 3,
    color: "#e8b480",
    fontSize: 8.5,
    lineHeight: 10,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  noticeScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 10, 7, 0.76)",
    padding: 28
  },
  noticeCard: {
    width: "100%",
    maxWidth: 310,
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.6)",
    backgroundColor: "#171a12",
    padding: 16,
    elevation: 18
  },
  noticeIconWrap: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center"
  },
  noticeIcon: {
    width: 38,
    height: 38
  },
  noticeTitle: {
    marginTop: 4,
    color: "#ffe5a5",
    fontSize: theme.type.title,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  noticeText: {
    marginTop: 5,
    color: "#d8ccb0",
    fontSize: theme.type.label,
    lineHeight: 17,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  noticeActions: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    marginTop: 14
  },
  noticeButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 7
  },
  noticeCancel: {
    borderColor: "rgba(226, 177, 90, 0.24)",
    backgroundColor: "rgba(40, 40, 29, 0.88)"
  },
  noticeConfirm: {
    borderColor: "rgba(120, 200, 255, 0.48)",
    backgroundColor: "rgba(40, 70, 95, 0.9)"
  },
  noticeCancelText: {
    color: "#d8ccb0",
    fontSize: theme.type.label,
    fontFamily: theme.fonts.heavy
  },
  noticeConfirmText: {
    color: "#cceaff",
    fontSize: theme.type.label,
    lineHeight: 14,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
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
