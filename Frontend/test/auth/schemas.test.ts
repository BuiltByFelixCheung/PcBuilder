import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/auth/schemas.ts";

describe("auth schemas", () => {
  it("accepts valid login values and rejects blanks", () => {
    expect(
      loginSchema.safeParse({ email: " ann@example.com ", password: "secret" })
        .success,
    ).toBe(true);
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(
      false,
    );
    expect(
      loginSchema.safeParse({ email: "nope", password: "x" }).success,
    ).toBe(false);
  });

  it("requires matching register passwords of at least 10 characters", () => {
    const valid = {
      firstName: "Ann",
      lastName: "Builder",
      email: "ann@example.com",
      password: "Password1!",
      confirmPassword: "Password1!",
    };
    expect(registerSchema.safeParse(valid).success).toBe(true);
    expect(
      registerSchema.safeParse({
        ...valid,
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...valid, confirmPassword: "Password2!" })
        .success,
    ).toBe(false);
  });

  it("validates forgot and reset password payloads", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "ann@example.com" }).success,
    ).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        password: "Password1!",
        confirmPassword: "Password1!",
      }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        password: "Password1!",
        confirmPassword: "other",
      }).success,
    ).toBe(false);
  });

  it("requires matching change-password values of at least 10 characters", () => {
    const valid = {
      currentPassword: "OldPassword1!",
      newPassword: "Password1!",
      confirmNewPassword: "Password1!",
    };
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        newPassword: "short",
        confirmNewPassword: "short",
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        confirmNewPassword: "Password2!",
      }).success,
    ).toBe(false);
  });
});
