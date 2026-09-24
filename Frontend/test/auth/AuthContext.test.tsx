import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRoles, type AuthTokens } from "@/auth/types.ts";
import { useAuth } from "@/auth/use-auth.ts";

const loginRequest = vi.fn();
const logoutRequest = vi.fn();
const registerRequest = vi.fn();
const forgotPasswordRequest = vi.fn();
const resetPasswordRequest = vi.fn();
const bindAuthBridge = vi.fn();
const refreshSession = vi.fn();

vi.mock("@/api/auth.ts", () => ({
  loginRequest: (...args: unknown[]) => loginRequest(...args),
  logoutRequest: (...args: unknown[]) => logoutRequest(...args),
  registerRequest: (...args: unknown[]) => registerRequest(...args),
  forgotPasswordRequest: (...args: unknown[]) => forgotPasswordRequest(...args),
  resetPasswordRequest: (...args: unknown[]) => resetPasswordRequest(...args),
}));

vi.mock("@/api/client.ts", () => ({
  bindAuthBridge: (...args: unknown[]) => bindAuthBridge(...args),
  refreshSession: (...args: unknown[]) => refreshSession(...args),
}));

import { AuthProvider } from "@/auth/AuthContext.tsx";

const tokens: AuthTokens = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresInSeconds: 60,
  user: {
    id: "1",
    email: "a@b.c",
    firstName: "Ann",
    lastName: "Builder",
    roles: [AuthRoles.Admin, AuthRoles.Member],
  },
};

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <p>ready:{String(auth.isReady)}</p>
      <p>user:{auth.user?.email ?? "none"}</p>
      <p>admin:{String(auth.isAdmin)}</p>
      <button type="button" onClick={() => void auth.login("a@b.c", "pw")}>
        login
      </button>
      <button
        type="button"
        onClick={() =>
          void auth.register({
            email: "a@b.c",
            password: "pw",
            firstName: "Ann",
            lastName: "Builder",
          })
        }
      >
        register
      </button>
      <button
        type="button"
        onClick={() => void auth.logout().catch(() => undefined)}
      >
        logout
      </button>
      <button
        type="button"
        onClick={() => void auth.forgotPassword({ email: "a@b.c" })}
      >
        forgot
      </button>
      <button
        type="button"
        onClick={() =>
          void auth.resetPassword({
            email: "a@b.c",
            token: "t",
            newPassword: "Password1!",
            confirmNewPassword: "Password1!",
          })
        }
      >
        reset
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshSession.mockResolvedValue(null);
    loginRequest.mockResolvedValue(tokens);
    registerRequest.mockResolvedValue(tokens.user);
    logoutRequest.mockResolvedValue({});
    forgotPasswordRequest.mockResolvedValue({});
    resetPasswordRequest.mockResolvedValue({});
  });

  it("becomes ready and binds the auth bridge", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText("ready:true")).toBeInTheDocument(),
    );
    expect(bindAuthBridge).toHaveBeenCalled();
  });

  it("logs in, registers, logs out, and handles password flows", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText("ready:true")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() =>
      expect(screen.getByText("user:a@b.c")).toBeInTheDocument(),
    );
    expect(screen.getByText("admin:true")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() =>
      expect(screen.getByText("user:none")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "register" }));
    expect(registerRequest).toHaveBeenCalled();
    expect(loginRequest).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "forgot" }));
    expect(forgotPasswordRequest).toHaveBeenCalledWith({ email: "a@b.c" });

    await user.click(screen.getByRole("button", { name: "reset" }));
    expect(resetPasswordRequest).toHaveBeenCalled();
  });

  it("still clears the session if logout fails", async () => {
    logoutRequest.mockRejectedValue(new Error("offline"));
    loginRequest.mockResolvedValue(tokens);
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText("ready:true")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() =>
      expect(screen.getByText("user:a@b.c")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() =>
      expect(screen.getByText("user:none")).toBeInTheDocument(),
    );
  });
});
