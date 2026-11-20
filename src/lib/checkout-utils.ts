import { z } from "zod";
import {
  BodyProfile,
  BodyProfileSchema,
  MOCK_GARMENTS,
  MockGarment,
} from "@/lib/mock-data";
import type {
  MockCartItem,
  MockOrder,
  MockUser,
  PlaceMockOrderInput,
  PlaceMockOrderResult,
} from "@/components/providers/fitloom-provider";

export interface CartItemValidationIssue {
  itemId: string;
  garmentId: string;
  name: string;
  reason: string;
}

export interface ValidatedCartResult {
  isValid: boolean;
  isEmpty: boolean;
  issues: CartItemValidationIssue[];
  resolvedItems: Array<{
    item: MockCartItem;
    garment: MockGarment | null;
    isValid: boolean;
    error: string | null;
  }>;
  subtotalInr: number;
  totalUnits: number;
}

/**
 * Validates cart items strictly against MOCK_GARMENTS and available sizes.
 * Never mutates or falls back to a different size.
 */
export function validateCartItems(
  cart: readonly MockCartItem[],
  catalogue: readonly MockGarment[] = MOCK_GARMENTS
): ValidatedCartResult {
  if (cart.length === 0) {
    return {
      isValid: false,
      isEmpty: true,
      issues: [],
      resolvedItems: [],
      subtotalInr: 0,
      totalUnits: 0,
    };
  }

  const issues: CartItemValidationIssue[] = [];
  let subtotalInr = 0;
  let totalUnits = 0;

  const resolvedItems = cart.map((item) => {
    const garment = catalogue.find((g) => g.id === item.garmentId) ?? null;
    let error: string | null = null;

    if (!garment) {
      error = `Product "${item.name}" (${item.garmentId}) is no longer in the catalogue.`;
    } else if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      error = `Invalid quantity (${item.quantity}) for ${garment.name}.`;
    } else if (!item.size) {
      error = `No size was selected for ${garment.name}.`;
    } else if (
      item.size !== "CUSTOMFIT" &&
      !garment.sizes.includes(item.size)
    ) {
      error = `Selected size "${item.size}" is unavailable for ${garment.name} (available: ${
        garment.sizes.length > 0 ? garment.sizes.join(", ") : "none"
      }).`;
    }

    if (error) {
      issues.push({
        itemId: item.id,
        garmentId: item.garmentId,
        name: item.name,
        reason: error,
      });
    }

    const lineTotal = item.priceInr * Math.max(0, item.quantity);
    subtotalInr += lineTotal;
    totalUnits += Math.max(0, item.quantity);

    return {
      item,
      garment,
      isValid: error === null,
      error,
    };
  });

  return {
    isValid: issues.length === 0,
    isEmpty: false,
    issues,
    resolvedItems,
    subtotalInr,
    totalUnits,
  };
}

export const CheckoutCustomerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be 100 characters or fewer."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15;
      },
      { message: "Enter a valid 10 to 15 digit phone number." }
    ),
  street: z
    .string()
    .trim()
    .min(5, "Shipping address must be at least 5 characters.")
    .max(300, "Shipping address must be 300 characters or fewer."),
  city: z
    .string()
    .trim()
    .min(2, "City is required.")
    .max(80, "City must be 80 characters or fewer."),
  state: z
    .string()
    .trim()
    .min(2, "State / Province is required.")
    .max(80, "State / Province must be 80 characters or fewer."),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit PIN / postal code."),
});

export type CheckoutCustomerInput = z.infer<typeof CheckoutCustomerSchema>;
export type CheckoutFieldKey = keyof CheckoutCustomerInput;

export const DEMO_PAYMENT_METHODS = [
  "Simulated UPI (Demo)",
  "Simulated Card (Demo)",
  "Cash on Delivery (Demo)",
] as const;

export type DemoPaymentMethod = (typeof DEMO_PAYMENT_METHODS)[number];

/**
 * Generates a unique FT-XXXX demo order ID that does not collide with existing orders.
 */
