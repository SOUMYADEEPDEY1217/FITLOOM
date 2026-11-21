import { createApiHandler } from "@/server/api/handler";
import { getEngineHealth } from "@/server/avatar";

export const GET = createApiHandler(
  async () => {
    const health = await getEngineHealth();
    return {
      status: health.status,
      modelReady: health.model_ready,
      cudaAvailable: health.cuda_available,
    };
  },
  {
    authRequired: true,
    requiredRole: "customer",
  }
);
