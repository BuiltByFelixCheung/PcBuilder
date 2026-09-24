import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthRoles } from "@/auth/types.ts";
import { authValue, testUser } from "../helpers/auth.ts";

const auth = authValue({
  user: { ...testUser, roles: [] },
  isAuthenticated: true,
  isAdmin: false,
  isMember: false,
});

vi.mock("@/auth/use-auth.ts", () => ({
  useAuth: () => auth,
}));

import { AccountPage } from "@/pages/auth/AccountPage.tsx";

describe("AccountPage", () => {
  it("renders nothing without a user", async () => {
    auth.user = null;
    const { container } = render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows profile details and signs out", async () => {
    auth.user = { ...testUser, roles: [AuthRoles.Admin, AuthRoles.Member] };
    auth.isAdmin = true;
    auth.isMember = true;
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Ann Builder")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.logout).toHaveBeenCalled();
  });
});
