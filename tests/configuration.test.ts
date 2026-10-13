import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

describe("configuration des tests", () => {
  it("utilise la base de test, jamais la base de développement", async () => {
    const [{ base }] = await prisma.$queryRaw<{ base: string }[]>`SELECT current_database() AS base`;
    expect(base).toBe("immo_test");
  });
});