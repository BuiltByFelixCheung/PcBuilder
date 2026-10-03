import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  GraphicsCardDetail,
  GraphicsCardListItem,
} from "@/api/catalog/graphics-cards";
import { Route, Routes } from "react-router-dom";

const getGraphicsCardById = vi.fn();
const updateGraphicsCard = vi.fn();

vi.mock("@/api/catalog/graphics-cards", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/graphics-cards")
  >("@/api/catalog/graphics-cards");
  return {
    ...actual,
    getGraphicsCardById: (...args: unknown[]) => getGraphicsCardById(...args),
    updateGraphicsCard: (...args: unknown[]) => updateGraphicsCard(...args),
  };
});

import { GraphicsCardDetailPage } from "@/pages/catalog/graphics-cards/GraphicsCardDetailPage.tsx";
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

function renderDetail(
  route = "/catalog/graphics-cards/gpu-1",
  options?: { isAdmin?: boolean },
) {
  return renderWithQuery(
    <Routes>
      <Route
        path="/catalog/graphics-cards/:graphicsCardId"
        element={<GraphicsCardDetailPage />}
      />
    </Routes>,
    { route, isAdmin: options?.isAdmin },
  );
}

describe("GraphicsCardDetailPage", () => {
  beforeEach(() => {
    getGraphicsCardById.mockReset();
    updateGraphicsCard.mockReset();
  });

  it("renders card and GPU details", async () => {
    getGraphicsCardById.mockResolvedValue(card);
    renderDetail();
    expect(
      await screen.findByRole("heading", { name: "TUF RTX 4070" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "RTX 4070" }),
    ).toBeInTheDocument();
    expect(screen.getByText("NVIDIA")).toBeInTheDocument();
    expect(screen.getByText("GeForce RTX 40")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("saves the list item without GPU series fields", async () => {
    getGraphicsCardById.mockResolvedValue(card);
    updateGraphicsCard.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderDetail("/catalog/graphics-cards/gpu-1", { isAdmin: true });

    const title = await screen.findByRole("heading", { name: "TUF RTX 4070" });
    await user.click(
      within(title.parentElement!).getByRole("button", { name: "Edit" }),
    );
    const name = screen.getByRole("textbox", { name: "Name for TUF RTX 4070" });
    await user.clear(name);
    await user.type(name, "TUF 4070");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateGraphicsCard).toHaveBeenCalledTimes(1);
    });
    const [saved] = updateGraphicsCard.mock.calls[0] as [GraphicsCardListItem];
    expect(saved.name).toBe("TUF 4070");
    expect(saved).not.toHaveProperty("gpuManufacturerId");
    expect(saved).not.toHaveProperty("gpuSeriesName");
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
