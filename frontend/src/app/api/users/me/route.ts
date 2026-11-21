import { eq } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { db } from "@/server/db";
import { users, partners } from "@/server/db/schema";
import { UpdateUserMeSchema } from "@/server/api/schemas";

export const GET = createApiHandler(
  async (ctx) => {
    const userId = ctx.user!.id;

    const userRecords = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        city: users.city,
        image: users.image,
        accountStatus: users.accountStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecords.length === 0) {
      throw new ApiError(404, "USER_NOT_FOUND", "User profile not found");
    }

    const user = userRecords[0];

    // Check if user is also an approved partner
    const partnerList = await db
      .select({
        id: partners.id,
        name: partners.name,
        type: partners.type,
        city: partners.city,
        verificationStatus: partners.verificationStatus,
        operationalStatus: partners.operationalStatus,
      })
      .from(partners)
      .where(eq(partners.ownerUserId, userId))
      .limit(1);

    const partner = partnerList.length > 0 ? partnerList[0] : null;

    return {
      user,
      roles: ctx.roles,
      partner,
    };
  },
  {
    authRequired: true,
  }
);

export const PATCH = createApiHandler(
  async (ctx) => {
    const userId = ctx.user!.id;
    const body = ctx.body;

    const updateFields: {
      name?: string;
      phone?: string;
      city?: string;
      updatedAt?: Date;
    } = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateFields.name = body.name;
    if (body.phone !== undefined) updateFields.phone = body.phone;
    if (body.city !== undefined) updateFields.city = body.city;

    const updated = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        city: users.city,
        image: users.image,
        accountStatus: users.accountStatus,
        updatedAt: users.updatedAt,
      });

    if (updated.length === 0) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    return updated[0];
  },
  {
    authRequired: true,
    schema: UpdateUserMeSchema,
  }
);
