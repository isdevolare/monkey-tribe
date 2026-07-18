export type ExternalLinkingApi = {
  canOpenURL: (url: string) => Promise<boolean>;
  openURL: (url: string) => Promise<unknown>;
};

/** Opens an external destination without allowing platform/linking failures to escape. */
export async function tryOpenExternalUrl(
  linking: ExternalLinkingApi,
  url: string
) {
  try {
    if (!(await linking.canOpenURL(url))) return false;
    await linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
