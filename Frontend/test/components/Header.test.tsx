import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/auth/types.ts";
import { testUser } from "../helpers/auth.ts";
import { Header } from "@/components/header";
import { AppHeader } from "@/components/AppHeader.tsx";
import { AppLayout } from "@/components/AppLayout.tsx";
import { PageStatus } from "@/components/PageStatus.tsx";
import { HomePage } from "@/pages/HomePage.tsx";

const auth: {
  isReady: boolean;
  isAuthenticated: boolean;
  user: CurrentUser | null;
  isAdmin: boolean;
  isMember: boolean;
  logout: ReturnType<typeof vi.fn>;
} = {
  isReady: true,
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  isMember: false,
  logout: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/auth/useAuth.ts", () => ({
  useAuth: () => auth,
}));

describe("header chrome", () => {
  it("renders guest links and signed-in actions", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MemoryRouter>
        <Header
          isAuthenticated={false}
          user={null}
          isAdmin={false}
          isMember={false}
          handleLogout={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();

    const logout = vi.fn().mockResolvedValue(undefined);
    rerender(
      <MemoryRouter>
        <Header
          isAuthenticated
          user={testUser}
          isAdmin
          isMember
          handleLogout={logout}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(testUser.email)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(logout).toHaveBeenCalled();
  });

  it("hides nav actions until auth is ready, then signs out", async () => {
    auth.isReady = false;
    const { rerender } = render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("link", { name: "Sign in" }),
    ).not.toBeInTheDocument();

    auth.isReady = true;
    auth.isAuthenticated = true;
    auth.user = testUser;
    const user = userEvent.setup();
    rerender(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.logout).toHaveBeenCalled();
  });

  it("renders layout and empty home", () => {
    const layout = render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );
    expect(
      layout.getByRole("link", { name: "PC Builder" }),
    ).toBeInTheDocument();
    layout.unmount();
    expect(render(<HomePage />).container).toBeInTheDocument();
    expect(
      render(<PageStatus>Wait</PageStatus>).getByText("Wait"),
    ).toBeInTheDocument();
  });

  it("opens the catalog navigation menu", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Catalog" }));
    expect(screen.getByRole("link", { name: "CPUs" })).toHaveAttribute(
      "href",
      "/catalog/cpus",
    );
    expect(screen.getByRole("link", { name: "PSUs" })).toHaveAttribute(
      "href",
      "/catalog/psus",
    );
    expect(screen.getByRole("link", { name: "Storage" })).toHaveAttribute(
      "href",
      "/catalog/storage",
    );
    expect(screen.getByRole("link", { name: "Motherboards" })).toHaveAttribute(
      "href",
      "/catalog/motherboards",
    );
  });
});
