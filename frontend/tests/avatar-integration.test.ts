import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { GET as getAvatarStatus } from "@/app/api/avatar/status/route";
import { POST as postAvatarPreset } from "@/app/api/avatar/preset/route";
import { POST as postAvatarSizing } from "@/app/api/avatar/sizing/route";
import { GET as getAvatarAsset } from "@/app/api/avatar/assets/[avatarId]/[file]/route";
import { GET as getBodyProfile } from "@/app/api/body-profile/route";
import { POST as authRoute } from "@/app/api/auth/[...all]/route";
import { resetRateLimitStore } from "@/server/api/handler";

const createQueryChain = (resolvedValue: any = []) => {
  const chain: any = {
    from: vi.fn().mockImplementation(() => chain),
    where: vi.fn().mockImplementation(() => chain),
    orderBy: vi.fn().mockImplementation(() => chain),
    limit: vi.fn().mockImplementation(() => Promise.resolve(resolvedValue)),
    onConflictDoUpdate: vi.fn().mockImplementation(() => chain),
    returning: vi.fn().mockImplementation(() => Promise.resolve(resolvedValue)),
    values: vi.fn().mockImplementation(() => chain),
    then: (resolve: any) => Promise.resolve(resolvedValue).then(resolve),
  };
  return chain;
};

vi.mock("@/server/db", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn(),
    },
  };
});

