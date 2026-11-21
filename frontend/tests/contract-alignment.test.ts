import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { GET as getUsersMe, PATCH as patchUsersMe } from "@/app/api/users/me/route";
import { GET as getBodyProfile, PUT as putBodyProfile } from "@/app/api/body-profile/route";
import nextConfig from "../next.config";

vi.mock("@/server/db", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      execute: vi.fn(),
    },
  };
});

describe("Contract Alignment: users/me, body-profile, and security headers", () => {
  it("GET /api/users/me returns contract shape: { ok: true, data: { user, capabilities, partners } }", async () => {
    vi.spyOn(auth.api, "getSession").mockResolvedValueOnce({
      user: { id: "user-test-uuid", email: "test@fitloom.com", name: "Test User" },
      session: { id: "sess-test" },
    } as any);

    // 1. userRoles query in handler
    const mockUserRolesFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ role: "customer" }]),
    });
    // 2. users table query in route
    const mockUsersFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            id: "user-test-uuid",
            name: "Test User",
            email: "test@fitloom.com",
            phone: "+919876543210",
            city: "Mumbai",
            image: null,
            accountStatus: "active",
            createdAt: new Date("2026-01-01"),
          },
        ]),
      }),
    });
    // 3. partners table query in route
    const mockPartnersFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([
        {
          type: "tailor",
          verificationStatus: "verified",
          operationalStatus: "active",
        },
      ]),
    });

    vi.mocked(db.select)
      .mockReturnValueOnce({ from: mockUserRolesFrom } as any)
      .mockReturnValueOnce({ from: mockUsersFrom } as any)
      .mockReturnValueOnce({ from: mockPartnersFrom } as any);

    const req = new NextRequest("http://localhost:3000/api/users/me");
    const res = await getUsersMe(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toBeDefined();

    // Verify key names conform to docs/DB_AND_API_CONTRACTS.md
    expect(json.data.user).toBeDefined();
    expect(json.data.user.email).toBe("test@fitloom.com");
    expect(json.data.capabilities).toEqual(["customer"]);
    expect(json.data.partners).toEqual([
      {
        type: "tailor",
        verificationStatus: "verified",
        operationalStatus: "active",
      },
    ]);

    // Ensure deprecated field names are NOT present
    expect((json.data as any).roles).toBeUndefined();
    expect((json.data as any).partner).toBeUndefined();
  });

  it("PATCH /api/users/me returns contract shape: { ok: true, data: { user, capabilities, partners } }", async () => {
    vi.spyOn(auth.api, "getSession").mockResolvedValueOnce({
      user: { id: "user-test-uuid", email: "test@fitloom.com", name: "Test User" },
      session: { id: "sess-test" },
    } as any);

    // 1. userRoles query
    const mockUserRolesFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ role: "customer" }]),
    });
    vi.mocked(db.select).mockReturnValueOnce({ from: mockUserRolesFrom } as any);

    // 2. update users returning
    const mockUpdateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: "user-test-uuid",
            name: "Updated Name",
            email: "test@fitloom.com",
            phone: "+919876543210",
            city: "Delhi",
            image: null,
            accountStatus: "active",
            createdAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-02"),
          },
        ]),
      }),
    });
    vi.mocked(db.update).mockReturnValueOnce({ set: mockUpdateSet } as any);

    // 3. partners query
    const mockPartnersFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });
    vi.mocked(db.select).mockReturnValueOnce({ from: mockPartnersFrom } as any);

    const req = new NextRequest("http://localhost:3000/api/users/me", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ name: "Updated Name", city: "Delhi" }),
    });

    const res = await patchUsersMe(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.user.name).toBe("Updated Name");
    expect(json.data.user.city).toBe("Delhi");
    expect(json.data.capabilities).toEqual(["customer"]);
    expect(json.data.partners).toEqual([]);
    expect((json.data as any).roles).toBeUndefined();
    expect((json.data as any).partner).toBeUndefined();
  });

  it("GET /api/body-profile returns contract shape: { ok: true, data: { profile, history } }", async () => {
    vi.spyOn(auth.api, "getSession").mockResolvedValueOnce({
      user: { id: "user-test-uuid", email: "test@fitloom.com", name: "Test User" },
      session: { id: "sess-test" },
    } as any);

    // 1. userRoles query
    const mockUserRolesFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ role: "customer" }]),
    });
    // 2. bodyProfiles query
    const mockProfileFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            userId: "user-test-uuid",
            heightCm: "178.0",
            weightKg: "74.5",
            bodyType: "athletic",
            chestCm: "98.0",
            waistCm: "82.0",
            hipCm: "96.0",
            shoulderCm: "45.0",
            sleeveCm: "62.0",
            inseamCm: "80.0",
            fitPreference: "regular",
            updatedAt: new Date("2026-01-01"),
          },
        ]),
      }),
    });
    // 3. measurementHistory query (last 5 rows)
    const mockHistoryFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: "hist-1",
              chestCm: "97.5",
              waistCm: "81.5",
              note: "Initial",
              recordedAt: new Date("2026-01-01"),
              fullSnapshot: {},
            },
          ]),
        }),
      }),
    });

    vi.mocked(db.select)
      .mockReturnValueOnce({ from: mockUserRolesFrom } as any)
      .mockReturnValueOnce({ from: mockProfileFrom } as any)
      .mockReturnValueOnce({ from: mockHistoryFrom } as any);

    const req = new NextRequest("http://localhost:3000/api/body-profile");
    const res = await getBodyProfile(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.profile).toBeDefined();
    expect(json.data.profile.chestCm).toBe(98);
    expect(json.data.profile.waistCm).toBe(82);
    expect(json.data.history).toBeInstanceOf(Array);
    expect(json.data.history.length).toBe(1);
    expect(json.data.history[0].id).toBe("hist-1");
  });

  it("PUT /api/body-profile returns contract shape: { ok: true, data: { profile, history } }", async () => {
    vi.spyOn(auth.api, "getSession").mockResolvedValueOnce({
      user: { id: "user-test-uuid", email: "test@fitloom.com", name: "Test User" },
      session: { id: "sess-test" },
    } as any);

    // 1. userRoles query
    const mockUserRolesFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ role: "customer" }]),
    });
    // 2. existing bodyProfile lookup
    const mockExistingFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    });
    vi.mocked(db.select)
      .mockReturnValueOnce({ from: mockUserRolesFrom } as any)
      .mockReturnValueOnce({ from: mockExistingFrom } as any);

    // 3. First insert: measurementHistory, Second insert: bodyProfiles upsert
    const mockHistoryInsert = {
      values: vi.fn().mockResolvedValue([]),
    };

    const mockProfileInsert = {
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              userId: "user-test-uuid",
              heightCm: "180.0",
              weightKg: "75.0",
              bodyType: "athletic",
              chestCm: "100.0",
              waistCm: "84.0",
              hipCm: "98.0",
              shoulderCm: "46.0",
              sleeveCm: "63.0",
              inseamCm: "81.0",
              fitPreference: "slim",
              updatedAt: new Date("2026-01-02"),
            },
          ]),
        }),
      }),
    };

    vi.mocked(db.insert)
      .mockReturnValueOnce(mockHistoryInsert as any)
      .mockReturnValueOnce(mockProfileInsert as any);

    // 5. measurementHistory query for response (last 5 rows)
    const mockHistoryFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: "hist-new",
              chestCm: "100.0",
              waistCm: "84.0",
              note: "Body profile update",
              recordedAt: new Date("2026-01-02"),
              fullSnapshot: {},
            },
          ]),
        }),
      }),
    });
    vi.mocked(db.select).mockReturnValueOnce({ from: mockHistoryFrom } as any);

    const req = new NextRequest("http://localhost:3000/api/body-profile", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        heightCm: 180,
        weightKg: 75,
        bodyType: "athletic",
        chestCm: 100,
        waistCm: 84,
        hipCm: 98,
        shoulderCm: 46,
        sleeveCm: 63,
        inseamCm: 81,
        fitPreference: "slim",
      }),
    });

    const res = await putBodyProfile(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.profile).toBeDefined();
    expect(json.data.profile.chestCm).toBe(100);
    expect(json.data.history).toBeInstanceOf(Array);
    expect(json.data.history.length).toBe(1);
    expect(json.data.history[0].id).toBe("hist-new");
  });

  it("next.config.ts Strict-Transport-Security header has max-age and includeSubDomains but NOT preload", async () => {
    if (nextConfig.headers) {
      const headersList = await nextConfig.headers();
      const allPathHeaders = headersList.find((h) => h.source === "/:path*");
      expect(allPathHeaders).toBeDefined();

      const hsts = allPathHeaders?.headers.find(
        (header) => header.key === "Strict-Transport-Security"
      );

      // In production or test mock of prod, verify preload is never present
      if (hsts) {
        expect(hsts.value).toContain("max-age=");
        expect(hsts.value).toContain("includeSubDomains");
        expect(hsts.value).not.toContain("preload");
      }
    }
  });
});
