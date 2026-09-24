import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authValue } from "../helpers/auth.ts";

const auth = authValue();

vi.mock("@/auth/use-auth.ts", () => ({
  useAuth: () => auth,
}));

import { ChangePasswordPage } from "@/pages/auth/ChangePasswordPage.tsx";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/account/password"]}>
      <Routes>
        <Route path="/account/password" element={<ChangePasswordPage />} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    vi.mocked(auth.changePassword).mockReset().mockResolvedValue(undefined);
    vi.mocked(auth.logout).mockReset().mockResolvedValue(undefined);
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(
      await screen.findByText("Current password is required."),
    ).toBeInTheDocument();
    expect(screen.getByText("New password is required.")).toBeInTheDocument();
    expect(screen.getByText("Confirm your new password.")).toBeInTheDocument();
  });

  it("rejects mismatched passwords", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("Current Password"), "OldPassword1!");
    await user.type(screen.getByLabelText("New Password"), "Password1!");
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "Password2!",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(
      await screen.findByText("Passwords do not match."),
    ).toBeInTheDocument();
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it("changes the password and signs out from the dialog", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("Current Password"), "OldPassword1!");
    await user.type(screen.getByLabelText("New Password"), "Password1!");
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "Password1!",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(auth.changePassword).toHaveBeenCalledWith({
      currentPassword: "OldPassword1!",
      newPassword: "Password1!",
      confirmNewPassword: "Password1!",
    });
    expect(await screen.findByText("Password changed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(auth.logout).toHaveBeenCalled();
    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("maps server field and form errors", async () => {
    const { AxiosError } = await import("axios");
    const error = new AxiosError("fail");
    error.response = {
      status: 400,
      data: {
        errors: {
          currentPassword: ["Wrong current password."],
          newPassword: ["Too weak."],
          confirmNewPassword: ["Must match."],
          identity: ["Cannot reuse that password."],
        },
      },
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    };
    vi.mocked(auth.changePassword).mockRejectedValue(error);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("Current Password"), "OldPassword1!");
    await user.type(screen.getByLabelText("New Password"), "Password1!");
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "Password1!",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(
      await screen.findByText("Wrong current password."),
    ).toBeInTheDocument();
    expect(screen.getByText("Too weak.")).toBeInTheDocument();
    expect(screen.getByText("Must match.")).toBeInTheDocument();
    expect(screen.getByText("Cannot reuse that password.")).toBeInTheDocument();
  });

  it("shows a generic error when the API is unreachable", async () => {
    const { AxiosError } = await import("axios");
    const error = new AxiosError("fail");
    error.response = {
      status: 500,
      data: {},
      statusText: "Server Error",
      headers: {},
      config: {} as never,
    };
    vi.mocked(auth.changePassword).mockRejectedValue(error);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("Current Password"), "OldPassword1!");
    await user.type(screen.getByLabelText("New Password"), "Password1!");
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "Password1!",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot reach the server. Is the API running?",
    );
  });

  it("shows a non-validation API error on the form", async () => {
    const { AxiosError } = await import("axios");
    const error = new AxiosError("fail");
    error.response = {
      status: 409,
      data: { title: "Password recently used." },
      statusText: "Conflict",
      headers: {},
      config: {} as never,
    };
    vi.mocked(auth.changePassword).mockRejectedValue(error);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("Current Password"), "OldPassword1!");
    await user.type(screen.getByLabelText("New Password"), "Password1!");
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "Password1!",
    );
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password recently used.",
    );
  });
});
