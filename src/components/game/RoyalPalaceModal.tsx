import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ROYAL_PALACE_LEVEL_NAME_KEYS,
  ROYAL_PALACE_SLOTS,
  evaluateRoyalPalaceUpgrade,
  palaceMonkeysForClass,
  royalPrestige
} from "../../game/config/royalPalace";
import {
  getCosmeticAppearance,
  getDefaultSkinId,
  getProfileSkin,
  skinsForMonkey
} from "../../game/config/profileMonkeys";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang, Resources, RoyalPalaceSlotId } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";

type Props = { visible: boolean; lang: Lang; onClose: () => void };

export function RoyalPalaceModal({ visible, lang, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const state = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState<RoyalPalaceSlotId | null>(null);
  const [, setClock] = useState(0);
  const level = state.buildings.find((building) => building.type === "royalPalace")?.level ?? 0;
  const clanLevel = state.buildings.find((building) => building.type === "clanHall")?.level ?? 1;
  const activePalaceUpgrade = state.activeWorkerLodgeUpgrade && state.activeWorkerLodgeUpgrade.buildingType === "royalPalace"
    ? state.activeWorkerLodgeUpgrade
    : null;
  const upgrade = evaluateRoyalPalaceUpgrade({
    palaceLevel: level,
    clanLevel,
    resources: state.resources,
    gems: state.gems,
    activeUpgrade: state.activeWorkerLodgeUpgrade
  });
  const prestige = royalPrestige(level, state.royalPalaceSlots);

  useEffect(() => {
    if (!visible) setSelectedSlot(null);
  }, [visible]);
  useEffect(() => {
    if (!visible || !activePalaceUpgrade) return;
    const timer = setInterval(() => setClock((value) => value + 1), 1_000);
    return () => clearInterval(timer);
  }, [activePalaceUpgrade, visible]);

  const selectorDefinition = useMemo(
    () => ROYAL_PALACE_SLOTS.find((slot) => slot.slotId === selectedSlot) ?? null,
    [selectedSlot]
  );

  if (!visible) return null;

  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.scrim}>
      <View style={[styles.card, { marginTop: insets.top + 8, marginBottom: insets.bottom + 8 }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t("b.royalPalace", lang)}</Text>
            <Text style={styles.levelName}>
              {t("common.levelBadge", lang, { n: level })} · {t(ROYAL_PALACE_LEVEL_NAME_KEYS[level] ?? ROYAL_PALACE_LEVEL_NAME_KEYS[0], lang)}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t("settings.close", lang)} onPress={onClose} hitSlop={10} style={styles.close}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.description}>{t("royalPalace.description", lang)}</Text>
          <PalacePreview level={level} assignments={state.royalPalaceSlots} />
          <View style={styles.prestigeCard}>
            <Text style={styles.prestigeLabel}>{t("royalPalace.prestige", lang)}</Text>
            <Text style={styles.prestigeValue}>{prestige}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t("royalPalace.residents", lang)}</Text>
          <View style={styles.slotList}>
            {ROYAL_PALACE_SLOTS.map((slot) => {
              const locked = level < slot.requiredPalaceLevel;
              const assignment = state.royalPalaceSlots.find((entry) => entry.slotId === slot.slotId);
              const appearance = assignment
                ? getCosmeticAppearance(assignment.equippedMonkeyId, assignment.equippedSkinId ?? getDefaultSkinId(assignment.equippedMonkeyId))
                : null;
              return <View key={slot.slotId} style={[styles.slotCard, locked ? styles.slotLocked : null]}>
                <View style={styles.slotArt}>
                  {appearance ? <AssetImage assetKey={appearance.portraitAsset} style={styles.full} fallback={<View />} hideFallbackOnLoad /> : <View style={styles.emptyArt} />}
                </View>
                <View style={styles.slotCopy}>
                  <Text style={styles.slotName}>{t(slot.areaKey, lang)}</Text>
                  <Text style={styles.slotClass}>{t(`royalPalace.class.${slot.allowedClass}`, lang)}</Text>
                  <Text style={locked ? styles.lockedText : styles.slotMeta} numberOfLines={2}>
                    {locked
                      ? t("royalPalace.levelRequired", lang, { level: slot.requiredPalaceLevel })
                      : assignment
                        ? `${t(getProfileSkin(assignment.equippedSkinId ?? getDefaultSkinId(assignment.equippedMonkeyId))?.nameKey ?? "collection.skin.default.name", lang)}`
                        : t("royalPalace.emptySlot", lang)}
                  </Text>
                </View>
                {!locked ? <View style={styles.slotActions}>
                  <SpringPressable onPress={() => setSelectedSlot(slot.slotId)} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>{t(assignment ? "royalPalace.change" : "royalPalace.place", lang)}</Text>
                  </SpringPressable>
                  {assignment ? <Pressable onPress={() => state.removeRoyalPalaceResident(slot.slotId)} hitSlop={6}>
                    <Text style={styles.removeText}>{t("royalPalace.remove", lang)}</Text>
                  </Pressable> : null}
                </View> : null}
              </View>;
            })}
          </View>

          {selectorDefinition ? <CharacterSelector
            slotId={selectorDefinition.slotId}
            palaceClass={selectorDefinition.allowedClass}
            lang={lang}
            ownedMonkeys={state.unlockedProfileMonkeys}
            ownedSkins={state.ownedProfileSkins}
            onPlaced={() => setSelectedSlot(null)}
          /> : null}

          <UpgradeSection
            lang={lang}
            level={level}
            resources={state.resources}
            gems={state.gems}
            activeUpgrade={activePalaceUpgrade}
            definition={upgrade.definition}
            block={upgrade.block}
            onUpgrade={() => state.upgradeBuilding("royalPalace")}
          />
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function CharacterSelector({ slotId, palaceClass, lang, ownedMonkeys, ownedSkins, onPlaced }: {
  slotId: RoyalPalaceSlotId;
  palaceClass: Parameters<typeof palaceMonkeysForClass>[0];
  lang: Lang;
  ownedMonkeys: string[];
  ownedSkins: string[];
  onPlaced: () => void;
}) {
  const place = useGameStore((state) => state.placeRoyalPalaceResident);
  return <View style={styles.selector}>
    <Text style={styles.sectionTitle}>{t("royalPalace.characterSelector", lang)}</Text>
    {palaceMonkeysForClass(palaceClass).map((monkey) => {
      const monkeyOwned = ownedMonkeys.includes(monkey.id);
      const skins = skinsForMonkey(monkey.id);
      return <View key={monkey.id} style={styles.monkeyChoice}>
        <View style={styles.monkeyHeading}>
          <AssetImage assetKey={monkey.portraitAsset} style={styles.choicePortrait} fallback={<View />} />
          <View style={styles.choiceCopy}>
            <Text style={styles.choiceName}>{t(monkey.nameKey, lang)}</Text>
            {!monkeyOwned ? <Text style={styles.lockedText}>{t("royalPalace.monkeyNotOwned", lang)}</Text> : null}
          </View>
        </View>
        <View style={styles.skinGrid}>
          <SkinChoice
            label={t("collection.skin.default.name", lang)}
            asset={monkey.portraitAsset}
            disabled={!monkeyOwned}
            onPress={() => {
              if (place(slotId, monkey.id, null) === "placed") onPlaced();
            }}
          />
          {skins.filter((skin) => skin.catalogStatus === "festival").map((skin) => {
            const owned = ownedSkins.includes(skin.id);
            return <SkinChoice
              key={skin.id}
              label={t(skin.nameKey, lang)}
              asset={skin.portraitAsset ?? monkey.portraitAsset}
              disabled={!monkeyOwned || !owned}
              lockedLabel={!monkeyOwned ? t("royalPalace.parentRequired", lang) : t("royalPalace.skinNotOwned", lang)}
              onPress={() => {
                if (place(slotId, monkey.id, skin.id) === "placed") onPlaced();
              }}
            />;
          })}
        </View>
      </View>;
    })}
  </View>;
}

