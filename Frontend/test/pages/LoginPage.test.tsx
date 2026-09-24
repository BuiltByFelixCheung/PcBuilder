import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authValue } from "../helpers/auth.ts";

const auth = authValue();

vi.mock("@/auth/use-auth.ts", () => ({
  useAuth: () => auth,
}));

import { LoginPage } from "@/pages/auth/LoginPage.tsx";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(auth.login).mockReset().mockResolvedValue(undefined);
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("submits credentials", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(auth.login).toHaveBeenCalledWith("ann@example.com", "secret");
  });

  it("shows API errors", async () => {
    const { AxiosError } = await import("axios");
    const error = new AxiosError("fail");
    error.response = {
      status: 401,
      data: {},
      statusText: "Unauthorized",
      headers: {},
      config: {} as never,
    };
    vi.mocked(auth.login).mockRejectedValue(error);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
  });
});
