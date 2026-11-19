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
  it.each([
    {
      path: "/builds/build-1",
      link: "Sign in",
      expected: "/builds/build-1",
    },
    {
      path: "/builds/build-1",
      link: "Create account",
      expected: "/builds/build-1",
    },
    {
      path: "/",
      link: "Sign in",
      expected: "/account",
    },
  ])(
    "from $path, $link returns $expected",
    async ({ path, link, expected }) => {
      const user = userEvent.setup();
      renderHeader(path);
      await user.click(screen.getByRole("link", { name: link }));
      expect(await screen.findByText(expected)).toBeInTheDocument();
    },
  );
});
