import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "@/auth/auth-context.ts";
import { RequireGuest } from "@/auth/RequireGuest.tsx";
import { authValue, testUser } from "../helpers/auth.ts";

function renderGuest(auth: ReturnType<typeof authValue>) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/account" element={<p>account page</p>} />
          <Route element={<RequireGuest />}>
            <Route path="/login" element={<p>guest form</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RequireGuest", () => {
  it("shows loading, redirects members, and renders guests", () => {
    const { rerender } = renderGuest(authValue({ isReady: false }));
    expect(screen.getByText("Loading…")).toBeInTheDocument();

    rerender(
      <AuthContext.Provider
        value={authValue({
          isReady: true,
          isAuthenticated: true,
          user: testUser,
        })}
      >
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/account" element={<p>account page</p>} />
            <Route element={<RequireGuest />}>
              <Route path="/login" element={<p>guest form</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );
  });

  it("renders the outlet for guests", () => {
    renderGuest(authValue({ isReady: true, isAuthenticated: false }));
    expect(screen.getByText("guest form")).toBeInTheDocument();
  });
});