export function generateUniqueOrderId(existingIds: ReadonlySet<string>): string {
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = `FT-${Math.floor(1050 + Math.random() * 8900)}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }
  return `FT-${Date.now().toString().slice(-6)}`;
}

/**
 * Resolves the measurement snapshot for a CUSTOMFIT order cleanly:
 * 1. Uses explicitly validated manual/form CUSTOMFIT measurements attached to the cart item.
 * 2. Falls back to the customer's saved Body Profile ONLY when hasBodyProfile === true and valid.
 * 3. Never uses stale/retained measurements when hasBodyProfile === false.
 */
export function resolveCustomFitOrderSnapshot(params: {
  hasCustom: boolean;
  customFitItems: readonly MockCartItem[];
  bodyProfile?: BodyProfile | null;
  hasBodyProfile?: boolean;
}): BodyProfile | undefined {
  const { hasCustom, customFitItems, bodyProfile, hasBodyProfile = false } =
    params;

  if (!hasCustom) {
    return undefined;
  }

  for (const item of customFitItems) {
    if (!item.customFitMeasurements) continue;
    const parsedItemMeasurements = BodyProfileSchema.safeParse(
      item.customFitMeasurements
    );
    if (parsedItemMeasurements.success) {
      return { ...parsedItemMeasurements.data };
    }
  }

  if (hasBodyProfile && bodyProfile) {
    const parsedProfile = BodyProfileSchema.safeParse(bodyProfile);
    if (parsedProfile.success) {
      return { ...parsedProfile.data };
    }
  }

  return undefined;
}

/**
 * Deterministic order builder verifying non-guest role, non-empty cart, and valid item sizes.
 */
export function buildValidatedMockOrder(params: {
  user: MockUser;
  cart: readonly MockCartItem[];
  existingOrders: readonly MockOrder[];
  bodyProfile: BodyProfile;
  hasBodyProfile?: boolean;
  input: PlaceMockOrderInput;
  createdAt: string;
  catalogue?: readonly MockGarment[];
}): PlaceMockOrderResult {
  const {
    user,
    cart,
    existingOrders,
    bodyProfile,
    hasBodyProfile = false,
    input,
    createdAt,
    catalogue = MOCK_GARMENTS,
  } = params;

  if (user.role === "guest") {
    return {
      ok: false,
      error: "Please sign in to a customer account before placing a demo order.",
    };
  }

  const cartValidation = validateCartItems(cart, catalogue);
  if (cartValidation.isEmpty) {
    return {
      ok: false,
      error: "Your shopping bag is empty. Add items before checking out.",
    };
  }
  if (!cartValidation.isValid) {
    return {
      ok: false,
      error:
        cartValidation.issues[0]?.reason ??
        "One or more items in your bag have invalid or unavailable sizes.",
    };
  }

  const existingIds = new Set(existingOrders.map((o) => o.id));
  const orderId = generateUniqueOrderId(existingIds);
  const snapshotItems: MockCartItem[] = cart.map((item) => ({
    ...item,
    customFitMeasurements: item.customFitMeasurements
      ? { ...item.customFitMeasurements }
      : undefined,
  }));
  const customFitItems = snapshotItems.filter((i) => i.size === "CUSTOMFIT");
  const hasCustom = customFitItems.length > 0;
  const customItem = customFitItems[0];
  const measurementsSnapshot = resolveCustomFitOrderSnapshot({
    hasCustom,
    customFitItems,
    bodyProfile,
    hasBodyProfile,
  });

  const resolvedCustomerId =
    user.id ??
    (user.email ? `user-${user.email.trim().toLowerCase()}` : undefined);

  const newOrder: MockOrder = {
    id: orderId,
    customerId: resolvedCustomerId,
    customerName:
      input.customerName?.trim() || user.name || "Demo Customer",
    customerEmail: input.customerEmail?.trim() || user.email || undefined,
    customerPhone: input.customerPhone?.trim() || user.phone || undefined,
    createdAt,
    items: snapshotItems,
    totalInr: cartValidation.subtotalInr,
    shippingCity: input.shippingCity.trim(),
    shippingAddress: input.shippingAddress?.trim() || undefined,
    shippingState: input.shippingState?.trim() || undefined,
    shippingPincode: input.shippingPincode?.trim() || undefined,
    paymentLabel: input.paymentLabel,
    isCustomFit: hasCustom,
    tailorName: customItem?.tailorName,
    stage: hasCustom ? "Pending Tailor Acceptance" : "Placed",
    measurementsSnapshot,
  };

  return { ok: true, order: newOrder };
}
