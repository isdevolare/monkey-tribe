import AsyncStorage from "@react-native-async-storage/async-storage";

export const TUTORIAL_SEEN_KEY = "monkey-tribe:tutorial-seen:v2";

export function markTutorialForReplay() {
  return AsyncStorage.removeItem(TUTORIAL_SEEN_KEY);
}
