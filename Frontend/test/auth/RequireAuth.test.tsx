import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "@/auth/auth-context.ts";
import { RequireAuth } from "@/auth/RequireAuth.tsx";
import { AuthRoles } from "@/auth/types.ts";
import { authValue, testUser } from "../helpers/auth.ts";

function renderAuth(
  auth: ReturnType<typeof authValue>,
  path = "/account",
  role?: (typeof AuthRoles)[keyof typeof AuthRoles],
) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route element={<RequireAuth role={role} />}>
            <Route path="/account" element={<p>secret</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RequireAuth", () => {
  it("shows a loading state until auth is ready", () => {
    renderAuth(authValue({ isReady: false }));
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("redirects guests to login", () => {
    renderAuth(authValue({ isReady: true, isAuthenticated: false }));
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("blocks authenticated users without the required role", () => {
    renderAuth(
      authValue({
        isReady: true,
        isAuthenticated: true,
        user: testUser,
        hasRole: () => false,
      }),
      "/account",
      AuthRoles.Admin,
    );
    expect(screen.getByText("Not allowed")).toBeInTheDocument();
  });

  it("renders the outlet when authenticated", () => {
    renderAuth(
      authValue({
        isReady: true,
        isAuthenticated: true,
        user: testUser,
        hasRole: () => true,
      }),
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
  });
});
