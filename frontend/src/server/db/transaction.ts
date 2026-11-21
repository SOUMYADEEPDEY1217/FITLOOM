import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

/**
 * Lazy transaction runner using @neondatabase/serverless Pool + drizzle-orm/neon-serverless.
 * This is used ONLY for checkout atomic transactions where multi-statement ACID guarantees are required.
 *
 * CRITICAL ZERO-SECRET INVARIANT:
 * - NO connection or Pool is instantiated at module import time.
 * - process.env.DATABASE_URL is only read when `withCheckoutTransaction` is called at runtime.
 * - Safe for zero-secret `next build`.
 */
export async function withCheckoutTransaction<T>(
  callback: (tx: Parameters<Parameters<ReturnType<typeof drizzle<typeof schema>>["transaction"]>[0]>[0]) => Promise<T>
): Promise<T> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "[TRANSACTION_ERROR] DATABASE_URL environment variable is required for checkout transaction."
    );
  }

  // Create a connection pool scoped to this operation or reused
  const pool = new Pool({ connectionString: databaseUrl });
  const poolDb = drizzle(pool, { schema });

  try {
    return await poolDb.transaction(async (tx) => {
      return await callback(tx);
    });
  } finally {
    // End pool to release connection in serverless lifecycle
    await pool.end().catch((err) => {
      console.error("[POOL_CLEANUP_WARN] Failed to close transaction pool:", err);
    });
  }
}
