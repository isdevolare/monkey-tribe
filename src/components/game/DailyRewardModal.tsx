import { Modal, StyleSheet, Text, View } from "react-native";
import { playSound } from "../../game/audio/soundManager";
import {
  DAILY_REWARDS,
  dayDiff,
  todayKey,
  type DailyReward
} from "../../game/config/dailyRewards";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { WoodButton } from "./WoodButton";

type DailyRewardModalProps = {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
};

export function DailyRewardModal({ visible, lang, onClose }: DailyRewardModalProps) {
  const streak = useGameStore((state) => state.dailyStreak);
  const lastClaim = useGameStore((state) => state.dailyLastClaim);
  const claimDaily = useGameStore((state) => state.claimDaily);

  const claimedToday = lastClaim === todayKey();
  const consecutive = lastClaim != null && dayDiff(lastClaim, todayKey()) === 1;
  // The day highlighted today: the one just claimed, or the next in the streak.
  const activeDay = claimedToday ? streak : consecutive ? (streak % DAILY_REWARDS.length) + 1 : 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("daily.title", lang)}
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("daily.subtitle", lang)}
          </Text>

          <View style={styles.grid}>
            {DAILY_REWARDS.map((reward, index) => {
              const day = index + 1;
              const status: DayStatus =
                day < activeDay
                  ? "done"
                  : day === activeDay
                    ? claimedToday
                      ? "done"
                      : "today"
                    : "locked";
              return <DayCell key={day} day={day} reward={reward} status={status} lang={lang} />;
            })}
          </View>

          <View style={styles.action}>
            {claimedToday ? (
              <Text style={styles.comeback} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("daily.comeback", lang)}
              </Text>
            ) : (
              <WoodButton
                label={t("daily.claim", lang)}
                onPress={() => {
                  // soundBridge plays the reward jingle when the claim lands.
                  claimDaily();
                }}
                primary
              />
            )}
          </View>

          <Text
            style={styles.close}
            onPress={() => {
              playSound("close");
              onClose();
            }}
            maxFontSizeMultiplier={theme.maxFontScale}
          >
            {t("settings.close", lang)}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

type DayStatus = "done" | "today" | "locked";

function DayCell({
  day,
  reward,
  status,
  lang
}: {
  day: number;
  reward: DailyReward;
  status: DayStatus;
  lang: Lang;
}) {
  const asset = rewardAsset(reward);
  const amount = rewardAmount(reward);

  return (
    <View
      style={[
        styles.cell,
        status === "today" ? styles.cellToday : null,
        status === "done" ? styles.cellDone : null
      ]}
    >
      <Text style={styles.cellDay} maxFontSizeMultiplier={theme.maxFontScale}>
        {t("daily.day", lang, { n: day })}
      </Text>
      <AssetImage
        assetKey={asset}
        style={styles.cellIcon}
        fallback={<View style={styles.cellIconFallback} />}
      />
      <Text style={styles.cellAmount} maxFontSizeMultiplier={theme.maxFontScale}>
        {amount}
      </Text>
      {status === "done" ? (
        <View style={styles.doneOverlay} pointerEvents="none">
          <Text style={styles.doneCheck} maxFontSizeMultiplier={theme.maxFontScale}>
            ✓
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function rewardAsset(reward: DailyReward) {
  if (reward.gems) return "resourceJungleGem" as const;
  if (reward.bananas) return "resourceBanana" as const;
  if (reward.wood) return "resourceWood" as const;
  return "resourceStone" as const;
}

function rewardAmount(reward: DailyReward) {
  return reward.gems ?? reward.bananas ?? reward.wood ?? reward.stones ?? 0;
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 23, 15, 0.72)",
    padding: theme.spacing.xl
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(226, 177, 90, 0.5)",
    backgroundColor: "rgba(17, 20, 14, 0.96)",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14
  },
  title: {
    color: theme.colors.paper,
    fontSize: theme.type.h1,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    color: "#d8ccb0",
    fontSize: theme.type.body,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: theme.spacing.lg
  },
  // Percentage cells lock the grid to 4 per row (4+3) on every width, so
  // the modal never grows past the screen the way fixed 74px cells did
  // when they wrapped 3-per-row on narrow devices.
  cell: {
    width: "22.5%",
    minHeight: 84,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.22)",
    backgroundColor: "rgba(40, 34, 20, 0.7)",
    paddingVertical: 7,
    paddingHorizontal: 2,
    overflow: "hidden"
  },
  cellToday: {
    borderColor: "rgba(255, 210, 106, 0.9)",
    backgroundColor: "rgba(74, 56, 28, 0.9)",
    shadowColor: "#ffd66e",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6
  },
  cellDone: {
    opacity: 0.7
  },
  cellDay: {
    color: "#e2b15a",
    fontSize: theme.type.tiny,
    fontFamily: theme.fonts.heavy
  },
  cellIcon: {
    width: 30,
    height: 30,
    marginVertical: 4
  },
  cellIconFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginVertical: 4,
    backgroundColor: "rgba(255, 224, 151, 0.3)"
  },
  cellAmount: {
    color: "#ffe9ad",
    fontSize: theme.type.body,
    fontFamily: theme.fonts.heavy
  },
  doneOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20, 40, 16, 0.5)"
  },
  doneCheck: {
    color: "#c6ee89",
    fontSize: 26,
    fontFamily: theme.fonts.heavy
  },
  action: {
    width: "100%",
    maxWidth: 240,
    minHeight: 54,
    justifyContent: "center",
    marginTop: theme.spacing.lg
  },
  comeback: {
    color: "#c6ee89",
    fontSize: theme.type.body,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  close: {
    marginTop: theme.spacing.md,
    color: "#d8ccb0",
    fontSize: theme.type.body,
    fontFamily: theme.fonts.heavy,
    textAlign: "center",
    paddingVertical: theme.spacing.xs
  }
});
