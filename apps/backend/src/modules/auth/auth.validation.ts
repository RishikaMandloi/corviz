import { z } from "zod";

/**
 * Register Validation Schema
 */
export const registerUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters.")
    .max(50, "First name cannot exceed 50 characters."),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters.")
    .max(50, "Last name cannot exceed 50 characters."),

  email: z
    .email("Please enter a valid email address.")
    .transform((email) => email.trim().toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password cannot exceed 100 characters."),
});

/**
 * Login Validation Schema
 */
export const loginUserSchema = z.object({
  email: z
    .email("Please enter a valid email address.")
    .transform((email) => email.trim().toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required."),
});