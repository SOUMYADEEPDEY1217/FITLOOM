import { describe, it, expect } from "vitest";
import { safeValidateServerEnv } from "@/server/env";

describe("Server Environment Validation", () => {
  const validEnv = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/fitloom?sslmode=require",
    BETTER_AUTH_SECRET: "this-is-a-very-long-secret-with-more-than-32-chars",
    BETTER_AUTH_URL: "http://localhost:3000",
    ALLOWED_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
    AVATAR_SERVICE_URL: "http://127.0.0.1:8010",
    AVATAR_SERVICE_TIMEOUT_MS: "5000",
  };

  it("passes when all required variables are valid", () => {
    const result = safeValidateServerEnv(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DATABASE_URL).toBe(validEnv.DATABASE_URL);
      expect(result.data.BETTER_AUTH_SECRET).toBe(validEnv.BETTER_AUTH_SECRET);
      expect(result.data.AVATAR_SERVICE_TIMEOUT_MS).toBe(5000);
    }
  });

  it("fails when DATABASE_URL is missing", () => {
    const { DATABASE_URL: _, ...withoutDb } = validEnv;
    const result = safeValidateServerEnv(withoutDb);
    expect(result.success).toBe(false);
  });

  it("fails when DATABASE_URL is not a valid URL", () => {
    const result = safeValidateServerEnv({
      ...validEnv,
      DATABASE_URL: "not-a-valid-url",
    });
    expect(result.success).toBe(false);
  });

  it("fails when BETTER_AUTH_SECRET is shorter than 32 characters", () => {
    const result = safeValidateServerEnv({
      ...validEnv,
      BETTER_AUTH_SECRET: "short-secret",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes("BETTER_AUTH_SECRET"))).toBe(true);
    }
  });

  it("fails when BETTER_AUTH_URL is not a valid URL", () => {
    const result = safeValidateServerEnv({
      ...validEnv,
      BETTER_AUTH_URL: "localhost-without-protocol",
    });
    expect(result.success).toBe(false);
  });

  it("applies defaults for AVATAR_SERVICE_URL and ALLOWED_ORIGINS", () => {
    const minimalEnv = {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/fitloom",
      BETTER_AUTH_SECRET: "at-least-32-characters-long-valid-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
    };
    const result = safeValidateServerEnv(minimalEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ALLOWED_ORIGINS).toBe("http://localhost:3000");
      expect(result.data.AVATAR_SERVICE_URL).toBe("http://127.0.0.1:8010");
      expect(result.data.AVATAR_SERVICE_TIMEOUT_MS).toBe(5000);
    }
  });
});
