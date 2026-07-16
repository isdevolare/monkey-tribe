import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { playSound } from "../../game/audio/soundManager";
import {
  QUESTS,
  isQuestComplete,
  questProgressValue,
  resolveQuestReward,
  type QuestDef,
  type QuestReward
} from "../../game/config/quests";
import { todayKey } from "../../game/config/dailyRewards";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";

type QuestModalProps = {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
};

export function QuestModal({ visible, lang, onClose }: QuestModalProps) {
  const savedProgress = useGameStore((state) => state.questProgress);
  const savedClaimed = useGameStore((state) => state.questsClaimed);
  const questDayKey = useGameStore((state) => state.questDayKey);
  const hallLevel = useGameStore((state) => state.buildings.find((building) => building.type === "clanHall")?.level ?? 1);
  const claimQuest = useGameStore((state) => state.claimQuest);
  const currentDay = todayKey();
  const progress = questDayKey === currentDay ? savedProgress : {};
  const claimed = questDayKey === currentDay ? savedClaimed : [];

  // Claimable first, then in-progress, then done — keeps the useful ones on top.
  const ordered = [...QUESTS].sort((a, b) => rank(a) - rank(b));
  function rank(quest: QuestDef) {
    const done = isQuestComplete(progress, quest);
    const isClaimed = claimed.includes(quest.id);
    if (done && !isClaimed) return 0;
    if (!done) return 1;
    return 2;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("quests.title", lang)}
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {ordered.map((quest) => (
              <QuestRow
                key={quest.id}
                quest={quest}
                lang={lang}
                current={questProgressValue(progress, quest)}
                done={isQuestComplete(progress, quest)}
                claimed={claimed.includes(quest.id)}
                reward={resolveQuestReward(quest, hallLevel)}
                onClaim={() => {
                  // soundBridge plays the reward jingle when the claim lands.
                  claimQuest(quest.id);
                }}
              />
            ))}
          </ScrollView>

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

function QuestRow({
  quest,
  lang,
  current,
  done,
  claimed,
  reward,
  onClaim
}: {
  quest: QuestDef;
  lang: Lang;
  current: number;
  done: boolean;
  claimed: boolean;
  reward: QuestReward;
  onClaim: () => void;
}) {
  const pct = Math.round((current / quest.goal) * 100);

  return (
    <View style={[styles.row, done && !claimed ? styles.rowReady : null]}>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
          {t(`quest.${quest.id}`, lang)}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
          <Text style={styles.trackText} maxFontSizeMultiplier={theme.maxFontScale}>
            {current}/{quest.goal}
          </Text>
        </View>
        <RewardChips reward={reward} />
      </View>

      {claimed ? (
        <View style={styles.doneTag}>
          <Text style={styles.doneText} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("quests.done", lang)}
          </Text>
        </View>
      ) : (
        <SpringPressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !done }}
          disabled={!done}
          sound={null}
          onPress={onClaim}
          style={[styles.claim, done ? styles.claimReady : styles.claimLocked]}
        >
          <Text style={styles.claimText} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("quests.claim", lang)}
          </Text>
        </SpringPressable>
      )}
    </View>
  );
}

function RewardChips({ reward }: { reward: QuestReward }) {
  const entries = [
    { key: "b", asset: "resourceBanana" as const, amount: reward.bananas },
    { key: "s", asset: "resourceStone" as const, amount: reward.stones },
    { key: "w", asset: "resourceWood" as const, amount: reward.wood },
    { key: "g", asset: "resourceJungleGem" as const, amount: reward.gems }
  ].filter((entry) => (entry.amount ?? 0) > 0);

  return (
    <View style={styles.rewardRow}>
      {entries.map((entry) => (
        <View key={entry.key} style={styles.rewardChip}>
          <AssetImage
            assetKey={entry.asset}
            style={styles.rewardIcon}
            fallback={<View style={styles.rewardIconFallback} />}
          />
          <Text style={styles.rewardText} maxFontSizeMultiplier={theme.maxFontScale}>
            {entry.amount}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 23, 15, 0.68)",
    padding: theme.spacing.xl
  },
  card: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "78%",
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
  title: {
    color: theme.colors.paper,
    fontSize: theme.type.h1,
    fontFamily: theme.fonts.heavy,
    textAlign: "center",
    marginBottom: theme.spacing.md
  },
  list: {
    flexGrow: 0
  },
  listContent: {
    gap: theme.spacing.sm
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.22)",
    backgroundColor: "rgba(40, 34, 20, 0.7)",
    padding: theme.spacing.sm
  },
  rowReady: {
    borderColor: "rgba(198, 238, 137, 0.75)",
    backgroundColor: "rgba(54, 74, 34, 0.75)"
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 5
  },
  rowLabel: {
    color: theme.colors.paper,
    fontSize: theme.type.body,
    fontFamily: theme.fonts.heavy
  },
  track: {
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    overflow: "hidden",
    justifyContent: "center"
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    borderRadius: 8,
    backgroundColor: "#5b8f3d"
  },
  trackText: {
    alignSelf: "center",
    color: theme.colors.paper,
    fontSize: theme.type.tiny,
    fontFamily: theme.fonts.heavy,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1
  },
  rewardRow: {
    flexDirection: "row",
    gap: 8
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  rewardIcon: {
    width: 15,
    height: 15
  },
  rewardIconFallback: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "rgba(255, 224, 151, 0.3)"
  },
  rewardText: {
    color: "#ffe9ad",
    fontSize: theme.type.label,
    fontFamily: theme.fonts.heavy
  },
  claim: {
    minWidth: 64,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: theme.spacing.sm
  },
  claimReady: {
    borderColor: "rgba(198, 238, 137, 0.6)",
    backgroundColor: "#5b8f3d"
  },
  claimLocked: {
    borderColor: "rgba(255, 224, 151, 0.14)",
    backgroundColor: "rgba(28, 32, 20, 0.85)",
    opacity: 0.5
  },
  claimText: {
    color: theme.colors.paper,
    fontSize: theme.type.body,
    fontFamily: theme.fonts.heavy
  },
  doneTag: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(91, 143, 61, 0.5)"
  },
  doneText: {
    color: "#c6ee89",
    fontSize: theme.type.h2,
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
