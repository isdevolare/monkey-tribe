import type { Resources } from "../types/game";

export const RESOURCE_KEYS = ["bananas", "stones", "wood"] as const;

export type CappedResourceGrant = {
  resources: Resources;
  requested: Resources;
  received: Resources;
  discarded: Resources;
  clipped: boolean;
};

const EMPTY_RESOURCES: Resources = { bananas: 0, stones: 0, wood: 0 };

function safeStoredAmount(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function safeGain(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * The single entry point for adding normal resources to the main village
 * stockpile. Existing overflow is preserved, but it never creates headroom:
 * no further resource is received until spending brings that resource below
 * the current Clan Hall cap.
 */
export function addResourcesCapped(
  current: Resources,
  delta: Partial<Resources>,
  capacity: number
): CappedResourceGrant {
  const cap = Number.isFinite(capacity) ? Math.max(0, capacity) : 0;
  const resources = { ...EMPTY_RESOURCES };
  const requested = { ...EMPTY_RESOURCES };
  const received = { ...EMPTY_RESOURCES };
  const discarded = { ...EMPTY_RESOURCES };

  for (const resource of RESOURCE_KEYS) {
    const stored = safeStoredAmount(current[resource]);
    const gain = safeGain(delta[resource]);
    const accepted = Math.min(gain, Math.max(0, cap - stored));

    requested[resource] = gain;
    received[resource] = accepted;
    discarded[resource] = gain - accepted;
    resources[resource] = stored + accepted;
  }

  return {
    resources,
    requested,
    received,
    discarded,
    clipped: RESOURCE_KEYS.some((resource) => discarded[resource] > 0)
  };
}

export function totalResources(resources: Resources) {
  return RESOURCE_KEYS.reduce((total, resource) => total + resources[resource], 0);
}
