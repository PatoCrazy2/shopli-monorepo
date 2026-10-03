import { describe, it, expect, vi } from "vitest";

// Mock de React.cache para Vitest
vi.mock("react", () => ({
  cache: (fn: any) => {
    let cachedResult: any;
    let hasRun = false;
    return (...args: any[]) => {
      if (!hasRun) {
        cachedResult = fn(...args);
        hasRun = true;
      }
      return cachedResult;
    };
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: "u-123",
      name: "Owner",
      role: "DUENO",
      empresa_id: "emp-123",
    },
  })),
}));

import { getSession } from "../get-session";
import { auth } from "../auth";

describe("Etapa 2: getSession() con React.cache", () => {
  it("deduplica llamadas devolviendo la misma promesa / resultado", async () => {
    const session1 = await getSession();
    const session2 = await getSession();
    const session3 = await getSession();

    expect(session1).toBeDefined();
    expect(session1?.user?.id).toBe("u-123");
    expect(session2).toBe(session1);
    expect(session3).toBe(session1);
    expect(auth).toHaveBeenCalledTimes(1);
  });
});
