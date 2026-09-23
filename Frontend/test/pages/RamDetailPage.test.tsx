import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemoryDetail } from "@/api/catalog/memories";
import { Route, Routes } from "react-router-dom";

const getMemoryById = vi.fn();

vi.mock("@/api/catalog/memories", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/memories")>(
    "@/api/catalog/memories",
  );
  return {
    ...actual,
    getMemoryById: (...args: unknown[]) => getMemoryById(...args),
  };
});

import { RamDetailPage } from "@/pages/catalog/memories/RamDetailPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const ram: MemoryDetail = {
  id: "ram-1",
  name: "Trident Z5",
  manufacturerId: "gskill",
  manufacturerName: "G.Skill",
  color: "Black",
  ddrGeneration: "Ddr5",
  ramFormFactor: "UDimm",
  ramRank: "DualRank",
  memorySizePerStickGb: 16,
  totalMemorySizeGb: 32,
  modulesCount: 2,
  maxMemorySpeedMts: 6000,
  heightMm: 44,
};

function renderDetail(route = "/catalog/memories/ram-1") {
  return renderWithQuery(
    <Routes>
      <Route path="/catalog/memories/:memoryId" element={<RamDetailPage />} />
    </Routes>,
    { route },
  );
}

describe("RamDetailPage", () => {
  beforeEach(() => {
    getMemoryById.mockReset();
  });

  it("renders RAM details", async () => {
    getMemoryById.mockResolvedValue(ram);
    renderDetail();
    expect(
      await screen.findByRole("heading", { name: "Trident Z5" }),
    ).toBeInTheDocument();
    expect(screen.getByText("G.Skill")).toBeInTheDocument();
    expect(screen.getByText("Ddr5")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to RAM" })).toHaveAttribute(
      "href",
      "/catalog/memories",
    );
  });

  it("shows loading and error states", async () => {
    getMemoryById.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(await screen.findByText("Loading RAM…")).toBeInTheDocument();

    getMemoryById.mockRejectedValue(new Error("fail"));
    renderDetail();
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("shows not found when RAM is missing", async () => {
    getMemoryById.mockResolvedValue(null);
    renderDetail();
    expect(await screen.findByText("RAM not found.")).toBeInTheDocument();
  });
});
