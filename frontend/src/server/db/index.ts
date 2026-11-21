import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Returns the Drizzle ORM client instance with typed schema.
 * Throws only when called without DATABASE_URL, preventing build failures.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "[DB_ERROR] DATABASE_URL environment variable is required to initialize database client."
    );
  }
  const client = neon(url);
  _db = drizzle(client, { schema });
  return _db;
}

/**
 * Proxied database client allowing direct query access: `db.select().from(users)`.
 * Lazy-loads the connection on first method access.
 */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop: string | symbol) {
    const instance = getDb();
    const val = instance[prop as keyof NeonHttpDatabase<typeof schema>];
    if (typeof val === "function") {
      return (val as (...args: unknown[]) => unknown).bind(instance);
    }
    return val;
  },
});

export * from "./schema";
