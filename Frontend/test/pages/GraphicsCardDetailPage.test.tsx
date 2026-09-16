import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphicsCardDetail } from "@/api/catalog/graphics-cards";
import { Route, Routes } from "react-router-dom";

const getGraphicsCardById = vi.fn();

vi.mock("@/api/catalog/graphics-cards", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/catalog/graphics-cards")>(
      "@/api/catalog/graphics-cards",
    );
  return {
    ...actual,
    getGraphicsCardById: (...args: unknown[]) => getGraphicsCardById(...args),
  };
});

import { GraphicsCardDetailPage } from "@/pages/catalog/GraphicsCardDetailPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const card: GraphicsCardDetail = {
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
  gpuManufacturerId: "nvidia",
  gpuManufacturerName: "NVIDIA",
  gpuSeriesId: "rtx40",
  gpuSeriesName: "GeForce RTX 40",
};

function renderDetail(route = "/catalog/graphics-cards/gpu-1") {
  return renderWithQuery(
    <Routes>
      <Route
        path="/catalog/graphics-cards/:graphicsCardId"
        element={<GraphicsCardDetailPage />}
      />
    </Routes>,
    { route },
  );
}

describe("GraphicsCardDetailPage", () => {
  beforeEach(() => {
    getGraphicsCardById.mockReset();
  });

  it("renders card and GPU details", async () => {
    getGraphicsCardById.mockResolvedValue(card);
    renderDetail();
    expect(
      await screen.findByRole("heading", { name: "TUF RTX 4070" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RTX 4070" })).toBeInTheDocument();
    expect(screen.getByText("NVIDIA")).toBeInTheDocument();
    expect(screen.getByText("GeForce RTX 40")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("shows loading and error states", async () => {
    getGraphicsCardById.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(
      await screen.findByText("Loading Graphics Card…"),
    ).toBeInTheDocument();

    getGraphicsCardById.mockRejectedValue(new Error("fail"));
    renderDetail();
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("shows not found when the card is missing", async () => {
    getGraphicsCardById.mockResolvedValue(null);
    renderDetail();
    expect(
      await screen.findByText("Graphics Card not found."),
    ).toBeInTheDocument();
  });
});
