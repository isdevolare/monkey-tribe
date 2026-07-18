import { describe, expect, it } from "vitest";
import {
  LEGAL_SITE_ORIGIN,
  PRIVACY_URL,
  SUPPORT_EMAIL,
  SUPPORT_URL,
  TERMS_URL
} from "./legal";

describe("legal links", () => {
  it("uses the Monkey Tribe production site for every public page", () => {
    expect(LEGAL_SITE_ORIGIN).toBe("https://monkey-tribe.vercel.app");
    expect(PRIVACY_URL).toBe("https://monkey-tribe.vercel.app/privacy");
    expect(SUPPORT_URL).toBe("https://monkey-tribe.vercel.app/support");
    expect(TERMS_URL).toBe("https://monkey-tribe.vercel.app/terms");
  });

  it("keeps the repository support address centralized", () => {
    expect(SUPPORT_EMAIL).toBe("quickmoodigital@gmail.com");
  });
});