describe("Avatar Engine Integration & Security", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    global.fetch = vi.fn();

    // Default chained mock returning empty array so unhandled queries don't crash
    vi.mocked(db.select).mockImplementation(() => createQueryChain([]));
    vi.mocked(db.insert).mockImplementation(() => createQueryChain([]));
    vi.mocked(db.update).mockImplementation(() => createQueryChain([]));
    vi.mocked(db.delete).mockImplementation(() => createQueryChain([]));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const USER_A = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "user_a@fitloom.com",
    name: "User A",
  };

  const USER_B = {
    id: "22222222-2222-2222-2222-222222222222",
    email: "user_b@fitloom.com",
    name: "User B",
  };

  function mockSession(
    user: { id: string; email: string; name: string } | null,
    role = "customer"
  ) {
    if (!user) {
      vi.spyOn(auth.api, "getSession").mockResolvedValue(null as any);
      return;
    }
    vi.spyOn(auth.api, "getSession").mockResolvedValue({
      user,
      session: { id: `sess-${user.id}` },
    } as any);

    // Mock role lookup in handler
    const mockUserRolesFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ role }]),
    });
    vi.mocked(db.select).mockReturnValueOnce({ from: mockUserRolesFrom } as any);
  }

  // ===========================================================================
  // 1. 401 UNAUTHORIZED WITHOUT SESSION
  // ===========================================================================
  describe("Authentication Requirements (401 without session)", () => {
    it("GET /api/avatar/status returns 401 when no session is present", async () => {
      mockSession(null);
      const req = new NextRequest("http://localhost:3000/api/avatar/status");
      const res = await getAvatarStatus(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("POST /api/avatar/preset returns 401 when no session is present", async () => {
      mockSession(null);
      const req = new NextRequest("http://localhost:3000/api/avatar/preset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ gender: "female" }),
      });
      const res = await postAvatarPreset(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("POST /api/avatar/sizing returns 401 when no session is present", async () => {
      mockSession(null);
      const req = new NextRequest("http://localhost:3000/api/avatar/sizing", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ avatarId: "a1b2c3d4", garmentType: "tshirt" }),
      });
      const res = await postAvatarSizing(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("GET /api/avatar/assets/[avatarId]/[file] returns 401 when no session is present", async () => {
      mockSession(null);
      const req = new NextRequest(
        "http://localhost:3000/api/avatar/assets/a1b2c3d4/apose.glb"
      );
      const res = await getAvatarAsset(req, {
        params: Promise.resolve({ avatarId: "a1b2c3d4", file: "apose.glb" }),
      });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });
  });

  // ===========================================================================
  // 2. TWO-USER ISOLATION ON ASSETS (404 on cross-user access, NEVER 403)
  // ===========================================================================
  describe("Asset Proxy & Two-User Isolation", () => {
    const avatarId = "a1b2c3d4";

    it("User B receives 404 AVATAR_NOT_FOUND when requesting User A's avatar asset", async () => {
      mockSession(USER_B);

      // avatars table lookup returns avatar owned by USER_A
      const mockAvatarsFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: "avatar-uuid-1",
              userId: USER_A.id, // Owned by User A
              avatarId,
            },
          ]),
        }),
      });
      vi.mocked(db.select).mockReturnValueOnce({ from: mockAvatarsFrom } as any);

      const req = new NextRequest(
        `http://localhost:3000/api/avatar/assets/${avatarId}/apose.glb`
      );
      const res = await getAvatarAsset(req, {
        params: Promise.resolve({ avatarId, file: "apose.glb" }),
      });

      // Must be 404, NEVER 403 to prevent enumeration
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("AVATAR_NOT_FOUND");
    });

    it("User A successfully streams own avatar asset with 200 and correct headers", async () => {
      mockSession(USER_A);

      // avatars table lookup returns avatar owned by USER_A
      const mockAvatarsFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: "avatar-uuid-1",
              userId: USER_A.id, // Matches current user
              avatarId,
            },
          ]),
        }),
      });
      vi.mocked(db.select).mockReturnValueOnce({ from: mockAvatarsFrom } as any);

      // Mock engine fetch returning GLB stream
      const mockGlbBytes = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 0x02, 0x00]);
      (global.fetch as any).mockResolvedValueOnce(
        new Response(mockGlbBytes, {
          status: 200,
          headers: {
            "Content-Type": "model/gltf-binary",
            "Content-Length": String(mockGlbBytes.length),
          },
        })
      );

      const req = new NextRequest(
        `http://localhost:3000/api/avatar/assets/${avatarId}/apose.glb`
      );
      const res = await getAvatarAsset(req, {
        params: Promise.resolve({ avatarId, file: "apose.glb" }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("model/gltf-binary");
      expect(res.headers.get("x-request-id")).toBeDefined();
      const bodyBytes = new Uint8Array(await res.arrayBuffer());
      expect(bodyBytes.length).toBe(mockGlbBytes.length);
    });

    it("rejects disallowed asset filenames with 400 DISALLOWED_FILE", async () => {
      mockSession(USER_A);

      const req = new NextRequest(
        `http://localhost:3000/api/avatar/assets/${avatarId}/secret_script.sh`
      );
      const res = await getAvatarAsset(req, {
        params: Promise.resolve({ avatarId, file: "secret_script.sh" }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("DISALLOWED_FILE");
    });

    it("rejects invalid avatarId format with 400 INVALID_AVATAR_ID", async () => {
      mockSession(USER_A);

      const req = new NextRequest(
        "http://localhost:3000/api/avatar/assets/not-valid-id-123/apose.glb"
      );
      const res = await getAvatarAsset(req, {
        params: Promise.resolve({
          avatarId: "not-valid-id-123",
          file: "apose.glb",
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("INVALID_AVATAR_ID");
    });
  });

  // ===========================================================================
  // 3. 503 SERVICE_UNAVAILABLE WHEN ENGINE IS DOWN OR TIMEOUT
  // ===========================================================================
  describe("Engine Availability (503 SERVICE_UNAVAILABLE, DEC-005)", () => {
    it("GET /api/avatar/status returns 503 when engine is unreachable", async () => {
      mockSession(USER_A);
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError("fetch failed: ECONNREFUSED")
      );

      const req = new NextRequest("http://localhost:3000/api/avatar/status");
      const res = await getAvatarStatus(req);

      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("SERVICE_UNAVAILABLE");
    });

    it("POST /api/avatar/preset returns 503 when engine times out", async () => {
      mockSession(USER_A);

      // Body profile exists
      const mockProfileFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              userId: USER_A.id,
              heightCm: "175.0",
              chestCm: "98.0",
              waistCm: "82.0",
              hipCm: "96.0",
            },
          ]),
        }),
      });
      vi.mocked(db.select).mockReturnValueOnce({ from: mockProfileFrom } as any);

      // Engine fetch times out / aborts
      (global.fetch as any).mockRejectedValueOnce(
        new DOMException("The operation was aborted", "AbortError")
      );

      const req = new NextRequest("http://localhost:3000/api/avatar/preset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ gender: "male" }),
      });
      const res = await postAvatarPreset(req);

      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error.code).toBe("SERVICE_UNAVAILABLE");
    });

    it("POST /api/avatar/sizing returns 503 when engine returns 500", async () => {
      mockSession(USER_A);

      // Avatar ownership exists
      const mockAvatarsFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { id: "uuid-1", userId: USER_A.id },
          ]),
        }),
      });
      // Body profile fit preference fallback
      const mockBodyFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ fitPreference: "regular" }]),
        }),
      });
      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockAvatarsFrom } as any)
        .mockReturnValueOnce({ from: mockBodyFrom } as any);

      (global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Internal engine crash" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );

      const req = new NextRequest("http://localhost:3000/api/avatar/sizing", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ avatarId: "a1b2c3d4", garmentType: "tshirt" }),
      });
      const res = await postAvatarSizing(req);

      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error.code).toBe("SERVICE_UNAVAILABLE");
    });
  });

  // ===========================================================================
  // 4. 422 MISSING_BODY_PROFILE WITHOUT BODY PROFILE
  // ===========================================================================
  describe("Preset Generation Requirements (422 MISSING_BODY_PROFILE)", () => {
    it("returns 422 when user does not have a saved body profile", async () => {
      mockSession(USER_A);

      // No profile found
      const mockProfileFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.mocked(db.select).mockReturnValueOnce({ from: mockProfileFrom } as any);

      const req = new NextRequest("http://localhost:3000/api/avatar/preset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ gender: "female" }),
      });

      const res = await postAvatarPreset(req);
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("MISSING_BODY_PROFILE");
    });

    it("successfully creates preset avatar and persists ownership when body profile exists", async () => {
      mockSession(USER_A);

      // 1. Profile lookup
      const mockProfileFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              userId: USER_A.id,
              heightCm: "165.0",
              chestCm: "92.0",
              waistCm: "74.0",
              hipCm: "95.0",
            },
          ]),
        }),
      });
      vi.mocked(db.select).mockReturnValueOnce({ from: mockProfileFrom } as any);

      // 2. Engine preset returns 200
      (global.fetch as any).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            avatar_id: "deadbeef",
            measurements: {
              height_cm: 165.0,
              chest_cm: 92.0,
              waist_cm: 74.0,
              hip_cm: 95.0,
            },
            apose_url: "/avatars/deadbeef/apose.glb",
            tpose_url: "/avatars/deadbeef/tpose.glb",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      // 3. Insert into avatars table
      const mockInsertValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: "avatar-record-1",
            userId: USER_A.id,
            avatarId: "deadbeef",
            createdAt: new Date("2026-01-01T00:00:00Z"),
          },
        ]),
      });
      vi.mocked(db.insert).mockReturnValueOnce({ values: mockInsertValues } as any);

      const req = new NextRequest("http://localhost:3000/api/avatar/preset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ gender: "female" }),
      });

      const res = await postAvatarPreset(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.avatarId).toBe("deadbeef");
      expect(json.data.assets.apose).toBe(
        "/api/avatar/assets/deadbeef/apose.glb"
      );
      expect(json.data.assets.tpose).toBe(
        "/api/avatar/assets/deadbeef/tpose.glb"
      );
      expect(json.data.assets.measurements).toBe(
        "/api/avatar/assets/deadbeef/measurements.json"
      );
    });
  });

  // ===========================================================================
  // 5. GARMENT SIZING & FIT PREFERENCE MAPPING
  // ===========================================================================
  describe("Garment Sizing (POST /api/avatar/sizing)", () => {
    it("maps app fit 'oversized' to engine 'extended' and returns recommended size", async () => {
      mockSession(USER_A);

      // Ownership check returns true
      const mockAvatarsFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { id: "uuid-1", userId: USER_A.id },
          ]),
        }),
      });
      vi.mocked(db.select).mockReturnValueOnce({ from: mockAvatarsFrom } as any);

      // Engine mock
      (global.fetch as any).mockImplementationOnce(
        async (url: string, init: RequestInit) => {
          const body = init.body as FormData;
          expect(body.get("fit_preference")).toBe("extended"); // 'oversized' mapped to 'extended'
          expect(body.get("garment_type")).toBe("tshirt");

          return new Response(
            JSON.stringify({
              garment_type: "tshirt",
              gender: "male",
              fit_preference: "extended",
              recommended_size: "L",
              recommended_score: 92,
              sizes: [
                {
                  size: "L",
                  fit_score: 92,
                  overall: "Best Match",
                  zones: {
                    chest: {
                      ease_cm: 12.0,
                      ease_in: 4.7,
                      label: "Ideal",
                      tension: 0.1,
                      penalty: 0.1,
                    },
                  },
                  notes: ["Hem hits cleanly at mid-fly"],
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      );

      const req = new NextRequest("http://localhost:3000/api/avatar/sizing", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          avatarId: "deadbeef",
          garmentType: "tshirt",
          fitPreference: "oversized",
        }),
      });

      const res = await postAvatarSizing(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.recommended_size).toBe("L");
      expect(json.data.recommended_score).toBe(92);
    });
  });

  // ===========================================================================
  // 6. FOUNDATION EXTRAS:
  //    - Body-profile history 5-entry limit
  //    - Wrong password
  //    - Logout
  //    - Sign-in rate limit
  // ===========================================================================
  describe("Foundation Extras Verification", () => {
    it("body-profile history caps returned entries to at most 5 entries", async () => {
      mockSession(USER_A);

      // Body profile query
      const mockProfileFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              userId: USER_A.id,
              heightCm: "170.0",
              chestCm: "95.0",
              waistCm: "80.0",
              fitPreference: "regular",
              updatedAt: new Date(),
            },
          ]),
        }),
      });

      // Mock measurementHistory query returning 5 entries (capped by .limit(5))
      const mockHistoryRows = Array.from({ length: 5 }, (_, i) => ({
        id: `hist-${i + 1}`,
        chestCm: `${90 + i}.0`,
        waistCm: `${75 + i}.0`,
        note: `Update ${i + 1}`,
        recordedAt: new Date(Date.now() - i * 10000),
        fullSnapshot: {},
      }));

      const mockHistoryFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockHistoryRows),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockProfileFrom } as any)
        .mockReturnValueOnce({ from: mockHistoryFrom } as any);

      const req = new NextRequest("http://localhost:3000/api/body-profile");
      const res = await getBodyProfile(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.history.length).toBeLessThanOrEqual(5);
      expect(json.data.history.length).toBe(5);
    });

    it("POST /api/auth/sign-in/email with wrong credentials returns error", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: "nonexistent@fitloom.com",
          password: "wrongPassword123!",
        }),
      });

      const res = await authRoute(req);
      // Better Auth returns 400 or 401 on invalid credentials
      expect([400, 401]).toContain(res.status);
    });

    it("POST /api/auth/sign-out successfully accepts sign-out", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({}),
      });

      const res = await authRoute(req);
      expect([200, 302]).toContain(res.status);
    });

    it("sign-in triggers rate limiter (429) after excessive failed attempts", async () => {
      const attempts = [];
      for (let i = 0; i < 7; i++) {
        const req = new NextRequest("http://localhost:3000/api/auth/sign-in/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "x-forwarded-for": "198.51.100.42",
          },
          body: JSON.stringify({
            email: "bruteforce@fitloom.com",
            password: "wrongPassword123!",
          }),
        });
        attempts.push(await authRoute(req));
      }

      // At least one of the later attempts must be rate-limited (429)
      const hasRateLimited = attempts.some((res) => res.status === 429);
      expect(hasRateLimited).toBe(true);
    });
  });
});
