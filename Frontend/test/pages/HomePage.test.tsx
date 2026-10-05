import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "@/auth/auth-context.ts";
import { HomePage } from "@/pages/HomePage.tsx";
import { authValue } from "../helpers/auth.ts";

function renderHome(auth = authValue()) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("HomePage", () => {
  it("links guests into the builder, public builds, and catalog", () => {
    renderHome();
    expect(
      screen.getByRole("heading", { name: "PC Builder" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open builder" })).toHaveAttribute(
      "href",
      "/builds/current",
    );
    expect(
      screen.getByRole("link", { name: "View public builds" }),
    ).toHaveAttribute("href", "/builds");
    expect(
      screen.getByRole("link", { name: "Browse chassis" }),
    ).toHaveAttribute("href", "/catalog/chassis");
  });

  it("hides builder and browse links for admins", () => {
    renderHome(authValue({ isAdmin: true, isAuthenticated: true }));
    expect(
      screen.queryByRole("link", { name: "Open builder" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View public builds" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse chassis" }),
    ).toBeInTheDocument();
  });
});
