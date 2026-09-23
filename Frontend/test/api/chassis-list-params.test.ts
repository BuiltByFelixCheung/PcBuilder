import { describe, expect, it } from "vitest";
import type { ChassisListParams } from "@/api/catalog/chassis";
import {
  chassisListParamsFromSearch,
  chassisListSearchFromParams,
  emptyChassisFilter,
} from "@/api/catalog/params/chassis-list-params";

describe("chassis list search params", () => {
  it("uses an empty filter by default", () => {
    expect(
      chassisListParamsFromSearch(
        new URLSearchParams("maxSupportedMbFormFactor="),
      ).filter.maxSupportedMbFormFactor,
    ).toBeUndefined();
  });

  it("round-trips name, ranges, and form factors", () => {
    const params: ChassisListParams = {
      pageIndex: 1,
      pageSize: 10,
      sortBy: "name",
      sortDirection: "asc",
      filter: {
        name: "O11",
        manufacturerId: "lian-li",
        lengthMm: { min: 400, max: 500 },
        maxSupportedMbFormFactor: "Atx",
      },
    };
    expect(
      chassisListParamsFromSearch(chassisListSearchFromParams(params)),
    ).toMatchObject({
      pageIndex: 1,
      filter: {
        name: "O11",
        manufacturerId: "lian-li",
        lengthMm: { min: 400, max: 500 },
        maxSupportedMbFormFactor: "Atx",
      },
    });
  });

  it("omits empty filter from the query string", () => {
    expect(
      chassisListSearchFromParams({
        pageIndex: 0,
        pageSize: 10,
        filter: emptyChassisFilter,
      }).toString(),
    ).toBe("");
  });
});
