import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { userRoles } from "@/server/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "fallback-secret-minimum-32-characters-for-build",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 64,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: false,
    },
  },
  advanced: {
    cookiePrefix: "fitloom",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 5,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await db.insert(userRoles).values({
              userId: user.id,
              role: "customer",
            }).onConflictDoNothing();
          } catch (e) {
            console.error("[AUTH] Failed to grant customer role to new user:", e);
          }
        },
      },
    },
  },
});
