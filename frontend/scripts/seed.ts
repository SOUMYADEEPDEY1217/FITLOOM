import fs from "fs";
import path from "path";
import {
  users,
  userRoles,
  partners,
  tailorProfiles,
  bodyProfiles,
  measurementHistory,
  products,
  garmentMeasurements,
  getDb,
} from "../src/server/db";
import { MOCK_GARMENTS } from "../src/lib/mock-data";

/**
 * Lightweight environment loader for .env.local without external dependencies.
 */
function loadEnv() {
  if (process.env.DATABASE_URL) return;

  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      break;
    }
  }
}

// Deterministic UUIDs for idempotent seeding
const USER_RIYA_ID = "00000000-0000-4000-a000-000000000001";
const USER_SELLER_ID = "00000000-0000-4000-a000-000000000002";
const USER_TAILOR_ARJUN_ID = "00000000-0000-4000-a000-000000000003";
const USER_ADMIN_ID = "00000000-0000-4000-a000-000000000004";
const USER_TAILOR_MEERA_ID = "00000000-0000-4000-a000-000000000005";
const USER_TAILOR_PARADOX_ID = "00000000-0000-4000-a000-000000000006";

const PARTNER_VERVE_ID = "10000000-0000-4000-a000-000000000001";
const PARTNER_ARJUN_ID = "10000000-0000-4000-a000-000000000002";
const PARTNER_MEERA_ID = "10000000-0000-4000-a000-000000000003";
const PARTNER_PARADOX_ID = "10000000-0000-4000-a000-000000000004";

