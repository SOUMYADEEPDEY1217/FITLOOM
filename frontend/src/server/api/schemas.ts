import { z } from "zod";
import { BodyProfileSchema } from "@/lib/mock-data";

export const StrictBodyProfileSchema = BodyProfileSchema.strict();

export const UpdateUserMeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(50, "Full name cannot exceed 50 characters.")
    .optional(),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits.")
    .max(18, "Phone number cannot exceed 18 characters.")
    .regex(
      /^[+]?[0-9\s-]{10,18}$/,
      "Enter a valid phone number (e.g. +91 98765 43210 or 10 digits)."
    )
    .optional(),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters.")
    .max(50, "City cannot exceed 50 characters.")
    .optional(),
});

export type UpdateUserMeInput = z.infer<typeof UpdateUserMeSchema>;

export const ProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().trim().optional(),
  garmentType: z.enum(["tshirt", "shirt", "trousers", "kurti"]).optional(),
  search: z.string().trim().optional(),
});
export type ProductsQueryInput = z.infer<typeof ProductsQuerySchema>;

export const FitCheckInputSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  size: z.enum(["S", "M", "L", "XL"]).optional(),
  fitPreference: z.enum(["slim", "regular", "relaxed", "oversized"]).optional(),
});
export type FitCheckInput = z.infer<typeof FitCheckInputSchema>;

// =============================================================================
// CART SCHEMAS
// =============================================================================

export const CartItemInputSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  size: z.enum(["S", "M", "L", "XL"], {
    errorMap: () => ({ message: "Size must be one of: S, M, L, XL" }),
  }),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(10, "Quantity cannot exceed 10")
    .default(1),
});
export type CartItemInput = z.infer<typeof CartItemInputSchema>;

export const CartItemPatchSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(10, "Quantity cannot exceed 10"),
});
export type CartItemPatchInput = z.infer<typeof CartItemPatchSchema>;

// =============================================================================
// ORDER & CHECKOUT SCHEMAS
// =============================================================================

export const CheckoutShippingSchema = z.object({
  name: z.string().trim().min(2, "Customer name must be at least 2 characters").max(100),
  email: z.string().trim().email("Valid email address is required"),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(18, "Phone number cannot exceed 18 characters")
    .regex(/^[+]?[0-9\s-]{10,18}$/, "Enter a valid phone number"),
  address: z.string().trim().min(5, "Shipping address must be at least 5 characters").max(250),
  city: z.string().trim().min(2, "City must be at least 2 characters").max(50),
  state: z.string().trim().min(2, "State must be at least 2 characters").max(50),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Valid 6-digit PIN code required (e.g. 700001)"),
  paymentLabel: z.string().trim().min(1).max(50).default("Demo Card"),
});
export type CheckoutShippingInput = z.infer<typeof CheckoutShippingSchema>;

export const OrderActionSchema = z.object({
  action: z.enum(["cancel", "return"], {
    errorMap: () => ({ message: "Action must be 'cancel' or 'return'" }),
  }),
  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason cannot exceed 500 characters"),
});
export type OrderActionInput = z.infer<typeof OrderActionSchema>;
