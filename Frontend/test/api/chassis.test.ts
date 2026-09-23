import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChassisListItem } from "@/api/catalog/chassis";

const get = vi.fn();
const post = vi.fn();

vi.mock("@/api/client.ts", () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

import {
  getChassisById,
  isChassisFilterActive,
  listChassis,
} from "@/api/catalog/chassis";

const paging = {
  pageIndex: 0,
  pageSize: 10,
  sortBy: "name" as const,
  sortDirection: "asc" as const,
};

const item: ChassisListItem = {
  id: "chassis-1",
  name: "Lian Li O11",
  manufacturerId: "lian-li",
  manufacturerName: "Lian Li",
  lengthMm: 465,
  widthMm: 285,
  heightMm: 446,
  motherboardMaxWidthMm: 305,
  motherboardMaxHeightMm: 330,
  maxCpuCoolerHeightMm: 167,
  maxGraphicsCardLengthMm: 420,
  maxPsuLengthMm: 220,
};

describe("chassis API", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("treats blank filters as inactive", () => {
    expect(isChassisFilterActive({ name: "  " })).toBe(false);
    expect(isChassisFilterActive({ name: "O11" })).toBe(true);
    expect(isChassisFilterActive({ maxSupportedMbFormFactor: undefined })).toBe(
      false,
    );
    expect(isChassisFilterActive({ maxSupportedMbFormFactor: "Atx" })).toBe(
      true,
    );
  });

  it("lists with GET when no filter is set", async () => {
    get.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await expect(listChassis({ ...paging, filter: {} })).resolves.toMatchObject(
      { items: [item] },
    );
    expect(get).toHaveBeenCalledWith("/catalog/chassis", { params: paging });
    expect(post).not.toHaveBeenCalled();
  });

  it("lists with POST /query when a filter is set", async () => {
    post.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await listChassis({ ...paging, filter: { name: "O11" } });
    expect(post).toHaveBeenCalledWith("/catalog/chassis/query", {
      ...paging,
      filter: expect.objectContaining({ name: "O11" }),
    });
  });

  it("omits incomplete ranges from the query body", async () => {
    post.mockResolvedValue({
      data: { items: [], totalCount: 0, pageIndex: 0, pageSize: 10 },
    });
    await listChassis({
      ...paging,
      filter: {
        name: "O11",
        lengthMm: { min: 400, max: null },
        widthMm: { min: 200, max: 300 },
      },
    });
    const body = post.mock.calls[0][1] as { filter: Record<string, unknown> };
    expect(body.filter.lengthMm).toBeUndefined();
    expect(body.filter.widthMm).toEqual({ min: 200, max: 300 });
  });

  it("loads a chassis by id", async () => {
    get.mockResolvedValue({
      data: {
        ...item,
        fanMounts: [],
        driveBays: [],
        pcieSlots: [],
        radiators: [],
        psuFormFactors: [],
        mbFormFactors: [],
      },
    });
    await expect(getChassisById("chassis-1")).resolves.toMatchObject({
      id: "chassis-1",
    });
    expect(get).toHaveBeenCalledWith("/catalog/chassis/chassis-1");
  });
});
