import { StyleSheet, Text, View } from "react-native";
import { WORKER_ASSETS } from "../../game/assets/workerAssets";
import { t, type Lang } from "../../game/i18n";
import type {
  IdleWorker,
  WorkerClass,
  WorkerCountSelection,
  WorkerMissionTier
} from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";

export function WorkerDispatchSelector({
  workerClasses,
  availableWorkers,
  selection,
  maxWorkers,
  expectedReward,
  durationLabel,
  risk,
  resourceName,
  lang,
  onChange
}: {
  workerClasses: readonly WorkerClass[];
  availableWorkers: readonly IdleWorker[];
  selection: WorkerCountSelection;
  maxWorkers: number;
  expectedReward: number;
  durationLabel: string;
  risk: WorkerMissionTier;
  resourceName: string;
  lang: Lang;
  onChange: (selection: WorkerCountSelection) => void;
}) {
  const selectedTotal = workerClasses.reduce(
    (sum, workerClass) => sum + (selection[workerClass] ?? 0),
    0
  );

  function change(workerClass: WorkerClass, delta: number) {
    const available = availableWorkers.filter(
      (worker) => worker.workerClass === workerClass
    ).length;
    const current = selection[workerClass] ?? 0;
    const next = Math.max(0, Math.min(available, current + delta));
    if (delta > 0 && selectedTotal >= maxWorkers) return;
    onChange({ ...selection, [workerClass]: next });
  }

  return (
    <View style={styles.wrap}>
      {workerClasses.map((workerClass, index) => {
        const available = availableWorkers.filter(
          (worker) => worker.workerClass === workerClass
        ).length;
        const selected = selection[workerClass] ?? 0;
        return (
          <View key={workerClass} style={styles.row}>
            <AssetImage
              assetKey={WORKER_ASSETS[workerClass]}
              style={styles.art}
              fallback={<View style={styles.artFallback} />}
              hideFallbackOnLoad
            />
            <View style={styles.copy}>
              <Text style={styles.name} numberOfLines={2}>
                {t(`worker.${workerClass}.name`, lang)}
              </Text>
              <Text style={styles.available}>
                {t("workerDispatch.tierAvailable", lang, {
                  tier: index + 1,
                  n: available
                })}
              </Text>
              <Text style={styles.remaining}>
                {t("workerDispatch.remaining", lang, { n: available - selected })}
              </Text>
            </View>
            <CountButton
              label="−"
              disabled={selected <= 0}
              onPress={() => change(workerClass, -1)}
            />
            <Text style={styles.count}>{selected}</Text>
            <CountButton
              label="+"
              disabled={selected >= available || selectedTotal >= maxWorkers}
              onPress={() => change(workerClass, 1)}
            />
          </View>
        );
      })}
      <View style={styles.summary}>
        <Summary label={t("workerDispatch.total", lang)} value={`${selectedTotal}/${maxWorkers}`} />
        <Summary
          label={t("workerDispatch.expected", lang)}
          value={`${expectedReward} ${resourceName}`}
        />
        <Summary label={t("workerDispatch.duration", lang)} value={durationLabel} />
        <Summary
          label={t("workerDispatch.risk", lang)}
          value={t(`workerDispatch.risk.${risk}`, lang)}
          danger={risk === "dangerous"}
        />
      </View>
      <Text style={styles.warning}>{t("workerDispatch.consumedWarning", lang)}</Text>
    </View>
  );
}

function CountButton({
  label,
  disabled,
  onPress
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={3}
      onPress={onPress}
      style={[styles.countButton, disabled && styles.disabled]}
    >
      <Text style={styles.countButtonText}>{label}</Text>
    </SpringPressable>
  );
}

function Summary({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, danger && styles.summaryDanger]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  row: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(215,171,89,0.28)",
    backgroundColor: "rgba(23,42,22,0.92)",
    paddingHorizontal: 7
  },
  art: { width: 54, height: 54 },
  artFallback: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#31432c" },
  copy: { flex: 1, minWidth: 0, paddingHorizontal: 5 },
  name: { color: "#fff0bd", fontSize: 11, lineHeight: 13, fontFamily: theme.fonts.heavy },
  available: { color: "#d9c995", fontSize: 9, fontFamily: theme.fonts.bold },
  remaining: { color: "#aeb995", fontSize: 8.5, fontFamily: theme.fonts.regular },
  countButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(226,192,130,0.55)",
    backgroundColor: "#76502a"
  },
  disabled: { opacity: 0.32 },
  countButtonText: { color: "#fff3c9", fontSize: 22, lineHeight: 24, fontFamily: theme.fonts.heavy },
  count: { width: 28, color: "#ffe5a0", fontSize: 17, textAlign: "center", fontFamily: theme.fonts.heavy },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  summaryCell: { width: "48%", flexGrow: 1, borderRadius: 10, backgroundColor: "rgba(71,52,25,0.55)", padding: 8 },
  summaryLabel: { color: "#b9ad88", fontSize: 8.5, fontFamily: theme.fonts.bold },
  summaryValue: { color: "#ffe3a0", fontSize: 12, fontFamily: theme.fonts.heavy },
  summaryDanger: { color: "#f1a18e" },
  warning: { color: "#e7a18e", fontSize: 10, textAlign: "center", fontFamily: theme.fonts.bold }
});
