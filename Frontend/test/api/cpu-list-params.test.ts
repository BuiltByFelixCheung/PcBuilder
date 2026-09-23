import { describe, expect, it } from "vitest";
import {
  cpuListParamsFromSearch,
  cpuListSearchFromParams,
  emptyCpuFilter,
} from "@/api/catalog/params/cpu-list-params";

describe("cpu list search params", () => {
  it("uses GET-friendly empty filter by default", () => {
    expect(cpuListParamsFromSearch(new URLSearchParams())).toEqual({
      pageIndex: 0,
      pageSize: 10,
      sortBy: "name",
      sortDirection: "asc",
      filter: {
        name: "",
        manufacturerId: undefined,
        socketId: undefined,
        seriesId: undefined,
        motherboardId: undefined,
        thermalDesignPower: undefined,
        powerConsumptionWatts: undefined,
      },
    });
  });

  it("round-trips name, paging, and range filters without ddrGeneration", () => {
    const params = {
      pageIndex: 2,
      pageSize: 10,
      sortBy: "name" as const,
      sortDirection: "asc" as const,
      filter: {
        name: "Ryzen",
        manufacturerId: "amd",
        thermalDesignPower: { min: 65, max: 170 },
      },
    };
    const search = cpuListSearchFromParams(params);
    expect(search.get("ddrGeneration")).toBeNull();
    expect(cpuListParamsFromSearch(search)).toMatchObject({
      pageIndex: 2,
      filter: {
        name: "Ryzen",
        manufacturerId: "amd",
        thermalDesignPower: { min: 65, max: 170 },
      },
    });
  });

  it("omits empty filter from the query string", () => {
    expect(
      cpuListSearchFromParams({
        pageIndex: 0,
        pageSize: 10,
        filter: emptyCpuFilter,
      }).toString(),
    ).toBe("");
  });

  it("round-trips motherboard compatibility", () => {
    const search = cpuListSearchFromParams({
      pageIndex: 0,
      pageSize: 10,
      filter: { motherboardId: "mb-1" },
    });
    expect(search.get("motherboardId")).toBe("mb-1");
    expect(cpuListParamsFromSearch(search).filter.motherboardId).toBe("mb-1");
  });

  it("treats blank manufacturer ids as unset", () => {
    expect(
      cpuListParamsFromSearch(
        new URLSearchParams("manufacturerId=&socketId=%20"),
      ).filter,
    ).toMatchObject({
      manufacturerId: undefined,
      socketId: undefined,
    });
  });
});
