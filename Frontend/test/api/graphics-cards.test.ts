import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphicsCardListItem } from "@/api/catalog/graphics-cards";

const get = vi.fn();
const post = vi.fn();

vi.mock("@/api/client.ts", () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

import {
  getGraphicsCardById,
  isGraphicsCardFilterActive,
  listGraphicsCards,
} from "@/api/catalog/graphics-cards";

const paging = {
  pageIndex: 0,
  pageSize: 10,
  sortBy: "name" as const,
  sortDirection: "asc" as const,
};

const item: GraphicsCardListItem = {
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

describe("graphics card API", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("treats blank filters as inactive", () => {
    expect(isGraphicsCardFilterActive({ name: "  " })).toBe(false);
    expect(isGraphicsCardFilterActive({ name: "4070" })).toBe(true);
    expect(isGraphicsCardFilterActive({ isLowProfile: false })).toBe(true);
    expect(isGraphicsCardFilterActive({ isLowProfile: true })).toBe(true);
  });

  it("lists with GET when no filter is set", async () => {
    get.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await expect(
      listGraphicsCards({ ...paging, filter: {} }),
    ).resolves.toMatchObject({ items: [item] });
    expect(get).toHaveBeenCalledWith("/catalog/graphics-card", {
      params: paging,
    });
  });

  it("lists with POST /query when a filter is set", async () => {
    post.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await listGraphicsCards({ ...paging, filter: { name: "4070" } });
    expect(post).toHaveBeenCalledWith("/catalog/graphics-card/query", {
      ...paging,
      filter: expect.objectContaining({ name: "4070" }),
    });
  });

  it("omits incomplete ranges from the query body", async () => {
    post.mockResolvedValue({
      data: { items: [], totalCount: 0, pageIndex: 0, pageSize: 10 },
    });
    await listGraphicsCards({
      ...paging,
      filter: {
        name: "4070",
        lengthMm: { min: 200, max: null },
        powerConsumptionWatts: { min: 150, max: 250 },
      },
    });
    const body = post.mock.calls[0][1] as { filter: Record<string, unknown> };
    expect(body.filter.lengthMm).toBeUndefined();
    expect(body.filter.powerConsumptionWatts).toEqual({ min: 150, max: 250 });
  });

  it("loads a graphics card by id", async () => {
    get.mockResolvedValue({
      data: {
        ...item,
        gpuManufacturerId: "nvidia",
        gpuManufacturerName: "NVIDIA",
        gpuSeriesId: "rtx40",
        gpuSeriesName: "GeForce RTX 40",
      },
    });
    await expect(getGraphicsCardById("gpu-1")).resolves.toMatchObject({
      id: "gpu-1",
    });
    expect(get).toHaveBeenCalledWith("/catalog/graphics-card/gpu-1");
  });
});