function SkinChoice({ label, asset, disabled, lockedLabel, onPress }: { label: string; asset: Parameters<typeof AssetImage>[0]["assetKey"]; disabled: boolean; lockedLabel?: string; onPress: () => void }) {
  return <SpringPressable accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.skinChoice, disabled ? styles.choiceDisabled : null]}>
    <AssetImage assetKey={asset} style={styles.skinArt} fallback={<View />} />
    <Text style={styles.skinName} numberOfLines={2}>{label}</Text>
    {disabled && lockedLabel ? <Text style={styles.skinLocked} numberOfLines={2}>{lockedLabel}</Text> : null}
  </SpringPressable>;
}

function PalacePreview({ level, assignments }: { level: number; assignments: ReturnType<typeof useGameStore.getState>["royalPalaceSlots"] }) {
  const asset = level >= 5 ? "buildingPlayerCampL3" : level >= 2 ? "buildingPlayerCampL2" : "buildingHut";
  return <View style={styles.preview}>
    <View style={styles.previewGlow} />
    <AssetImage assetKey={asset} style={styles.previewBuilding} fallback={<View />} />
    {assignments.map((assignment) => {
      const appearance = getCosmeticAppearance(assignment.equippedMonkeyId, assignment.equippedSkinId ?? getDefaultSkinId(assignment.equippedMonkeyId));
      const spots = [{ left: "5%", bottom: 8 }, { right: "5%", bottom: 8 }, { left: "18%", top: 28 }, { right: "18%", top: 28 }, { left: "34%", top: 12 }, { left: "44%", top: 28 }] as const;
      const slotIndex = ROYAL_PALACE_SLOTS.findIndex((slot) => slot.slotId === assignment.slotId);
      return <View key={assignment.slotId} style={[styles.previewResident, spots[slotIndex] ?? spots[0], assignment.slotId === "goldenThrone" ? styles.previewKing : null]}>
        <AssetImage assetKey={appearance.villageAsset} style={styles.full} fallback={<View />} />
      </View>;
    })}
  </View>;
}

