import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const get = vi.fn();

vi.mock("@/api/client.ts", () => ({
  api: {
    post: (...args: unknown[]) => post(...args),
    get: (...args: unknown[]) => get(...args),
  },
}));

import {
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
  resetPasswordRequest,
} from "@/api/auth.ts";

describe("auth API", () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
  });

  it("posts login, register, logout, forgot, and reset", async () => {
    post.mockResolvedValue({ data: { ok: true } });
    await expect(loginRequest("a@b.c", "pw")).resolves.toEqual({ ok: true });
    await expect(
      registerRequest({
        email: "a@b.c",
        password: "pw",
        firstName: "A",
        lastName: "B",
      }),
    ).resolves.toEqual({ ok: true });
    await logoutRequest();
    await forgotPasswordRequest({ email: "a@b.c" });
    await resetPasswordRequest({
      email: "a@b.c",
      token: "t",
      newPassword: "Password1!",
      confirmNewPassword: "Password1!",
    });
    expect(post).toHaveBeenCalledTimes(5);
  });

  it("gets the current user", async () => {
    get.mockResolvedValue({ data: { email: "a@b.c" } });
    await expect(meRequest()).resolves.toEqual({ email: "a@b.c" });
  });
});
