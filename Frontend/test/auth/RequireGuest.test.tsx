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
  it("renders the form before the session is known and redirects members", () => {
    const { rerender } = renderGuest(authValue({ isReady: false }));
    expect(screen.getByText("guest form")).toBeInTheDocument();

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
    expect(screen.getByText("account page")).toBeInTheDocument();
  });

  it("renders the outlet for guests", () => {
    renderGuest(authValue({ isReady: true, isAuthenticated: false }));
    expect(screen.getByText("guest form")).toBeInTheDocument();
  });
});