export async function seed() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === "") {
    console.warn("\n⚠️  [FITLOOM Seed Warning]: DATABASE_URL is not configured.");
    console.warn("To run seeds against a live database:");
    console.warn("  1. Add DATABASE_URL to your .env.local file.");
    console.warn("  2. Apply migrations: npx drizzle-kit push (or run drizzle/*.sql).");
    console.warn("  3. Run: npm run db:seed\n");
    return { success: false, reason: "DATABASE_NOT_CONFIGURED" };
  }

  console.log("🌱 Starting idempotent database seeding for FITLOOM Stage P3-B...");
  const db = getDb();

  // 1. Seed Core Demo Users
  console.log("  -> Seeding demo users...");
  const demoUsers = [
    {
      id: USER_RIYA_ID,
      name: "Riya Sen",
      email: "riya@fitloom.com",
      accountStatus: "active",
      city: "Kolkata",
      phone: "+91 98300 12345",
    },
    {
      id: USER_SELLER_ID,
      name: "Verve Studio Partner",
      email: "seller@verve.com",
      accountStatus: "active",
      city: "Mumbai",
      phone: "+91 98200 54321",
    },
    {
      id: USER_TAILOR_ARJUN_ID,
      name: "Master Arjun",
      email: "tailor@arjun.com",
      accountStatus: "active",
      city: "Kolkata",
      phone: "+91 98311 98765",
    },
    {
      id: USER_ADMIN_ID,
      name: "FITLOOM Platform Admin",
      email: "admin@fitloom.com",
      accountStatus: "active",
      city: "Bengaluru",
      phone: "+91 98450 11223",
    },
    {
      id: USER_TAILOR_MEERA_ID,
      name: "Meera Nair",
      email: "tailor@meera.com",
      accountStatus: "active",
      city: "Bengaluru",
      phone: "+91 98440 22334",
    },
    {
      id: USER_TAILOR_PARADOX_ID,
      name: "Paradox Guild Master",
      email: "tailor@paradox.com",
      accountStatus: "active",
      city: "Mumbai",
      phone: "+91 98210 99887",
    },
  ];

  for (const u of demoUsers) {
    await db
      .insert(users)
      .values(u)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: u.name,
          email: u.email,
          city: u.city,
          phone: u.phone,
        },
      });
  }

  // 2. Seed User Roles (Additive Multi-Role Model)
  console.log("  -> Seeding user roles...");
  const rolesToSeed = [
    { userId: USER_RIYA_ID, role: "customer" },
    { userId: USER_SELLER_ID, role: "customer" },
    { userId: USER_SELLER_ID, role: "seller" },
    { userId: USER_TAILOR_ARJUN_ID, role: "customer" },
    { userId: USER_TAILOR_ARJUN_ID, role: "tailor" },
    { userId: USER_TAILOR_MEERA_ID, role: "customer" },
    { userId: USER_TAILOR_MEERA_ID, role: "tailor" },
    { userId: USER_TAILOR_PARADOX_ID, role: "customer" },
    { userId: USER_TAILOR_PARADOX_ID, role: "tailor" },
    { userId: USER_ADMIN_ID, role: "customer" },
    { userId: USER_ADMIN_ID, role: "admin" },
  ];

  for (const r of rolesToSeed) {
    await db
      .insert(userRoles)
      .values(r)
      .onConflictDoNothing({
        target: [userRoles.userId, userRoles.role],
      });
  }

  // 3. Seed Partners
  // Note: partners enforces UNIQUE (owner_user_id, type). Each partner has its own distinct owner,
  // and onConflictDoUpdate targets [partners.ownerUserId, partners.type] for safe idempotency.
  console.log("  -> Seeding partner records (Sellers & Tailors)...");
  const partnerSeeds = [
    {
      id: PARTNER_VERVE_ID,
      ownerUserId: USER_SELLER_ID,
      type: "seller",
      name: "Verve Studio",
      city: "Mumbai",
      verificationStatus: "verified",
      operationalStatus: "active",
    },
    {
      id: PARTNER_ARJUN_ID,
      ownerUserId: USER_TAILOR_ARJUN_ID,
      type: "tailor",
      name: "Atelier Arjun & Co.",
      city: "Kolkata",
      verificationStatus: "verified",
      operationalStatus: "active",
    },
    {
      id: PARTNER_MEERA_ID,
      ownerUserId: USER_TAILOR_MEERA_ID,
      type: "tailor",
      name: "Meera Bespoke Studio",
      city: "Bengaluru",
      verificationStatus: "verified",
      operationalStatus: "active",
    },
    {
      id: PARTNER_PARADOX_ID,
      ownerUserId: USER_TAILOR_PARADOX_ID,
      type: "tailor",
      name: "FITLOOM Partner Guild",
      city: "Mumbai",
      verificationStatus: "verified",
      operationalStatus: "active",
    },
  ];

  for (const p of partnerSeeds) {
    await db
      .insert(partners)
      .values(p)
      .onConflictDoUpdate({
        target: [partners.ownerUserId, partners.type],
        set: {
          id: p.id,
          name: p.name,
          city: p.city,
          verificationStatus: p.verificationStatus,
          operationalStatus: p.operationalStatus,
        },
      });
  }

  // 4. Seed Tailor Profiles
  console.log("  -> Seeding tailor workshop profiles...");
  const tailorProfileSeeds = [
    {
      partnerId: PARTNER_ARJUN_ID,
      specialties: "Bespoke Shirts & Structured Blazers",
      baseTailoringFeeInr: 450,
      turnaroundDays: 6,
      weeklyCapacityOrders: 15,
      acceptingCustomOrders: true,
    },
    {
      partnerId: PARTNER_MEERA_ID,
      specialties: "Tailored Trousers & Linen Resort Wear",
      baseTailoringFeeInr: 550,
      turnaroundDays: 7,
      weeklyCapacityOrders: 20,
      acceptingCustomOrders: true,
    },
    {
      partnerId: PARTNER_PARADOX_ID,
      specialties: "Technical Outerwear & Precision Alterations",
      baseTailoringFeeInr: 600,
      turnaroundDays: 5,
      weeklyCapacityOrders: 25,
      acceptingCustomOrders: true,
    },
  ];

  for (const tp of tailorProfileSeeds) {
    await db
      .insert(tailorProfiles)
      .values(tp)
      .onConflictDoUpdate({
        target: tailorProfiles.partnerId,
        set: {
          specialties: tp.specialties,
          baseTailoringFeeInr: tp.baseTailoringFeeInr,
          turnaroundDays: tp.turnaroundDays,
          weeklyCapacityOrders: tp.weeklyCapacityOrders,
          acceptingCustomOrders: tp.acceptingCustomOrders,
        },
      });
  }

  // 5. Seed Anthropometric Body Profile (Riya Sen — matches INITIAL_MOCK_BODY_PROFILE)
  console.log("  -> Seeding customer body profile...");
  await db
    .insert(bodyProfiles)
    .values({
      userId: USER_RIYA_ID,
      heightCm: "168.0",
      weightKg: "58.0",
      bodyType: "hourglass",
      chestCm: "92.0",
      waistCm: "70.0",
      hipCm: "98.0",
      shoulderCm: "40.0",
      sleeveCm: "59.0",
      inseamCm: "78.0",
      fitPreference: "regular",
    })
    .onConflictDoUpdate({
      target: bodyProfiles.userId,
      set: {
        heightCm: "168.0",
        weightKg: "58.0",
        bodyType: "hourglass",
        chestCm: "92.0",
        waistCm: "70.0",
        hipCm: "98.0",
        shoulderCm: "40.0",
        sleeveCm: "59.0",
        inseamCm: "78.0",
        fitPreference: "regular",
      },
    });

  // 6. Seed Measurement History (Matches 5-entry log in FitloomProvider)
  console.log("  -> Seeding measurement history log...");
  const historyEntries = [
    {
      id: "30000000-0000-4000-a000-000000000001",
      userId: USER_RIYA_ID,
      chestCm: "92.0",
      waistCm: "70.0",
      note: "Initial profile calibration (Fit Intelligence setup)",
    },
    {
      id: "30000000-0000-4000-a000-000000000002",
      userId: USER_RIYA_ID,
      chestCm: "92.5",
      waistCm: "71.0",
      note: "Post-workout evening measurement check",
    },
    {
      id: "30000000-0000-4000-a000-000000000003",
      userId: USER_RIYA_ID,
      chestCm: "91.8",
      waistCm: "69.5",
      note: "Pre-wedding seasonal bespoke tailoring check",
    },
  ];

  for (const h of historyEntries) {
    await db
      .insert(measurementHistory)
      .values(h)
      .onConflictDoUpdate({
        target: measurementHistory.id,
        set: {
          chestCm: h.chestCm,
          waistCm: h.waistCm,
          note: h.note,
        },
      });
  }

  // 7. Seed Products & Garment Measurements
  console.log("  -> Seeding verified catalog garments & size charts...");
  for (const g of MOCK_GARMENTS) {
    const garmentType =
      g.garmentType ??
      (g.category === "Trousers"
        ? "trousers"
        : g.category === "T-Shirts"
        ? "tshirt"
        : g.category === "Kurtis"
        ? "kurti"
        : "shirt");

    await db
      .insert(products)
      .values({
        id: g.id,
        sellerPartnerId: PARTNER_VERVE_ID,
        name: g.name,
        description: g.description,
        garmentType,
        category: g.category,
        fitType: g.fitType,
        occasion: g.occasion,
        color: g.color,
        swatchHex: g.swatchHex,
        imageUrl: g.image ?? null,
        fabric: g.fabric,
        stretchNote: g.stretchNote,
        priceInr: g.priceInr,
        inventoryQty: 45,
        status: "active",
        moderationStatus: "approved",
        customFitEligible: true,
        ratingAvg: g.rating.toFixed(2),
        reviewCount: g.reviewCount,
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          sellerPartnerId: PARTNER_VERVE_ID,
          name: g.name,
          description: g.description,
          garmentType,
          category: g.category,
          fitType: g.fitType,
          occasion: g.occasion,
          color: g.color,
          swatchHex: g.swatchHex,
          imageUrl: g.image ?? null,
          fabric: g.fabric,
          stretchNote: g.stretchNote,
          priceInr: g.priceInr,
          ratingAvg: g.rating.toFixed(2),
          reviewCount: g.reviewCount,
        },
      });

    // Seed size measurements (S, M, L, XL)
    for (const size of g.sizes) {
      const chestVal = g.chestMapCm[size];
      const waistVal = g.waistMapCm[size];
      if (chestVal || waistVal) {
        await db
          .insert(garmentMeasurements)
          .values({
            productId: g.id,
            size,
            chestCm: chestVal ? chestVal.toFixed(1) : null,
            waistCm: waistVal ? waistVal.toFixed(1) : null,
          })
          .onConflictDoUpdate({
            target: [
              garmentMeasurements.productId,
              garmentMeasurements.size,
            ],
            set: {
              chestCm: chestVal ? chestVal.toFixed(1) : null,
              waistCm: waistVal ? waistVal.toFixed(1) : null,
            },
          });
      }
    }
  }

  console.log("✅ FITLOOM Stage P3-B database seeding completed successfully!");
  return { success: true };
}

// Direct execution entrypoint
if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then((result) => {
      if (result && !result.success) {
        process.exit(0);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
