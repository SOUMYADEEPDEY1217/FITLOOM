import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { POST as postAvatarFromImages } from "@/app/api/avatar/from-images/route";
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

describe("POST /api/avatar/from-images", () => {
  const originalFetch = global.fetch;

  const TEST_USER = {
    id: "33333333-3333-3333-3333-333333333333",
    email: "customer@fitloom.com",
    name: "Test Customer",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    global.fetch = vi.fn();

    vi.mocked(db.select).mockImplementation(() => createQueryChain([]));
    vi.mocked(db.insert).mockImplementation(() =>
      createQueryChain([
        {
          id: "avatar-record-1",
          userId: TEST_USER.id,
          avatarId: "img-avatar-12345",
          createdAt: new Date(),
        },
      ])
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

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

    const mockUserRolesFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ role }]),
    });
    vi.mocked(db.select).mockReturnValueOnce({ from: mockUserRolesFrom } as any);
  }

  it("1. returns 401 UNAUTHORIZED when no session is present", async () => {
    mockSession(null);

    const formData = new FormData();
    const fakeFile = new File([new Uint8Array([1, 2, 3])], "front.jpg", {
      type: "image/jpeg",
    });
    formData.append("front", fakeFile);

    const req = new NextRequest("http://localhost:3000/api/avatar/from-images", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
      body: formData,
    });

    const res = await postAvatarFromImages(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("2. returns 400 VALIDATION_ERROR when front photo is missing", async () => {
    mockSession(TEST_USER);

    const formData = new FormData();
    formData.append("gender", "neutral");

    const req = new NextRequest("http://localhost:3000/api/avatar/from-images", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
      body: formData,
    });

    const res = await postAvatarFromImages(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("3. returns 400 VALIDATION_ERROR on wrong MIME type (e.g. text/plain)", async () => {
    mockSession(TEST_USER);

    const formData = new FormData();
    const invalidFile = new File(["not an image"], "document.txt", {
      type: "text/plain",
    });
    formData.append("front", invalidFile);

    const req = new NextRequest("http://localhost:3000/api/avatar/from-images", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
      body: formData,
    });

    const res = await postAvatarFromImages(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toMatch(/jpeg and png/i);
  });

  it("4. returns 413 PAYLOAD_TOO_LARGE when photo exceeds 5MB", async () => {
    mockSession(TEST_USER);

    const formData = new FormData();
    const largeBytes = new Uint8Array(5.5 * 1024 * 1024);
    const largeFile = new File([largeBytes], "large.jpg", {
      type: "image/jpeg",
    });
    formData.append("front", largeFile);

    const req = new NextRequest("http://localhost:3000/api/avatar/from-images", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
      body: formData,
    });

    const res = await postAvatarFromImages(req);
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("5. returns 503 SERVICE_UNAVAILABLE when engine is down or returns 503", async () => {
    mockSession(TEST_USER);

    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Connection refused"));

    const formData = new FormData();
    const frontFile = new File([new Uint8Array([0xff, 0xd8, 0xff])], "front.jpg", {
      type: "image/jpeg",
    });
    formData.append("front", frontFile);

    const req = new NextRequest("http://localhost:3000/api/avatar/from-images", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
      body: formData,
    });

    const res = await postAvatarFromImages(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("6. returns 422 AVATAR_GENERATION_FAILED when engine cannot detect body in photo", async () => {
    mockSession(TEST_USER);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ detail: "Could not read a body in this photo, try again" }),
    } as any);

    const formData = new FormData();
    const frontFile = new File([new Uint8Array([0xff, 0xd8, 0xff])], "front.jpg", {
      type: "image/jpeg",
    });
    formData.append("front", frontFile);

    const req = new NextRequest("http://localhost:3000/api/avatar/from-images", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
      body: formData,
    });

    const res = await postAvatarFromImages(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("AVATAR_GENERATION_FAILED");
    expect(json.error.message).toBe("Could not read a body in this photo, try again");
  });

  it("7. returns 201 with avatar details and saves ownership on valid upload", async () => {
    mockSession(TEST_USER);

    // Mock successful engine response
    const mockEngineResponse = {
      avatar_id: "img-avatar-12345",
      measurements: {
        height_cm: 178,
        chest_circ: 98,
        waist_circ: 82,
      },
      calibration: {
        confidence: 0.95,
      },
      assets: {
        apose_glb: "assets/img-avatar-12345/apose.glb",
        tpose_glb: "assets/img-avatar-12345/tpose.glb",
        measurements_json: "assets/img-avatar-12345/measurements.json",
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockEngineResponse,
    } as any);

    const formData = new FormData();
    const frontFile = new File([new Uint8Array([0xff, 0xd8, 0xff])], "front.jpg", {
      type: "image/jpeg",
    });
    const sideFile = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "side.png", {
      type: "image/png",
    });
    formData.append("front", frontFile);
    formData.append("side", sideFile);

    const req = new NextRequest("http://localhost:3000/api/avatar/from-images", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
      body: formData,
    });

    const res = await postAvatarFromImages(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.avatarId).toBe("img-avatar-12345");
    expect(json.data.assets.apose).toBe("/api/avatar/assets/img-avatar-12345/apose.glb");
    expect(json.data.assets.tpose).toBe("/api/avatar/assets/img-avatar-12345/tpose.glb");
    expect(json.data.assets.measurements).toBe(
      "/api/avatar/assets/img-avatar-12345/measurements.json"
    );

    // Verify DB insert called to record ownership
    expect(db.insert).toHaveBeenCalled();
  });
});
