import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type PerformanceMode = "balanced" | "highPerformance";

const NOTIFICATIONS_KEY = "monkey-tribe:notifications-enabled";
const HAPTICS_KEY = "monkey-tribe:haptics-enabled";
const PERFORMANCE_KEY = "monkey-tribe:performance-mode";

type AppSettingsState = {
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  performanceMode: PerformanceMode;
  setNotificationsEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
};

export const useAppSettingsStore = create<AppSettingsState>((set) => ({
  notificationsEnabled: true,
  hapticsEnabled: true,
  performanceMode: "balanced",
  setNotificationsEnabled: (notificationsEnabled) => {
    set({ notificationsEnabled });
    void AsyncStorage.setItem(NOTIFICATIONS_KEY, notificationsEnabled ? "true" : "false");
  },
  setHapticsEnabled: (hapticsEnabled) => {
    set({ hapticsEnabled });
    void AsyncStorage.setItem(HAPTICS_KEY, hapticsEnabled ? "true" : "false");
  },
  setPerformanceMode: (performanceMode) => {
    set({ performanceMode });
    void AsyncStorage.setItem(PERFORMANCE_KEY, performanceMode);
  }
}));

void AsyncStorage.multiGet([NOTIFICATIONS_KEY, HAPTICS_KEY, PERFORMANCE_KEY])
  .then((entries) => {
    const values = new Map(entries);
    const performanceMode = values.get(PERFORMANCE_KEY);
    useAppSettingsStore.setState({
      notificationsEnabled: values.get(NOTIFICATIONS_KEY) !== "false",
      hapticsEnabled: values.get(HAPTICS_KEY) !== "false",
      performanceMode: performanceMode === "highPerformance" ? "highPerformance" : "balanced"
    });
  })
  .catch(() => undefined);
