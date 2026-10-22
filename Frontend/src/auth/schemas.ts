import { z } from "zod";
import { ui } from "@/i18n/translate-enum";

export function loginSchema() {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, ui.message("emailRequired"))
      .email(ui.message("emailInvalid")),
    password: z.string().min(1, ui.message("passwordRequired")),
  });
}

export function registerSchema() {
  return z
    .object({
      userName: z
        .string()
        .trim()
        .min(1, ui.message("usernameRequired"))
        .max(100)
        .refine((value) => !value.includes("@"), {
          message: ui.message("usernameNotEmail"),
        }),
      email: z
        .string()
        .trim()
        .min(1, ui.message("emailRequired"))
        .email(ui.message("emailInvalid")),
      password: z
        .string()
        .min(1, ui.message("passwordRequired"))
        .min(10, ui.message("passwordTooShort")),
      confirmPassword: z.string().min(1, ui.message("confirmPasswordRequired")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      message: ui.message("passwordsMismatch"),
    })
    .refine(
      (values) => values.userName.toLowerCase() !== values.email.toLowerCase(),
      {
        path: ["userName"],
        message: ui.message("usernameDifferentFromEmail"),
      },
    );
}

export function forgotPasswordSchema() {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, ui.message("emailRequired"))
      .email(ui.message("emailInvalid")),
  });
}

export function resetPasswordSchema() {
  return z
    .object({
      password: z
        .string()
        .min(1, ui.message("passwordRequired"))
        .min(10, ui.message("passwordTooShort")),
      confirmPassword: z.string().min(1, ui.message("confirmPasswordRequired")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      message: ui.message("passwordsMismatch"),
    });
}

export function changePasswordSchema() {
  return z
    .object({
      currentPassword: z.string().min(1, ui.message("currentPasswordRequired")),
      newPassword: z
        .string()
        .min(1, ui.message("newPasswordRequired"))
        .min(10, ui.message("newPasswordTooShort")),
      confirmNewPassword: z.string().min(1, ui.message("confirmNewPasswordRequired")),
    })
    .refine((values) => values.newPassword === values.confirmNewPassword, {
      path: ["confirmNewPassword"],
      message: ui.message("passwordsMismatch"),
    });
}

export type ForgotPasswordValues = z.infer<ReturnType<typeof forgotPasswordSchema>>;
export type ResetPasswordValues = z.infer<ReturnType<typeof resetPasswordSchema>>;
export type LoginValues = z.infer<ReturnType<typeof loginSchema>>;
export type RegisterValues = z.infer<ReturnType<typeof registerSchema>>;
export type ChangePasswordValues = z.infer<ReturnType<typeof changePasswordSchema>>;
