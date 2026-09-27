import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "@/auth/auth-context.ts";
import { RequireAdmin } from "@/auth/RequireAdmin.tsx";
import { authValue, testUser } from "../helpers/auth.ts";

function renderGate(auth: ReturnType<typeof authValue>) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/" element={<p>home page</p>} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<p>admin page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RequireAdmin", () => {
  it("shows a loading state until auth is ready", () => {
    renderGate(authValue({ isReady: false }));
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("redirects guests to login", () => {
    renderGate(authValue({ isReady: true, isAuthenticated: false }));
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("redirects authenticated non-admins home", () => {
    renderGate(
      authValue({
        isReady: true,
        isAuthenticated: true,
        isAdmin: false,
        user: testUser,
      }),
    );
    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("renders the outlet for an admin", () => {
    renderGate(
      authValue({
        isReady: true,
        isAuthenticated: true,
        isAdmin: true,
        user: testUser,
      }),
    );
    expect(screen.getByText("admin page")).toBeInTheDocument();
  });
});
