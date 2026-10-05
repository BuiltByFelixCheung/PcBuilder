import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import type { PcBuildListItem } from "@/api/builds";
import { BrowseBuildPage } from "@/pages/build/BrowseBuildsPage";
import { renderWithQuery } from "../helpers/query";

const listPublicBuilds = vi.fn();

vi.mock("@/api/builds", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/builds")>("@/api/builds");
  return {
    ...actual,
    listPublicBuilds: (...args: unknown[]) => listPublicBuilds(...args),
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
    userId: null,
    userName: null,
    isPublic: true,
  },
];

function renderPage(route = "/builds") {
  return renderWithQuery(
    <Routes>
      <Route path="/builds" element={<BrowseBuildPage />} />
      <Route path="/builds/:buildId" element={<p>Build detail</p>} />
    </Routes>,
    { route },
  );
}

describe("BrowseBuildPage", () => {
  beforeEach(() => {
    listPublicBuilds.mockReset();
  });

  it("lists public builds as cards", async () => {
    listPublicBuilds.mockResolvedValue({
      pageIndex: 0,
      pageSize: 10,
      totalCount: 2,
      items: builds,
    });

    renderPage();

    expect(
      await screen.findByRole("link", { name: "Quiet office" }),
    ).toHaveAttribute("href", "/builds/build-1");
    expect(screen.getByText(/annbuilder/)).toBeInTheDocument();
    expect(screen.getByText(/Low noise daily driver/)).toBeInTheDocument();
    expect(screen.getByText("No description.")).toBeInTheDocument();
    expect(listPublicBuilds).toHaveBeenCalledWith(
      expect.objectContaining({ pageIndex: 0, pageSize: 10 }),
    );
  });

  it("shows an empty state when there are no public builds", async () => {
    listPublicBuilds.mockResolvedValue({
      pageIndex: 0,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });

    renderPage();

    expect(
      await screen.findByText(/No public builds yet/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a build" })).toHaveAttribute(
      "href",
      "/builds/current",
    );
  });

  it("shows an error when the list request fails", async () => {
    listPublicBuilds.mockRejectedValue(new Error("boom"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });
});
