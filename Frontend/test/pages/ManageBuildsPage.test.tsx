import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import type { PcBuildListItem } from "@/api/builds";
import { ManageBuildsPage } from "@/pages/build/ManageBuildsPage";
import { renderWithQuery } from "../helpers/query";

const listMyBuilds = vi.fn();
const deletePcBuilds = vi.fn();

vi.mock("@/api/builds", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/builds")>("@/api/builds");
  return {
    ...actual,
    listMyBuilds: (...args: unknown[]) => listMyBuilds(...args),
    deletePcBuilds: (...args: unknown[]) => deletePcBuilds(...args),
  };
});

const builds: PcBuildListItem[] = [
  {
    id: "build-1",
    name: "Quiet office",
    description: "Low noise daily driver",
    userId: "user-1",
    userName: "annbuilder",
    isPublic: true,
  },
  {
    id: "build-2",
    name: "LAN party",
    description: "",
    userId: "user-1",
    userName: "annbuilder",
    isPublic: false,
  },
];

function renderPage(route = "/builds/me") {
  return renderWithQuery(
    <Routes>
      <Route path="/builds/me" element={<ManageBuildsPage />} />
    </Routes>,
    { route },
  );
}

describe("ManageBuildsPage", () => {
  beforeEach(() => {
    listMyBuilds.mockReset();
    deletePcBuilds.mockReset();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("bulk-deletes the selected builds", async () => {
    const user = userEvent.setup();
    listMyBuilds.mockResolvedValue({
      pageIndex: 0,
      pageSize: 10,
      totalCount: 2,
      items: builds,
    });
    deletePcBuilds.mockResolvedValue(undefined);

    renderPage();

    expect(
      await screen.findByRole("link", { name: "Quiet office" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Select Quiet office" }));
    await user.click(screen.getByRole("checkbox", { name: "Select LAN party" }));
    await user.click(screen.getByRole("button", { name: "Delete selected" }));

    await waitFor(() => {
      expect(deletePcBuilds).toHaveBeenCalledWith({
        ids: ["build-1", "build-2"],
      });
    });
  });
});
