import { describe, it, expect } from "vitest";
import { BodyProfileSchema, INITIAL_MOCK_BODY_PROFILE } from "@/lib/mock-data";
import { StrictBodyProfileSchema } from "@/server/api/schemas";

describe("Anthropometric Body Profile Schema & Precision", () => {
  it("validates standard mock body profile successfully", () => {
    const result = BodyProfileSchema.safeParse(INITIAL_MOCK_BODY_PROFILE);
    expect(result.success).toBe(true);
  });

  it("rejects height out of range (< 130 cm or > 220 cm)", () => {
    const tooShort = { ...INITIAL_MOCK_BODY_PROFILE, heightCm: 120 };
    const tooTall = { ...INITIAL_MOCK_BODY_PROFILE, heightCm: 230 };

    expect(BodyProfileSchema.safeParse(tooShort).success).toBe(false);
    expect(BodyProfileSchema.safeParse(tooTall).success).toBe(false);
  });

  it("rejects chest out of range (< 70 cm or > 150 cm)", () => {
    const tooNarrow = { ...INITIAL_MOCK_BODY_PROFILE, chestCm: 65 };
    const tooBroad = { ...INITIAL_MOCK_BODY_PROFILE, chestCm: 160 };

    expect(BodyProfileSchema.safeParse(tooNarrow).success).toBe(false);
    expect(BodyProfileSchema.safeParse(tooBroad).success).toBe(false);
  });

  it("rejects waist out of range (< 55 cm or > 140 cm)", () => {
    const tooSmall = { ...INITIAL_MOCK_BODY_PROFILE, waistCm: 50 };
    const tooLarge = { ...INITIAL_MOCK_BODY_PROFILE, waistCm: 150 };

    expect(BodyProfileSchema.safeParse(tooSmall).success).toBe(false);
    expect(BodyProfileSchema.safeParse(tooLarge).success).toBe(false);
  });

  it("rejects unknown fit preferences", () => {
    const invalidPref = {
      ...INITIAL_MOCK_BODY_PROFILE,
      fitPreference: "ultra-baggy",
    };
    expect(BodyProfileSchema.safeParse(invalidPref).success).toBe(false);
  });

  it("strict schema rejects unknown extra injected fields", () => {
    const injected = {
      ...INITIAL_MOCK_BODY_PROFILE,
      injectedRole: "admin",
      secretBackdoor: true,
    };
    const result = StrictBodyProfileSchema.safeParse(injected);
    expect(result.success).toBe(false);
  });

  it("rounds measurements to 0.1 cm precision", () => {
    function round01(val: number): number {
      return Math.round(val * 10) / 10;
    }

    expect(round01(92.449)).toBe(92.4);
    expect(round01(92.451)).toBe(92.5);
    expect(round01(70.04)).toBe(70.0);
    expect(round01(105.78)).toBe(105.8);
  });
});
