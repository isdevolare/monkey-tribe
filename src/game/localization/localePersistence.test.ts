import { beforeEach, describe, expect, it, vi } from "vitest";

const asyncStorage = vi.hoisted(() => ({
  getItem: vi.fn(async (_key: string): Promise<string | null> => null),
  setItem: vi.fn(async (_key: string, _value: string): Promise<void> => undefined),
  removeItem: vi.fn(async (_key: string): Promise<void> => undefined),
  multiGet: vi.fn(async (_keys: readonly string[]): Promise<ReadonlyArray<readonly [string, string | null]>> => [])
}));

vi.mock("@react-native-async-storage/async-storage", () => ({ default: asyncStorage }));

import { flushVillageSave, useGameStore } from "../state/gameStore";

describe("locale persistence", () => {
  beforeEach(() => {
    asyncStorage.setItem.mockClear();
  });

  it("stores the selected release locale in the village save", async () => {
    useGameStore.getState().setLanguage("pt-BR");
    await flushVillageSave();

    const writes = asyncStorage.setItem.mock.calls;
    expect(writes.length).toBeGreaterThan(0);
    const lastWrite = writes[writes.length - 1];
    expect(lastWrite?.[0]).toBe("monkey-tribe:save");
    expect(JSON.parse(lastWrite?.[1] ?? "{}").language).toBe("pt-BR");
  });
});
