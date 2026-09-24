import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authValue } from "../helpers/auth.ts";

const auth = authValue();

vi.mock("@/auth/use-auth.ts", () => ({
  useAuth: () => auth,
}));

import { RegisterPage } from "@/pages/auth/RegisterPage.tsx";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.mocked(auth.register).mockReset().mockResolvedValue(undefined);
  });

  it("rejects mismatched passwords", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText("First name"), "Ann");
    await user.type(screen.getByLabelText("Last name"), "Builder");
    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password2!");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      await screen.findByText("Passwords do not match."),
    ).toBeInTheDocument();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("registers a member", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText("First name"), "Ann");
    await user.type(screen.getByLabelText("Last name"), "Builder");
    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(auth.register).toHaveBeenCalledWith({
      email: "ann@example.com",
      password: "Password1!",
      firstName: "Ann",
      lastName: "Builder",
    });
  });

  it("shows API errors from register", async () => {
    const { AxiosError } = await import("axios");
    const error = new AxiosError("fail");
    error.response = {
      status: 400,
      data: { errors: { email: ["Taken."] } },
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    };
    vi.mocked(auth.register).mockRejectedValue(error);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText("First name"), "Ann");
    await user.type(screen.getByLabelText("Last name"), "Builder");
    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1!");
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Taken.")).toBeInTheDocument();
  });
});