function UpgradeSection({ lang, level, resources, gems, activeUpgrade, definition, block, onUpgrade }: {
  lang: Lang;
  level: number;
  resources: Resources;
  gems: number;
  activeUpgrade: ReturnType<typeof useGameStore.getState>["activeWorkerLodgeUpgrade"];
  definition: ReturnType<typeof evaluateRoyalPalaceUpgrade>["definition"];
  block: ReturnType<typeof evaluateRoyalPalaceUpgrade>["block"];
  onUpgrade: () => void;
}) {
  const blockText = !definition ? t("royalPalace.maxLevel", lang)
    : block === "clan-level" ? t("royalPalace.needClanHall", lang, { level: definition.requiredClanHallLevel })
      : block === "gems" ? t("royalPalace.needGems", lang, { amount: definition.gemCost })
        : block === "resource" ? t("royalPalace.needResourcesShort", lang)
          : block === "upgrade-active" ? t("royalPalace.otherUpgradeActive", lang)
            : null;
  return <View style={styles.upgradeCard}>
    <Text style={styles.sectionTitle}>{t("royalPalace.upgrade", lang)}</Text>
    {activeUpgrade ? <>
      <Text style={styles.upgradeHeadline}>{t("royalPalace.upgrading", lang, { level: activeUpgrade.targetLevel })}</Text>
      <Text style={styles.upgradeMeta}>{formatDuration(Math.max(0, activeUpgrade.endsAt - Date.now()), lang)}</Text>
    </> : definition ? <>
      <Text style={styles.upgradeHeadline}>
        {t("common.levelBadge", lang, { n: level })} → {t("common.levelBadge", lang, { n: definition.targetLevel })}
      </Text>
      <Text style={styles.upgradeMeta}>{t("royalPalace.unlocksClass", lang, { class: t(`royalPalace.class.${ROYAL_PALACE_SLOTS[definition.targetLevel - 1]?.allowedClass}`, lang) })}</Text>
      <View style={styles.costRow}>
        <Cost asset="resourceBanana" current={resources.bananas} amount={definition.cost.bananas} />
        <Cost asset="resourceWood" current={resources.wood} amount={definition.cost.wood} />
        <Cost asset="resourceStone" current={resources.stones} amount={definition.cost.stones} />
        {definition.gemCost > 0 ? <Cost asset="resourceJungleGem" current={gems} amount={definition.gemCost} /> : null}
      </View>
      <Text style={styles.requirement}>{t("royalPalace.clanRequirement", lang, { level: definition.requiredClanHallLevel })} · {formatDuration(definition.durationMs, lang)}</Text>
      {blockText ? <Text style={styles.blockText}>{blockText}</Text> : null}
      <SpringPressable disabled={block != null} onPress={onUpgrade} style={[styles.upgradeButton, block ? styles.choiceDisabled : null]}>
        <Text style={styles.upgradeButtonText}>{t("upgrade.button", lang)}</Text>
      </SpringPressable>
    </> : <Text style={styles.upgradeMeta}>{blockText}</Text>}
  </View>;
}

