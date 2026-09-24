import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authValue } from "../helpers/auth.ts";

const auth = authValue();

vi.mock("@/auth/use-auth.ts", () => ({
  useAuth: () => auth,
}));

import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage.tsx";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/forgot-password" element={<p>forgot page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.mocked(auth.resetPassword).mockReset().mockResolvedValue(undefined);
  });

  it("rejects incomplete reset links", () => {
    renderAt("/reset-password");
    expect(screen.getByText(/invalid or incomplete/)).toBeInTheDocument();
  });

  it("resets the password and navigates home from the dialog", async () => {
    const user = userEvent.setup();
    renderAt("/reset-password?email=a@b.c&token=tok");
    await user.type(screen.getByLabelText("New Password"), "Password1!");
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "Password1!",
    );
    await user.click(screen.getByRole("button", { name: "Reset Password" }));
    expect(auth.resetPassword).toHaveBeenCalledWith({
      email: "a@b.c",
      token: "tok",
      newPassword: "Password1!",
      confirmNewPassword: "Password1!",
    });
    expect(await screen.findByText("Password reset")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("maps server field and form errors", async () => {
    const { AxiosError } = await import("axios");
    const error = new AxiosError("fail");
    error.response = {
      status: 400,
      data: {
        errors: {
          newPassword: ["Too weak."],
          confirmNewPassword: ["Must match."],
          identity: ["Bad token."],
        },
      },
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    };
    vi.mocked(auth.resetPassword).mockRejectedValue(error);
    const user = userEvent.setup();
    renderAt("/reset-password?email=a@b.c&token=tok");
    await user.type(screen.getByLabelText("New Password"), "Password1!");
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "Password1!",
    );
    await user.click(screen.getByRole("button", { name: "Reset Password" }));
    expect(await screen.findByText("Too weak.")).toBeInTheDocument();
    expect(screen.getByText("Must match.")).toBeInTheDocument();
    expect(screen.getByText("Bad token.")).toBeInTheDocument();
  });

  it("shows a generic error when the server is down", async () => {
    const { AxiosError } = await import("axios");
    const error = new AxiosError("fail");
    error.response = {
      status: 500,
      data: {},
      statusText: "Error",
      headers: {},
      config: {} as never,
    };
    vi.mocked(auth.resetPassword).mockRejectedValue(error);
    const user = userEvent.setup();
    renderAt("/reset-password?email=a@b.c&token=tok");
    await user.type(screen.getByLabelText("New Password"), "Password1!");
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "Password1!",
    );
    await user.click(screen.getByRole("button", { name: "Reset Password" }));
    expect(
      await screen.findByText(/Cannot reach the server/),
    ).toBeInTheDocument();
  });
});
