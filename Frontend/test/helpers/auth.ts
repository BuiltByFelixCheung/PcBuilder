import { vi } from "vitest";
import {
  AuthRoles,
  type AuthContextValue,
  type CurrentUser,
} from "@/auth/types.ts";

export const testUser: CurrentUser = {
  id: "user-1",
  email: "a@b.c",
  firstName: "Ann",
  lastName: "Builder",
  roles: [AuthRoles.Member],
};

export function authValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: null,
    accessToken: null,
    isReady: true,
    isAuthenticated: false,
    isAdmin: false,
    isMember: false,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    hasRole: vi.fn().mockReturnValue(false),
    forgotPassword: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    changePassword: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
