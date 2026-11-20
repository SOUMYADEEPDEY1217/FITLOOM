import { z } from "zod";

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required.")
  .min(2, "Full name must be at least 2 characters.")
  .max(50, "Full name cannot exceed 50 characters.");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email address is required.")
  .email("Enter a valid email address (e.g. name@domain.com).")
  .max(80, "Email address cannot exceed 80 characters.");

export const passwordSchema = z
  .string()
  .min(1, "Password is required.")
  .min(6, "Password must be at least 6 characters.")
  .max(64, "Password cannot exceed 64 characters.");

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter any 6-digit simulated OTP (e.g. 123456).");

export const LoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const RegisterSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export function extractZodFieldErrors<T extends string>(
  error: z.ZodError
): Partial<Record<T, string>> {
  const fieldErrors: Partial<Record<T, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as T | undefined;
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export function deriveDisplayNameFromEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized === "riya.demo@fitloom.local") return "Riya Sharma";
  if (normalized === "tailor.demo@fitloom.local") {
    return "Atelier Arjun (Demo Tailor)";
  }
  const localPart = normalized.split("@")[0]?.trim() || "";
  if (!localPart) return "Demo Member";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
