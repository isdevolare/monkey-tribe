import { describe, expect, it, vi } from "vitest";
import { PRIVACY_URL } from "./config/legal";
import { tryOpenExternalUrl, type ExternalLinkingApi } from "./externalLinks";

function linkingApi(canOpen = true): ExternalLinkingApi {
  return {
    canOpenURL: vi.fn().mockResolvedValue(canOpen),
    openURL: vi.fn().mockResolvedValue(undefined)
  };
}

describe("safe external links", () => {
  it("opens a supported URL", async () => {
    const linking = linkingApi();
    await expect(tryOpenExternalUrl(linking, PRIVACY_URL)).resolves.toBe(true);
    expect(linking.openURL).toHaveBeenCalledOnce();
  });

  it("does not call openURL for an unsupported destination", async () => {
    const linking = linkingApi(false);
    await expect(tryOpenExternalUrl(linking, "invalid://privacy")).resolves.toBe(false);
    expect(linking.openURL).not.toHaveBeenCalled();
  });

  it("contains canOpenURL and openURL failures", async () => {
    const cannotCheck: ExternalLinkingApi = {
      canOpenURL: vi.fn().mockRejectedValue(new Error("unavailable")),
      openURL: vi.fn()
    };
    await expect(tryOpenExternalUrl(cannotCheck, "https://example.com")).resolves.toBe(false);

    const cannotOpen: ExternalLinkingApi = {
      canOpenURL: vi.fn().mockResolvedValue(true),
      openURL: vi.fn().mockRejectedValue(new Error("failed"))
    };
    await expect(tryOpenExternalUrl(cannotOpen, "https://example.com")).resolves.toBe(false);
  });
});
