import { describe, expect, it } from "vitest";
import {
  chassisListParamsFromSearch,
  chassisListSearchFromParams,
  emptyChassisFilter,
} from "@/api/catalog/params/chassis-list-params";

describe("chassis list search params", () => {
  it("uses an empty filter by default", () => {
    expect(chassisListParamsFromSearch(new URLSearchParams()).filter).toEqual(
      expect.objectContaining({
        name: undefined,
        manufacturerId: undefined,
        lengthMm: undefined,
        supportedMbFormFactors: undefined,
      }),
    );
  });

  it("round-trips name, ranges, and form factors", () => {
    const params = {
      pageIndex: 1,
      pageSize: 10,
      sortBy: "name" as const,
      sortDirection: "asc" as const,
      filter: {
        name: "O11",
        manufacturerId: "lian-li",
        lengthMm: { min: 400, max: 500 },
        supportedMbFormFactors: ["Atx", "Matx"] as const,
      },
    };
    expect(chassisListParamsFromSearch(chassisListSearchFromParams(params)))
      .toMatchObject({
        pageIndex: 1,
        filter: {
          name: "O11",
          manufacturerId: "lian-li",
          lengthMm: { min: 400, max: 500 },
          supportedMbFormFactors: ["Atx", "Matx"],
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
