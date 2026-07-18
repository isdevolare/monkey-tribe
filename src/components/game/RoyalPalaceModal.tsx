import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ROYAL_PALACE_CHARACTERS,
  ROYAL_PALACE_LEVEL_NAME_KEYS,
  evaluateRoyalPalaceRush,
  evaluateRoyalPalaceUpgrade,
  royalPrestige
} from "../../game/config/royalPalace";
import { ROYAL_PALACE_RESIDENT_SPOTS, royalPalaceAsset } from "../../game/config/royalPalaceVisuals";
import {
  PROFILE_MONKEYS,
  getCosmeticAppearance,
  getDefaultSkinId,
  getProfileMonkey,
  getProfileSkin,
  skinsForMonkey
} from "../../game/config/profileMonkeys";
import { festivalFragmentRequirement } from "../../game/config/festivalCollection";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang, ProfileMonkeyId, Resources, RoyalCharacterDisplay } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { FestivalFragmentIcon } from "./FestivalFragmentIcon";
import { SpringPressable } from "./SpringPressable";

type Props = { visible: boolean; lang: Lang; onClose: () => void };

export function RoyalPalaceModal({ visible, lang, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const state = useGameStore();
  const [selectedCharacterId, setSelectedCharacterId] = useState<ProfileMonkeyId>(PROFILE_MONKEYS[0]?.id ?? "profile_monkey_worker");
  const [, setClock] = useState(0);
  const level = state.buildings.find((building) => building.type === "royalPalace")?.level ?? 0;
  const clanLevel = state.buildings.find((building) => building.type === "clanHall")?.level ?? 1;
  const activePalaceUpgrade = state.activeWorkerLodgeUpgrade?.buildingType === "royalPalace"
    ? state.activeWorkerLodgeUpgrade
    : null;
  const upgrade = evaluateRoyalPalaceUpgrade({
    palaceLevel: level,
    clanLevel,
    resources: state.resources,
    gems: state.gems,
    activeUpgrade: state.activeWorkerLodgeUpgrade
  });
  const prestige = royalPrestige(level, state.royalCharacterDisplays);

  useEffect(() => {
    if (!visible || !activePalaceUpgrade) return;
    const timer = setInterval(() => setClock((value) => value + 1), 1_000);
    return () => clearInterval(timer);
  }, [activePalaceUpgrade, visible]);

  const selectedDefinition = useMemo(
    () => ROYAL_PALACE_CHARACTERS.find((entry) => entry.characterId === selectedCharacterId) ?? ROYAL_PALACE_CHARACTERS[0],
    [selectedCharacterId]
  );
  const selectedDisplay = state.royalCharacterDisplays.find((entry) => entry.characterId === selectedCharacterId);

  if (!visible || !selectedDefinition) return null;

  return <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <View style={styles.scrim}>
      <View style={[styles.card, { marginTop: Math.max(insets.top, 8), marginBottom: Math.max(insets.bottom, 8) }]}>
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
          <Text style={styles.sectionTitle}>{t("royalPalace.overview", lang)}</Text>
          <Text style={styles.description}>{t("royalPalace.description", lang)}</Text>
          <PalacePreview level={level} displays={state.royalCharacterDisplays} />
          <View style={styles.prestigeCard}>
            <Text style={styles.prestigeLabel}>{t("royalPalace.prestige", lang)}</Text>
            <Text style={styles.prestigeValue}>{prestige}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t("royalPalace.characters", lang)}</Text>
          <View style={styles.characterList}>
            {ROYAL_PALACE_CHARACTERS.map((definition) => {
              const monkey = getProfileMonkey(definition.characterId);
              const display = state.royalCharacterDisplays.find((entry) => entry.characterId === definition.characterId);
              if (!monkey || !display) return null;
              const palaceLocked = level < definition.palaceUnlockLevel;
              const owned = state.unlockedProfileMonkeys.includes(monkey.id);
              const appearance = getCosmeticAppearance(monkey.id, display.selectedSkinId ?? getDefaultSkinId(monkey.id));
              const selected = selectedCharacterId === monkey.id;
              return <View
                key={monkey.id}
                style={[styles.characterCard, selected ? styles.characterCardSelected : null, palaceLocked || !owned ? styles.lockedCard : null]}
              >
                <SpringPressable onPress={() => setSelectedCharacterId(monkey.id)} style={styles.characterSelect}>
                  <AssetImage assetKey={appearance.portraitAsset} style={styles.characterArt} fallback={<View />} hideFallbackOnLoad />
                  <View style={styles.characterCopy}>
                    <Text style={styles.characterName} numberOfLines={1}>{t(monkey.nameKey, lang)}</Text>
                    <Text style={styles.characterMeta}>{t(`royalPalace.class.${definition.palaceClass}`, lang)} · {t(definition.areaKey, lang)}</Text>
                    <Text style={palaceLocked || !owned ? styles.lockedText : styles.characterState} numberOfLines={2}>
                      {palaceLocked
                        ? t("royalPalace.levelRequired", lang, { level: definition.palaceUnlockLevel })
                        : !owned
                          ? t("royalPalace.monkeyNotOwned", lang)
                          : display.isVisible
                            ? t("royalPalace.visible", lang)
                            : t("royalPalace.hidden", lang)}
                    </Text>
                  </View>
                </SpringPressable>
                <SpringPressable
                  accessibilityState={{ disabled: palaceLocked || !owned }}
                  disabled={palaceLocked || !owned}
                  onPress={() => state.setRoyalCharacterVisibility(monkey.id, !display.isVisible)}
                  style={[styles.visibilityButton, display.isVisible ? styles.visibilityButtonActive : null]}
                >
                  <Text style={styles.visibilityText}>{display.isVisible ? t("royalPalace.hide", lang) : t("royalPalace.show", lang)}</Text>
                </SpringPressable>
              </View>;
            })}
          </View>

          <SkinManager
            lang={lang}
            palaceLevel={level}
            characterId={selectedDefinition.characterId}
            unlockLevel={selectedDefinition.palaceUnlockLevel}
            display={selectedDisplay}
            ownedMonkeys={state.unlockedProfileMonkeys}
            ownedSkins={state.ownedProfileSkins}
            fragments={state.festivalFragments}
            onSelect={state.selectRoyalCharacterSkin}
          />

          <UpgradeSection
            lang={lang}
            level={level}
            resources={state.resources}
            gems={state.gems}
            activeUpgrade={activePalaceUpgrade}
            definition={upgrade.definition}
            block={upgrade.block}
            onUpgrade={() => state.upgradeBuilding("royalPalace")}
            onRush={state.rushRoyalPalaceUpgrade}
          />
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function SkinManager({ lang, palaceLevel, characterId, unlockLevel, display, ownedMonkeys, ownedSkins, fragments, onSelect }: {
  lang: Lang;
  palaceLevel: number;
  characterId: ProfileMonkeyId;
  unlockLevel: number;
  display: RoyalCharacterDisplay | undefined;
  ownedMonkeys: readonly ProfileMonkeyId[];
  ownedSkins: readonly string[];
  fragments: Record<string, number | undefined>;
  onSelect: ReturnType<typeof useGameStore.getState>["selectRoyalCharacterSkin"];
}) {
  const monkey = getProfileMonkey(characterId);
  if (!monkey) return null;
  const characterOwned = ownedMonkeys.includes(characterId);
  const characterUnlocked = palaceLevel >= unlockLevel;
  return <View style={styles.skinSection}>
    <Text style={styles.sectionTitle}>{t("royalPalace.skins", lang)}</Text>
    <Text style={styles.skinSectionMeta}>{t(monkey.nameKey, lang)} · {t("royalPalace.oneAppearance", lang)}</Text>
    <View style={styles.skinGrid}>
      {skinsForMonkey(characterId).map((skin) => {
        const isDefault = skin.id === getDefaultSkinId(characterId);
        const owned = isDefault ? characterOwned : ownedSkins.includes(skin.id);
        const parentMissing = !characterOwned;
        const disabled = !characterUnlocked || parentMissing || !owned;
        const selected = (display?.selectedSkinId ?? getDefaultSkinId(characterId)) === skin.id;
        const appearance = getCosmeticAppearance(characterId, skin.id);
        const required = skin.catalogStatus === "festival" ? festivalFragmentRequirement(skin.id) : 0;
        const current = required > 0 ? Math.min(required, fragments[skin.id] ?? 0) : 0;
        return <SpringPressable
          key={skin.id}
          accessibilityState={{ disabled, selected }}
          disabled={disabled}
          onPress={() => onSelect(characterId, isDefault ? null : skin.id)}
          style={[styles.skinChoice, selected ? styles.skinChoiceSelected : null, disabled ? styles.lockedCard : null]}
        >
          <AssetImage assetKey={appearance.portraitAsset} style={styles.skinArt} fallback={<View />} hideFallbackOnLoad />
          <Text style={styles.skinName} numberOfLines={2}>{t(skin.nameKey, lang)}</Text>
          {required > 0 && !owned ? <View style={styles.fragmentRow}>
            <FestivalFragmentIcon size={13} />
            <Text style={styles.fragmentText}>{current}/{required}</Text>
          </View> : null}
          <Text style={selected ? styles.selectedText : disabled ? styles.lockedText : styles.ownedText} numberOfLines={2}>
            {selected
              ? t("royalPalace.activeAppearance", lang)
              : !characterUnlocked
                ? t("royalPalace.levelRequired", lang, { level: unlockLevel })
                : parentMissing
                  ? t("royalPalace.parentRequired", lang)
                  : owned
                    ? t("royalPalace.select", lang)
                    : t("royalPalace.skinNotOwned", lang)}
          </Text>
        </SpringPressable>;
      })}
    </View>
  </View>;
}

function PalacePreview({ level, displays }: { level: number; displays: readonly RoyalCharacterDisplay[] }) {
  const asset = royalPalaceAsset(level);
  return <View style={styles.preview}>
    <View style={styles.previewGlow} />
    <AssetImage assetKey={asset} style={styles.previewBuilding} fallback={<View />} />
    {displays.filter((display) => {
      const definition = ROYAL_PALACE_CHARACTERS.find((entry) => entry.characterId === display.characterId);
      return display.isVisible && definition != null && definition.palaceUnlockLevel <= level;
    }).map((display) => {
      const appearance = getCosmeticAppearance(display.characterId, display.selectedSkinId ?? getDefaultSkinId(display.characterId));
      const spot = ROYAL_PALACE_RESIDENT_SPOTS[display.displayPosition];
      const king = display.displayPosition === "goldenThrone";
      return <View key={display.characterId} style={[
        styles.previewResident,
        king ? styles.previewKing : null,
        { left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.size}%`, height: `${spot.size}%` }
      ]}>
        {king ? <View style={styles.previewKingGlow} /> : null}
        <AssetImage assetKey={appearance.villageAsset} style={styles.full} fallback={<View />} />
      </View>;
    })}
  </View>;
}

function UpgradeSection({ lang, level, resources, gems, activeUpgrade, definition, block, onUpgrade, onRush }: {
  lang: Lang;
  level: number;
  resources: Resources;
  gems: number;
  activeUpgrade: ReturnType<typeof useGameStore.getState>["activeWorkerLodgeUpgrade"];
  definition: ReturnType<typeof evaluateRoyalPalaceUpgrade>["definition"];
  block: ReturnType<typeof evaluateRoyalPalaceUpgrade>["block"];
  onUpgrade: () => void;
  onRush: () => boolean;
}) {
  const rush = evaluateRoyalPalaceRush(activeUpgrade, gems);
  const unlocks = definition
    ? ROYAL_PALACE_CHARACTERS.filter((entry) => entry.palaceUnlockLevel === definition.targetLevel)
    : [];
  const blockText = !definition ? t("royalPalace.maxLevel", lang)
    : block === "clan-level" ? t("royalPalace.needClanHall", lang, { level: definition.requiredClanHallLevel })
      : block === "resource" ? t("royalPalace.needResourcesShort", lang)
        : block === "upgrade-active" ? t("royalPalace.otherUpgradeActive", lang)
          : null;
  return <View style={styles.upgradeCard}>
    <Text style={styles.sectionTitle}>{t("royalPalace.upgrade", lang)}</Text>
    {activeUpgrade ? <>
      <Text style={styles.upgradeHeadline}>{t("royalPalace.upgrading", lang, { level: activeUpgrade.targetLevel })}</Text>
      <Text style={styles.upgradeMeta}>{formatDuration(Math.max(0, activeUpgrade.endsAt - Date.now()), lang)}</Text>
      <SpringPressable
        disabled={!rush.enabled}
        onPress={onRush}
        style={[styles.rushButton, !rush.enabled ? styles.lockedCard : null]}
      >
        <AssetImage assetKey="resourceJungleGem" style={styles.rushGem} fallback={<View />} />
        <Text style={styles.rushText}>{t("royalPalace.finishNow", lang, { amount: rush.cost })}</Text>
      </SpringPressable>
      {!rush.enabled && rush.block === "gems" ? <Text style={styles.blockText}>{t("royalPalace.needGems", lang, { amount: rush.cost })}</Text> : null}
    </> : definition ? <>
      <Text style={styles.upgradeHeadline}>
        {t("common.levelBadge", lang, { n: level })} → {t("common.levelBadge", lang, { n: definition.targetLevel })}
      </Text>
      <Text style={styles.upgradeMeta}>
        {t("royalPalace.unlocksCharacters", lang, { names: unlocks.map((entry) => t(getProfileMonkey(entry.characterId)?.nameKey ?? "b.royalPalace", lang)).join(", ") })}
      </Text>
      <View style={styles.costRow}>
        <Cost asset="resourceBanana" current={resources.bananas} amount={definition.cost.bananas} />
        <Cost asset="resourceWood" current={resources.wood} amount={definition.cost.wood} />
        <Cost asset="resourceStone" current={resources.stones} amount={definition.cost.stones} />
      </View>
      <Text style={styles.requirement}>{t("royalPalace.clanRequirement", lang, { level: definition.requiredClanHallLevel })} · {formatDuration(definition.durationMs, lang)}</Text>
      {blockText ? <Text style={styles.blockText}>{blockText}</Text> : null}
      <SpringPressable disabled={block != null} onPress={onUpgrade} style={[styles.upgradeButton, block ? styles.lockedCard : null]}>
        <Text style={styles.upgradeButtonText}>{t("upgrade.button", lang)}</Text>
      </SpringPressable>
    </> : <Text style={styles.upgradeMeta}>{blockText}</Text>}
  </View>;
}

function Cost({ asset, current, amount }: { asset: "resourceBanana" | "resourceWood" | "resourceStone"; current: number; amount: number }) {
  return <View style={styles.cost}><AssetImage assetKey={asset} style={styles.costIcon} fallback={<View />} /><Text style={[styles.costText, current < amount ? styles.costMissing : null]}>{amount}</Text></View>;
}

function formatDuration(ms: number, lang: Lang) {
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return `${minutes} ${lang === "tr" ? "dk" : "min"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} ${lang === "tr" ? "sa" : "hr"}`;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,12,7,0.84)", paddingHorizontal: 12 },
  card: { width: "100%", maxWidth: 430, maxHeight: "100%", overflow: "hidden", borderRadius: 22, borderWidth: 2, borderColor: "#d7ae55", backgroundColor: "#172318" },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "rgba(226,177,90,0.24)", backgroundColor: "#21351f" },
  headerCopy: { flex: 1, minWidth: 0 }, title: { color: "#fff0bd", fontSize: 21, fontFamily: theme.fonts.heavy }, levelName: { color: "#d2c293", fontSize: 12, fontFamily: theme.fonts.bold },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, closeText: { color: "#fff0bd", fontSize: 28, fontFamily: theme.fonts.heavy },
  content: { padding: 14, paddingBottom: 30 }, sectionTitle: { marginTop: 13, marginBottom: 7, color: "#f2dfaa", fontSize: 15, fontFamily: theme.fonts.heavy },
  description: { color: "#d8ccb0", fontSize: 12, lineHeight: 17, fontFamily: theme.fonts.bold, textAlign: "center" },
  preview: { height: 184, alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 9, borderRadius: 16, backgroundColor: "#294a2b" },
  previewGlow: { position: "absolute", width: 195, height: 96, borderRadius: 90, backgroundColor: "rgba(255,210,84,0.14)" }, previewBuilding: { width: "88%", height: "88%" }, previewResident: { position: "absolute", zIndex: 4 }, previewKing: { zIndex: 5 }, previewKingGlow: { position: "absolute", left: "10%", top: "17%", width: "80%", height: "68%", borderRadius: 999, backgroundColor: "rgba(255,215,92,0.24)" }, full: { width: "100%", height: "100%" },
  prestigeCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,218,109,0.36)", backgroundColor: "rgba(93,67,22,0.45)", paddingHorizontal: 13, paddingVertical: 8 }, prestigeLabel: { color: "#f5dda0", fontSize: 13, fontFamily: theme.fonts.heavy }, prestigeValue: { color: "#ffe16f", fontSize: 20, fontFamily: theme.fonts.heavy },
  characterList: { gap: 7 }, characterCard: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 13, borderWidth: 1, borderColor: "rgba(226,177,90,0.28)", backgroundColor: "rgba(34,50,31,0.92)", padding: 7 }, characterCardSelected: { borderColor: "#e7bd58", backgroundColor: "rgba(68,76,34,0.96)" }, characterSelect: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 9 }, characterArt: { width: 54, height: 54 }, characterCopy: { flex: 1, minWidth: 0 }, characterName: { color: "#f5e6bb", fontSize: 12, fontFamily: theme.fonts.heavy }, characterMeta: { color: "#c7b884", fontSize: 9, fontFamily: theme.fonts.bold }, characterState: { marginTop: 2, color: "#aee39d", fontSize: 9, fontFamily: theme.fonts.bold }, lockedText: { color: "#e0a38a", fontSize: 8.5, lineHeight: 11, fontFamily: theme.fonts.bold, textAlign: "center" },
  visibilityButton: { width: 66, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#80663a", backgroundColor: "#3a321f", paddingHorizontal: 5 }, visibilityButtonActive: { borderColor: "#75ad55", backgroundColor: "#315d2a" }, visibilityText: { color: "#f2e4bd", fontSize: 9, fontFamily: theme.fonts.heavy, textAlign: "center" },
  lockedCard: { opacity: 0.48 }, skinSection: { marginTop: 4 }, skinSectionMeta: { color: "#bfb18c", fontSize: 10, fontFamily: theme.fonts.bold }, skinGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 7 }, skinChoice: { width: "31.5%", minHeight: 119, alignItems: "center", borderRadius: 11, borderWidth: 1, borderColor: "rgba(226,177,90,0.28)", backgroundColor: "rgba(12,19,12,0.62)", padding: 6 }, skinChoiceSelected: { borderWidth: 2, borderColor: "#e4be55", backgroundColor: "rgba(81,67,27,0.86)" }, skinArt: { width: 59, height: 59 }, skinName: { minHeight: 23, color: "#e9d8ad", fontSize: 8.5, lineHeight: 11, fontFamily: theme.fonts.heavy, textAlign: "center" }, fragmentRow: { flexDirection: "row", alignItems: "center", gap: 3 }, fragmentText: { color: "#dfc7e8", fontSize: 8, fontFamily: theme.fonts.bold }, selectedText: { color: "#ffe072", fontSize: 8.5, fontFamily: theme.fonts.heavy, textAlign: "center" }, ownedText: { color: "#aee39d", fontSize: 8.5, fontFamily: theme.fonts.heavy, textAlign: "center" },
  upgradeCard: { marginTop: 14, borderRadius: 15, borderWidth: 1, borderColor: "rgba(226,177,90,0.32)", backgroundColor: "rgba(40,42,25,0.82)", padding: 11 }, upgradeHeadline: { color: "#ffe2a0", fontSize: 14, fontFamily: theme.fonts.heavy }, upgradeMeta: { marginTop: 3, color: "#c9ba91", fontSize: 11, lineHeight: 15, fontFamily: theme.fonts.bold }, costRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 9 }, cost: { minWidth: 72, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 9, backgroundColor: "rgba(8,13,8,0.55)", paddingHorizontal: 7, paddingVertical: 5 }, costIcon: { width: 20, height: 20 }, costText: { color: "#f0dda9", fontSize: 11, fontFamily: theme.fonts.heavy }, costMissing: { color: "#ef9b86" }, requirement: { marginTop: 8, color: "#bfb18c", fontSize: 10, fontFamily: theme.fonts.bold }, blockText: { marginTop: 6, color: "#ef9b86", fontSize: 10, fontFamily: theme.fonts.heavy }, upgradeButton: { minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: 10, borderRadius: 12, backgroundColor: "#836226" }, upgradeButtonText: { color: "#fff0bd", fontSize: 14, fontFamily: theme.fonts.heavy },
  rushButton: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: "#7ed8ef", backgroundColor: "#1f5c6a" }, rushGem: { width: 22, height: 22 }, rushText: { color: "#e8fbff", fontSize: 12, fontFamily: theme.fonts.heavy }
});
