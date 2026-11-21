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
