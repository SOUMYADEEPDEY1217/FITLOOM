import { z } from "zod";

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters long"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  AVATAR_SERVICE_URL: z
    .string()
    .url("AVATAR_SERVICE_URL must be a valid URL")
    .default("http://127.0.0.1:8010"),
  AVATAR_SERVICE_TOKEN: z.string().optional().default(""),
  AVATAR_SERVICE_TIMEOUT_MS: z.coerce.number().positive().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _cachedEnv: ServerEnv | null = null;

/**
 * Validates and returns server environment variables.
 * Can be called with custom env object for isolated testing.
 */
export function validateServerEnv(
  input: Record<string, unknown> = process.env
): ServerEnv {
  return serverEnvSchema.parse(input);
}

/**
 * Safely parses server environment variables, returning result or issues.
 */
export function safeValidateServerEnv(
  input: Record<string, unknown> = process.env
) {
  return serverEnvSchema.safeParse(input);
}

/**
 * Lazy getter for server environment variables.
 * Only validates when properties are read at runtime, ensuring `next build`
 * succeeds even when zero environment secrets are supplied.
 */
export function getServerEnv(): ServerEnv {
  if (_cachedEnv) return _cachedEnv;
  const result = safeValidateServerEnv(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`[ENV_ERROR] Invalid server environment: ${issues}`);
  }
  _cachedEnv = result.data;
  return _cachedEnv;
}

/**
 * Proxied env object allowing direct property access: `env.DATABASE_URL`.
 * Does not throw on module import.
 */
export const env = new Proxy({} as ServerEnv, {
  get(_target, prop: string | symbol) {
    if (typeof prop !== "string") return undefined;
    const currentEnv = getServerEnv();
    return currentEnv[prop as keyof ServerEnv];
  },
});
