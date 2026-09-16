import { describe, expect, it } from "vitest";
import {
  emptyGraphicsCardFilter,
  graphicsCardListParamsFromSearch,
  graphicsCardListSearchFromParams,
} from "@/api/catalog/params/graphics-card-list-params";

describe("graphics card list search params", () => {
  it("round-trips name, gpu, and range filters", () => {
    const params = {
      pageIndex: 1,
      pageSize: 10,
      sortBy: "name" as const,
      sortDirection: "asc" as const,
      filter: {
        name: "4070",
        manufacturerId: "asus",
        gpuId: "4070",
        videoMemoryGb: 12,
        pcieGeneration: "Gen4" as const,
        isLowProfile: true,
        lengthMm: { min: 200, max: 350 },
      },
    };
    expect(
      graphicsCardListParamsFromSearch(graphicsCardListSearchFromParams(params)),
    ).toMatchObject({
      pageIndex: 1,
      filter: {
        name: "4070",
        gpuId: "4070",
        videoMemoryGb: 12,
        pcieGeneration: "Gen4",
        isLowProfile: true,
        lengthMm: { min: 200, max: 350 },
      },
    });
  });

  it("omits empty filter from the query string", () => {
    expect(
      graphicsCardListSearchFromParams({
        pageIndex: 0,
        pageSize: 10,
        filter: emptyGraphicsCardFilter,
      }).toString(),
    ).toBe("");
  });
});
