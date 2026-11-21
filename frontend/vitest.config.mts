import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/fitloom?sslmode=require",
      BETTER_AUTH_SECRET: "mock-secret-for-testing-at-least-32-chars-long",
      BETTER_AUTH_URL: "http://localhost:3000",
      ALLOWED_ORIGINS: "http://localhost:3000",
      AVATAR_SERVICE_URL: "http://127.0.0.1:8010",
      AVATAR_SERVICE_TOKEN: "mock-avatar-token",
      AVATAR_SERVICE_TIMEOUT_MS: "5000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
