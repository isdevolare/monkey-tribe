import { Modal, StyleSheet, Text, View } from "react-native";
import { playSound } from "../../game/audio/soundManager";
import { t } from "../../game/i18n";
import type { Lang, OfflineReport } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { Confetti } from "./Vfx";
import { WoodButton } from "./WoodButton";

type OfflineModalProps = {
  report: OfflineReport | null;
  lang: Lang;
  onCollect: () => void;
};

function formatAway(durationMs: number, lang: Lang) {
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(t("time.hours", lang, { n: hours }));
  }
  if (minutes > 0 || hours === 0) {
    parts.push(t("time.minutes", lang, { n: minutes }));
  }
  return parts.join(" ");
}

export function OfflineModal({ report, lang, onCollect }: OfflineModalProps) {
  const visible = report != null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCollect}>
      <View style={styles.scrim}>
        {report ? (
          <View style={styles.card}>
            <AssetImage
              assetKey="uiPanelDark"
              resizeMode="stretch"
              style={styles.cardTexture}
              fallback={<View style={styles.cardTextureFallback} />}
            />

            <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("offline.title", lang)}
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("offline.subtitle", lang)}
            </Text>
            <View style={styles.awayPill}>
              <Text style={styles.awayText} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("offline.away", lang, { time: formatAway(report.durationMs, lang) })}
              </Text>
            </View>

            <View style={styles.rewards}>
              <Reward assetKey="resourceBanana" amount={report.bananas} />
              <Reward assetKey="resourceStone" amount={report.stones} />
              <Reward assetKey="resourceWood" amount={report.wood} />
            </View>

            <View style={styles.action}>
              <WoodButton
                label={t("offline.collect", lang)}
                onPress={() => {
                  // Offline earnings are already banked by hydrate; this is
                  // the player acknowledging the windfall — reward jingle.
                  playSound("reward");
                  onCollect();
                }}
                primary
              />
            </View>
          </View>
        ) : null}

        {report ? <Confetti width={360} height={520} count={22} /> : null}
      </View>
    </Modal>
  );
}

function Reward({
  assetKey,
  amount
}: {
  assetKey: "resourceBanana" | "resourceStone" | "resourceWood";
  amount: number;
}) {
  if (amount <= 0) {
    return null;
  }
  return (
    <View style={styles.reward}>
      <AssetImage
        assetKey={assetKey}
        style={styles.rewardIcon}
        fallback={<View style={styles.rewardIconFallback} />}
      />
      <Text style={styles.rewardText} maxFontSizeMultiplier={theme.maxFontScale}>
        +{amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 23, 15, 0.72)",
    padding: theme.spacing.xl,
    overflow: "hidden"
  },
  card: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(226, 177, 90, 0.5)",
    backgroundColor: "rgba(17, 20, 14, 0.96)",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14
  },
  cardTexture: {
    ...StyleSheet.absoluteFillObject
  },
  cardTextureFallback: {
    flex: 1,
    backgroundColor: "rgba(17, 20, 14, 0.96)"
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
  awayPill: {
    marginTop: theme.spacing.md,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.45)",
    backgroundColor: "rgba(14, 12, 7, 0.8)",
    paddingHorizontal: 14,
    paddingVertical: 5
  },
  awayText: {
    color: "#ffe9ad",
    fontSize: theme.type.label,
    fontFamily: theme.fonts.heavy
  },
  rewards: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg
  },
  reward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.32)",
    backgroundColor: "rgba(40, 34, 20, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  rewardIcon: {
    width: 26,
    height: 26
  },
  rewardIconFallback: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 224, 151, 0.3)"
  },
  rewardText: {
    color: "#ffe9ad",
    fontSize: theme.type.h2,
    fontFamily: theme.fonts.heavy
  },
  action: {
    width: "100%",
    maxWidth: 240,
    marginTop: theme.spacing.lg
  }
});
