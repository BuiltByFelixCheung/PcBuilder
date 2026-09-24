import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authValue } from "../helpers/auth.ts";

const auth = authValue();

vi.mock("@/auth/use-auth.ts", () => ({
  useAuth: () => auth,
}));

import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage.tsx";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.mocked(auth.forgotPassword).mockReset().mockResolvedValue(undefined);
  });

  it("opens the success dialog and closes it", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));
    expect(
      await screen.findByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    const dialog = screen
      .getByRole("heading", { name: "Check your email" })
      .closest("dialog");
    expect(dialog).toHaveAttribute("open");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(dialog).not.toHaveAttribute("open");
  });

  it("shows API errors", async () => {
    const { AxiosError } = await import("axios");
    const error = new AxiosError("fail");
    error.response = {
      status: 500,
      data: {},
      statusText: "Error",
      headers: {},
      config: {} as never,
    };
    vi.mocked(auth.forgotPassword).mockRejectedValue(error);
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Cannot reach the server/,
    );
  });
});
