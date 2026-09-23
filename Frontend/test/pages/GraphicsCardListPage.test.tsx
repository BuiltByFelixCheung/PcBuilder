import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphicsCardListItem } from "@/api/catalog/graphics-cards";

const listGraphicsCards = vi.fn();
const listManufacturersByProductType = vi.fn();
const listGpus = vi.fn();
const listGpuSeries = vi.fn();

vi.mock("@/api/catalog/graphics-cards", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/graphics-cards")
  >("@/api/catalog/graphics-cards");
  return {
    ...actual,
    listGraphicsCards: (...args: unknown[]) => listGraphicsCards(...args),
  };
});

vi.mock("@/api/master-data.ts", async () => {
  const actual = await vi.importActual<typeof import("@/api/master-data.ts")>(
    "@/api/master-data.ts",
  );
  return {
    ...actual,
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    listGpus: () => listGpus(),
    listGpuSeries: () => listGpuSeries(),
  };
});

import { GraphicsCardListPage } from "@/pages/catalog/graphics-cards/GraphicsCardListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const card: GraphicsCardListItem = {
  id: "gpu-1",
  name: "TUF RTX 4070",
  manufacturerId: "asus",
  manufacturerName: "ASUS",
  gpuId: "4070",
  gpuName: "RTX 4070",
  videoMemoryGb: 12,
  pcieSlotsUsed: 2,
  pcieGeneration: "Gen4",
  isLowProfile: false,
  lengthMm: 305,
  widthMm: 140,
  heightMm: 50,
  powerConsumptionWatts: 200,
  powerConnectorType: "Pcie6Plus2Pin",
  powerConnectorCount: 1,
};

describe("GraphicsCardListPage", () => {
  beforeEach(() => {
    listGraphicsCards.mockReset();
    listManufacturersByProductType
      .mockReset()
      .mockImplementation((productType: string) => {
        if (productType === "graphicscard") {
          return Promise.resolve([{ id: "asus", name: "ASUS" }]);
        }
        return Promise.resolve([{ id: "nvidia", name: "NVIDIA" }]);
      });
    listGpuSeries.mockReset().mockResolvedValue([
      {
        id: "rtx40",
        name: "GeForce RTX 40",
        manufacturerId: "nvidia",
        manufacturerName: "NVIDIA",
      },
    ]);
    listGpus.mockReset().mockResolvedValue([
      {
        id: "4070",
        name: "RTX 4070",
        manufacturerId: "nvidia",
        manufacturerName: "NVIDIA",
        gpuSeriesId: "rtx40",
        gpuSeriesName: "GeForce RTX 40",
      },
    ]);
  });

  it("loads the unfiltered catalog", async () => {
    listGraphicsCards.mockResolvedValue({
      items: [card],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<GraphicsCardListPage />, {
      route: "/catalog/graphics-cards",
    });
    expect(
      await screen.findByRole("link", { name: "TUF RTX 4070" }),
    ).toHaveAttribute("href", "/catalog/graphics-cards/gpu-1");
    expect(listManufacturersByProductType).toHaveBeenCalledWith("graphicscard");
  });

  it("filters by manufacturer, gpu, and video memory", async () => {
    listGraphicsCards.mockResolvedValue({
      items: [card],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<GraphicsCardListPage />, {
      route: "/catalog/graphics-cards",
    });
    await screen.findByRole("link", { name: "TUF RTX 4070" });
    await user.type(screen.getByLabelText("Name"), "4070");
    await user.selectOptions(screen.getByLabelText("Manufacturer"), "asus");
    await user.selectOptions(
      screen.getByLabelText("GPU Manufacturer"),
      "nvidia",
    );
    await user.selectOptions(screen.getByLabelText("GPU Series"), "rtx40");
    await user.selectOptions(screen.getByLabelText("GPU"), "4070");
    await user.selectOptions(screen.getByLabelText("Video Memory"), "12");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(listGraphicsCards).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          name: "4070",
          manufacturerId: "asus",
          gpuId: "4070",
          videoMemoryGb: 12,
        }),
      }),
    );
  });

  it("shows empty, loading, and error states", async () => {
    listGraphicsCards.mockResolvedValue({
      items: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<GraphicsCardListPage />, {
      route: "/catalog/graphics-cards",
    });
    expect(
      await screen.findByText("No graphics cards in the catalog yet."),
    ).toBeInTheDocument();

    renderWithQuery(<GraphicsCardListPage />, {
      route: "/catalog/graphics-cards?name=nope",
    });
    expect(
      await screen.findByText("No graphics cards match these filters."),
    ).toBeInTheDocument();

    listGraphicsCards.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<GraphicsCardListPage />, {
      route: "/catalog/graphics-cards",
    });
    expect(
      await screen.findByText("Loading graphics cards…"),
    ).toBeInTheDocument();

    listGraphicsCards.mockRejectedValue(new Error("fail"));
    renderWithQuery(<GraphicsCardListPage />, {
      route: "/catalog/graphics-cards",
    });
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });
});
