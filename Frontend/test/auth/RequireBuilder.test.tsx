import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "@/auth/auth-context.ts";
import { RequireBuilder } from "@/auth/RequireBuilder.tsx";
import { authValue, testUser } from "../helpers/auth.ts";

function renderGate(auth: ReturnType<typeof authValue>) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={["/build"]}>
        <Routes>
          <Route path="/" element={<p>home page</p>} />
          <Route element={<RequireBuilder />}>
            <Route path="/build" element={<p>builder page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RequireBuilder", () => {
  it("shows a loading state until auth is ready", () => {
    renderGate(authValue({ isReady: false }));
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("lets guests through", () => {
    renderGate(authValue({ isReady: true, isAuthenticated: false, isMember: false }));
    expect(screen.getByText("builder page")).toBeInTheDocument();
  });

  it("redirects authenticated users who are not members", () => {
    renderGate(
      authValue({
        isReady: true,
        isAuthenticated: true,
        isMember: false,
        user: testUser,
      }),
    );
    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("renders the outlet for a member", () => {
    renderGate(
      authValue({
        isReady: true,
        isAuthenticated: true,
        isMember: true,
        user: testUser,
      }),
    );
    expect(screen.getByText("builder page")).toBeInTheDocument();
  });
});
