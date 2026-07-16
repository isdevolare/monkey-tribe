import { Modal, StyleSheet, Text, View } from "react-native";
import { playSound } from "../../game/audio/soundManager";
import {
  DAILY_REWARDS,
  DAILY_FIRST_WEEK_GEMS,
  DAILY_REPEAT_WEEK_GEMS,
  nextDailyRewardDay,
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
  const unlockedMonkeys = useGameStore((state) => state.unlockedProfileMonkeys);
  const scoutOwned = unlockedMonkeys.includes("profile_monkey_scout");

  const claimedToday = lastClaim === todayKey();
  // The day highlighted today: the one just claimed, or the next in the streak.
  const activeDay = claimedToday
    ? streak
    : nextDailyRewardDay(streak, lastClaim, todayKey()) ?? 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("daily.title", lang)}
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={theme.maxFontScale}>
            {scoutOwned
              ? t("daily.subtitleRepeat", lang, { amount: DAILY_REPEAT_WEEK_GEMS })
              : t("daily.subtitleScout", lang, { amount: DAILY_FIRST_WEEK_GEMS })}
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
              return <DayCell key={day} day={day} reward={reward} status={status} lang={lang} scoutOwned={scoutOwned} />;
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
  lang,
  scoutOwned
}: {
  day: number;
  reward: DailyReward;
  status: DayStatus;
  lang: Lang;
  scoutOwned: boolean;
}) {
  const gemReward = reward.kind === "gems" || scoutOwned;
  const amount = reward.kind === "gems" ? reward.amount : reward.duplicateGems;
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
        assetKey={gemReward ? "resourceJungleGem" : "unitScout"}
        style={styles.cellIcon}
        fallback={<View style={styles.cellIconFallback} />}
      />
      <Text style={styles.cellAmount} numberOfLines={2} adjustsFontSizeToFit maxFontSizeMultiplier={theme.maxFontScale}>
        {gemReward ? amount : t("daily.scout", lang)}
      </Text>
      {status === "done" ? (
        <View style={styles.doneOverlay} pointerEvents="none">
          <Text style={styles.doneCheck} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("daily.done", lang)}
          </Text>
        </View>
      ) : null}
    </View>
  );
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
  // Percentage cells keep all seven gem rewards inside narrow phone layouts.
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
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  doneOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20, 40, 16, 0.5)"
  },
  doneCheck: {
    color: "#c6ee89",
    fontSize: 10,
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