function Cost({ asset, current, amount }: { asset: "resourceBanana" | "resourceWood" | "resourceStone" | "resourceJungleGem"; current: number; amount: number }) {
  return <View style={styles.cost}><AssetImage assetKey={asset} style={styles.costIcon} fallback={<View />} /><Text style={[styles.costText, current < amount ? styles.costMissing : null]}>{amount}</Text></View>;
}

function formatDuration(ms: number, lang: Lang) {
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return `${minutes} ${lang === "tr" ? "dk" : "min"}`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `${hours} ${lang === "tr" ? "sa" : "hr"}`;
  return `${Math.ceil(hours / 24)} ${lang === "tr" ? "gün" : "day"}`;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,12,7,0.82)", paddingHorizontal: 12 },
  card: { width: "100%", maxWidth: 430, maxHeight: "100%", overflow: "hidden", borderRadius: 22, borderWidth: 2, borderColor: "#d7ae55", backgroundColor: "#172318" },
  header: { minHeight: 66, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "rgba(226,177,90,0.24)", backgroundColor: "#21351f" },
  headerCopy: { flex: 1, minWidth: 0 }, title: { color: "#fff0bd", fontSize: 21, fontFamily: theme.fonts.heavy }, levelName: { color: "#d2c293", fontSize: 12, fontFamily: theme.fonts.bold },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, closeText: { color: "#fff0bd", fontSize: 28, fontFamily: theme.fonts.heavy },
  content: { padding: 14, paddingBottom: 28 }, description: { color: "#d8ccb0", fontSize: 12, lineHeight: 17, fontFamily: theme.fonts.bold, textAlign: "center" },
  preview: { height: 178, alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 10, borderRadius: 16, backgroundColor: "#294a2b" }, previewGlow: { position: "absolute", width: 190, height: 90, borderRadius: 80, backgroundColor: "rgba(255,210,84,0.14)" }, previewBuilding: { width: 174, height: 174 }, previewResident: { position: "absolute", width: 54, height: 54, zIndex: 4 }, previewKing: { width: 62, height: 62, zIndex: 5 }, full: { width: "100%", height: "100%" },
  prestigeCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 9, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,218,109,0.36)", backgroundColor: "rgba(93,67,22,0.45)", paddingHorizontal: 13, paddingVertical: 9 }, prestigeLabel: { color: "#f5dda0", fontSize: 13, fontFamily: theme.fonts.heavy }, prestigeValue: { color: "#ffe16f", fontSize: 20, fontFamily: theme.fonts.heavy },
  sectionTitle: { marginTop: 14, marginBottom: 7, color: "#f2dfaa", fontSize: 15, fontFamily: theme.fonts.heavy }, slotList: { gap: 7 }, slotCard: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 13, borderWidth: 1, borderColor: "rgba(226,177,90,0.28)", backgroundColor: "rgba(34,50,31,0.92)", padding: 8 }, slotLocked: { opacity: 0.65 }, slotArt: { width: 54, height: 54, overflow: "hidden", borderRadius: 11, backgroundColor: "rgba(10,16,10,0.55)" }, emptyArt: { flex: 1, margin: 12, borderRadius: 20, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(226,177,90,0.35)" }, slotCopy: { flex: 1, minWidth: 0 }, slotName: { color: "#f5e6bb", fontSize: 12, fontFamily: theme.fonts.heavy }, slotClass: { color: "#c7b884", fontSize: 10, fontFamily: theme.fonts.bold, textTransform: "uppercase" }, slotMeta: { color: "#aeb99c", fontSize: 10, fontFamily: theme.fonts.bold }, lockedText: { color: "#e0a38a", fontSize: 10, fontFamily: theme.fonts.bold }, slotActions: { width: 92, alignItems: "stretch", gap: 6 }, smallButton: { minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "#557d3e", paddingHorizontal: 5 }, smallButtonText: { color: "white", fontSize: 9, fontFamily: theme.fonts.heavy, textAlign: "center" }, removeText: { color: "#e4a18c", fontSize: 9, fontFamily: theme.fonts.bold, textAlign: "center" },
  selector: { marginTop: 11, borderRadius: 15, borderWidth: 1.5, borderColor: "rgba(120,180,97,0.42)", backgroundColor: "rgba(27,42,26,0.96)", padding: 10 }, monkeyChoice: { gap: 8 }, monkeyHeading: { flexDirection: "row", alignItems: "center", gap: 9 }, choicePortrait: { width: 56, height: 56 }, choiceCopy: { flex: 1 }, choiceName: { color: "#f4e2b3", fontSize: 13, fontFamily: theme.fonts.heavy }, skinGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, skinChoice: { width: "31%", minHeight: 112, alignItems: "center", borderRadius: 11, borderWidth: 1, borderColor: "rgba(226,177,90,0.28)", backgroundColor: "rgba(12,19,12,0.62)", padding: 6 }, choiceDisabled: { opacity: 0.45 }, skinArt: { width: 55, height: 55 }, skinName: { color: "#e9d8ad", fontSize: 9, lineHeight: 11, fontFamily: theme.fonts.heavy, textAlign: "center" }, skinLocked: { marginTop: 2, color: "#df9987", fontSize: 7.5, lineHeight: 9, fontFamily: theme.fonts.bold, textAlign: "center" },
  upgradeCard: { marginTop: 14, borderRadius: 15, borderWidth: 1, borderColor: "rgba(226,177,90,0.32)", backgroundColor: "rgba(40,42,25,0.82)", padding: 11 }, upgradeHeadline: { color: "#ffe2a0", fontSize: 14, fontFamily: theme.fonts.heavy }, upgradeMeta: { marginTop: 3, color: "#c9ba91", fontSize: 11, fontFamily: theme.fonts.bold }, costRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 9 }, cost: { minWidth: 68, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 9, backgroundColor: "rgba(8,13,8,0.55)", paddingHorizontal: 7, paddingVertical: 5 }, costIcon: { width: 20, height: 20 }, costText: { color: "#f0dda9", fontSize: 11, fontFamily: theme.fonts.heavy }, costMissing: { color: "#ef9b86" }, requirement: { marginTop: 8, color: "#bfb18c", fontSize: 10, fontFamily: theme.fonts.bold }, blockText: { marginTop: 6, color: "#ef9b86", fontSize: 10, fontFamily: theme.fonts.heavy }, upgradeButton: { minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: 10, borderRadius: 12, backgroundColor: "#836226" }, upgradeButtonText: { color: "#fff0bd", fontSize: 14, fontFamily: theme.fonts.heavy }
});
