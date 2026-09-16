import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemoryDetail } from "@/api/catalog/memories";

const listMemories = vi.fn();
const listManufacturersByProductType = vi.fn();

vi.mock("@/api/catalog/memories", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/memories")>(
    "@/api/catalog/memories",
  );
  return {
    ...actual,
    listMemories: (...args: unknown[]) => listMemories(...args),
  };
});

vi.mock("@/api/master-data", async () => {
  const actual = await vi.importActual<typeof import("@/api/master-data")>(
    "@/api/master-data",
  );
  return {
    ...actual,
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
  };
});

import { RamListPage } from "@/pages/catalog/RamListPage.tsx";
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

describe("RamListPage", () => {
  beforeEach(() => {
    listMemories.mockReset();
    listManufacturersByProductType
      .mockReset()
      .mockResolvedValue([{ id: "gskill", name: "G.Skill" }]);
  });

  it("loads the unfiltered catalog", async () => {
    listMemories.mockResolvedValue({
      items: [ram],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<RamListPage />, { route: "/catalog/memories" });
    expect(
      await screen.findByRole("link", { name: "Trident Z5" }),
    ).toHaveAttribute("href", "/catalog/memories/ram-1");
    expect(listManufacturersByProductType).toHaveBeenCalledWith("ram");
  });

  it("applies DDR and module size filters", async () => {
    listMemories.mockResolvedValue({
      items: [ram],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<RamListPage />, { route: "/catalog/memories" });
    await screen.findByRole("link", { name: "Trident Z5" });
    await user.type(screen.getByLabelText("Name"), "Trident");
    await user.selectOptions(screen.getByLabelText("Manufacturer"), "gskill");
    await user.selectOptions(screen.getByLabelText("DDR Generation"), "Ddr5");
    await user.selectOptions(screen.getByLabelText("Module Size"), "16");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(listMemories).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          name: "Trident",
          manufacturerId: "gskill",
          ddrGeneration: "Ddr5",
          memorySizePerStickGb: 16,
        }),
      }),
    );
  });

  it("shows empty, loading, and error states", async () => {
    listMemories.mockResolvedValue({
      items: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<RamListPage />, { route: "/catalog/memories" });
    expect(
      await screen.findByText("No memories in the catalog yet."),
    ).toBeInTheDocument();

    renderWithQuery(<RamListPage />, {
      route: "/catalog/memories?name=nope",
    });
    expect(
      await screen.findByText("No memories match these filters."),
    ).toBeInTheDocument();

    listMemories.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<RamListPage />, { route: "/catalog/memories" });
    expect(await screen.findByText("Loading memories…")).toBeInTheDocument();

    listMemories.mockRejectedValue(new Error("fail"));
    renderWithQuery(<RamListPage />, { route: "/catalog/memories" });
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });
});
