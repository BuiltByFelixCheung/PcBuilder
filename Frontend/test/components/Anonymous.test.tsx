import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Anonymous } from "@/components/layout/header/Anonymous.tsx";
import { getPostLoginPath } from "@/auth/redirect.ts";

function ShowReturnPath() {
  const location = useLocation();
  return <p>{getPostLoginPath(location.state)}</p>;
}

function renderHeader(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/builds/:buildId" element={<Anonymous />} />
        <Route path="/builds/current" element={<Anonymous />} />
        <Route path="/" element={<Anonymous />} />
        <Route path="/login" element={<ShowReturnPath />} />
        <Route path="/register" element={<ShowReturnPath />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Anonymous", () => {
  it("carries the open build into sign-in and registration", async () => {
    const user = userEvent.setup();
    renderHeader("/builds/build-1");
    await user.click(screen.getByRole("link", { name: "Sign in" }));
    expect(await screen.findByText("/builds/build-1")).toBeInTheDocument();
  });

  it("carries the open build into registration", async () => {
    const user = userEvent.setup();
    renderHeader("/builds/build-1");
    await user.click(screen.getByRole("link", { name: "Create account" }));
    expect(await screen.findByText("/builds/build-1")).toBeInTheDocument();
  });

  it("leaves other pages on the account path", async () => {
    const user = userEvent.setup();
    renderHeader("/");
    await user.click(screen.getByRole("link", { name: "Sign in" }));
    expect(await screen.findByText("/account")).toBeInTheDocument();
  });
});
