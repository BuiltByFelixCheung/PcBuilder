import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/auth/auth-context.ts";
import { authValue } from "./helpers/auth.ts";
import App from "@/App.tsx";

vi.mock("@/auth/index.ts", async () => {
  const actual =
    await vi.importActual<typeof import("@/auth/index.ts")>("@/auth/index.ts");
  return actual;
});

describe("App routes", () => {
  it("renders the home chrome", () => {
    render(
      <AuthContext.Provider value={authValue({ isReady: true })}>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(
      screen.getByRole("link", { name: "PC Builder" }),
    ).toBeInTheDocument();
  });
});
