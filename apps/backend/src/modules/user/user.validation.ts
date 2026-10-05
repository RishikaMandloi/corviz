import { z } from "zod";

/**
 * Update Current User
 */
export const updateCurrentUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .optional(),
});

/**
 * Change Password
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Current password must be at least 8 characters."),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(100, "New password cannot exceed 100 characters."),
  })
  .refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: "New password must be different from current password.",
      path: ["newPassword"],
    }
  );