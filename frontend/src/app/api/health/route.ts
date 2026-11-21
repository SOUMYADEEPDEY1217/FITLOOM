import { sql } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { db } from "@/server/db";

export const GET = createApiHandler(async () => {
  try {
    const result = await db.execute(sql`SELECT 1 AS health_check`);
    if (!result) {
      throw new Error("Empty health check response");
    }
    return {
      db: "ok",
    };
  } catch (err) {
    console.error("[HEALTH_CHECK_FAILED]", err);
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "Database connection failed");
  }
});
