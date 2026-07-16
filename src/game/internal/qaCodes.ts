import { persistVillageNow, useGameStore } from "../state/gameStore";

// The explicit environment opt-in is accepted only by a development binary;
// release/App Store binaries cannot enable the QA path accidentally.
export const QA_CODES_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_ENABLE_QA_CODES === "true";

const QA_REDEMPTION_ID = "internal-qa-gems-5000-v1";
const QA_GEM_REWARD = 5_000;
// Kept split so the usable token is not present as a literal in production bundles.
const QA_GEM_CODE = ["MONKEY", "TEST", "5000"].join("");

export type QaRedemptionResult = "success" | "invalid" | "used" | "disabled";

export async function redeemQaGemCode(rawCode: string): Promise<QaRedemptionResult> {
  if (!QA_CODES_ENABLED) {
    return "disabled";
  }

  if (rawCode.trim().toUpperCase() !== QA_GEM_CODE) {
    return "invalid";
  }

  const state = useGameStore.getState();
  if (state.redeemedQaCodes.includes(QA_REDEMPTION_ID)) {
    return "used";
  }

  useGameStore.setState({
    gems: state.gems + QA_GEM_REWARD,
    redeemedQaCodes: [...state.redeemedQaCodes, QA_REDEMPTION_ID]
  });
  await persistVillageNow();
  return "success";
}
