import { describe, expect, it } from "vitest";
import {
  emptyMemoryFilter,
  memoryListParamsFromSearch,
  memoryListSearchFromParams,
} from "@/api/catalog/params/memory-list-params";

describe("memory list search params", () => {
  it("round-trips name, ddr, and size filters", () => {
    const params = {
      pageIndex: 1,
      pageSize: 10,
      sortBy: "name" as const,
      sortDirection: "asc" as const,
      filter: {
        name: "Trident",
        manufacturerId: "gskill",
        ddrGeneration: "Ddr5" as const,
        ramFormFactor: "UDimm" as const,
        ramRank: "DualRank" as const,
        memorySizePerStickGb: 16,
        heightMm: { min: 30, max: 50 },
      },
    };
    expect(
      memoryListParamsFromSearch(memoryListSearchFromParams(params)),
    ).toMatchObject({
      pageIndex: 1,
      filter: {
        name: "Trident",
        ddrGeneration: "Ddr5",
        memorySizePerStickGb: 16,
        heightMm: { min: 30, max: 50 },
      },
    });
  });

  it("omits empty filter from the query string", () => {
    expect(
      memoryListSearchFromParams({
        pageIndex: 0,
        pageSize: 10,
        filter: emptyMemoryFilter,
      }).toString(),
    ).toBe("");
  });
});
