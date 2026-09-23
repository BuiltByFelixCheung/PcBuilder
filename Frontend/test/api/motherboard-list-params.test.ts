import { describe, expect, it } from "vitest";
import {
  emptyMotherboardFilter,
  motherboardListParamsFromSearch,
  motherboardListSearchFromParams,
} from "@/api/catalog/params/motherboard-list-params";

describe("motherboard list search params", () => {
  it("uses GET-friendly empty filter by default", () => {
    expect(motherboardListParamsFromSearch(new URLSearchParams())).toEqual({
      pageIndex: 0,
      pageSize: 10,
      sortBy: "name",
      sortDirection: "asc",
      filter: {
        name: "",
        manufacturerId: undefined,
        socketId: undefined,
        chipsetId: undefined,
        ramSlots: undefined,
        maxMemoryGb: undefined,
        maxDimmSizeGb: undefined,
        sataPorts: undefined,
        fanConnectors: undefined,
        epsConnectors: undefined,
        widthMm: undefined,
        heightMm: undefined,
        ddrGeneration: undefined,
        ramFormFactor: undefined,
        formFactor: undefined,
        wifiEnabled: undefined,
        bluetoothEnabled: undefined,
        chassisId: undefined,
      },
    });
  });

  it("round-trips paging, enums, bools, and ranges", () => {
    const params = {
      pageIndex: 2,
      pageSize: 10,
      sortBy: "name" as const,
      sortDirection: "asc" as const,
      filter: {
        name: "X870",
        manufacturerId: "asus",
        socketId: "am5",
        chipsetId: "x870",
        ddrGeneration: "Ddr5" as const,
        ramFormFactor: "UDimm" as const,
        formFactor: "Atx" as const,
        wifiEnabled: true,
        bluetoothEnabled: false,
        widthMm: { min: 200, max: 330 },
        ramSlots: 4,
      },
    };
    const search = motherboardListSearchFromParams(params);
    expect(motherboardListParamsFromSearch(search)).toMatchObject({
      pageIndex: 2,
      filter: {
        name: "X870",
        manufacturerId: "asus",
        socketId: "am5",
        chipsetId: "x870",
        ddrGeneration: "Ddr5",
        ramFormFactor: "UDimm",
        formFactor: "Atx",
        wifiEnabled: true,
        bluetoothEnabled: false,
        widthMm: { min: 200, max: 330 },
        ramSlots: 4,
      },
    });
  });

  it("omits empty filter from the query string", () => {
    expect(
      motherboardListSearchFromParams({
        pageIndex: 0,
        pageSize: 10,
        filter: emptyMotherboardFilter,
      }).toString(),
    ).toBe("");
  });

  it("round-trips chassis compatibility", () => {
    const search = motherboardListSearchFromParams({
      pageIndex: 0,
      pageSize: 10,
      filter: { chassisId: "case-1" },
    });
    expect(search.get("chassisId")).toBe("case-1");
    expect(motherboardListParamsFromSearch(search).filter.chassisId).toBe(
      "case-1",
    );
  });

  it("treats blank manufacturer ids as unset", () => {
    expect(
      motherboardListParamsFromSearch(
        new URLSearchParams("manufacturerId=&socketId=%20&wifiEnabled=maybe"),
      ).filter,
    ).toMatchObject({
      manufacturerId: undefined,
      socketId: undefined,
      wifiEnabled: undefined,
    });
  });
});
