import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

export const SUPPORT_EMAIL = "quickmoodigital@gmail.com";
export const PRIVACY_URL = "https://quickmoodigital.com/privacy-policy";
export const TERMS_URL = "https://quickmoodigital.com/terms-of-use";

export function appVersion() {
  return Constants.expoConfig?.version ?? "1.0.0";
}

export function appBuildNumber() {
  if (Platform.OS === "ios") {
    return Constants.expoConfig?.ios?.buildNumber ?? "1";
  }
  return String(Constants.expoConfig?.android?.versionCode ?? 1);
}

export function safeDeviceModel() {
  return Device.modelName ?? Device.deviceType?.toString() ?? "unknown";
}

export function safePlatformLabel() {
  const version = Device.osVersion ?? String(Platform.Version ?? "");
  return `${Platform.OS}${version ? ` ${version}` : ""}`;
}
