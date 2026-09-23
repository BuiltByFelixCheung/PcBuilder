import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MotherboardListItem } from "@/api/catalog/motherboards";

const get = vi.fn();
const post = vi.fn();

vi.mock("@/api/client.ts", () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

import {
  getMotherboardById,
  isMotherboardFilterActive,
  listMotherboards,
  motherboardKeys,
} from "@/api/catalog/motherboards";

const paging = {
  pageIndex: 0,
  pageSize: 10,
  sortBy: "name" as const,
  sortDirection: "asc" as const,
};

const item: MotherboardListItem = {
  id: "mb-1",
  name: "ROG Strix X870-F",
  manufacturerId: "asus",
  manufacturerName: "ASUS",
  socketId: "am5",
  socketName: "AM5",
  chipsetId: "x870",
  chipsetName: "X870",
  ramSlots: 4,
  maxMemoryGb: 192,
  maxDimmSizeGb: 48,
  sataPorts: 4,
  fanConnectors: 7,
  epsConnectors: 2,
  widthMm: 305,
  heightMm: 244,
  ddrGeneration: "Ddr5",
  ramFormFactor: "UDimm",
  formFactor: "Atx",
  wifiEnabled: true,
  bluetoothEnabled: true,
};

describe("motherboard API", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("treats blank filters as inactive", () => {
    expect(isMotherboardFilterActive({ name: "  " })).toBe(false);
    expect(isMotherboardFilterActive({ name: "X870" })).toBe(true);
    expect(isMotherboardFilterActive({ wifiEnabled: false })).toBe(true);
    expect(isMotherboardFilterActive({ chassisId: "case-1" })).toBe(true);
    expect(
      isMotherboardFilterActive({ widthMm: { min: 200, max: null } }),
    ).toBe(false);
  });

  it("lists with GET when no filter is set", async () => {
    get.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await expect(
      listMotherboards({ ...paging, filter: { name: "" } }),
    ).resolves.toMatchObject({
      items: [item],
    });
    expect(get).toHaveBeenCalledWith("/catalog/motherboard", {
      params: paging,
    });
    expect(post).not.toHaveBeenCalled();
    expect(motherboardKeys.detail("mb-1")).toEqual([
      "motherboards",
      "detail",
      "mb-1",
    ]);
  });

  it("lists with POST /query when a filter is set", async () => {
    post.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await listMotherboards({ ...paging, filter: { name: "X870" } });
    expect(post).toHaveBeenCalledWith("/catalog/motherboard/query", {
      ...paging,
      filter: expect.objectContaining({ name: "X870" }),
    });
    expect(get).not.toHaveBeenCalled();
  });

  it("omits incomplete ranges from the query body", async () => {
    post.mockResolvedValue({
      data: { items: [], totalCount: 0, pageIndex: 0, pageSize: 10 },
    });
    await listMotherboards({
      ...paging,
      filter: {
        name: "X870",
        widthMm: { min: 200, max: null },
        heightMm: { min: 200, max: 300 },
      },
    });
    const body = post.mock.calls[0][1] as { filter: Record<string, unknown> };
    expect(body.filter.widthMm).toBeUndefined();
    expect(body.filter.heightMm).toEqual({ min: 200, max: 300 });
    expect(body.filter.chassisId).toBeUndefined();
  });

  it("posts chassisId when filtering for compatibility", async () => {
    post.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await listMotherboards({
      ...paging,
      filter: { chassisId: "case-1" },
    });
    expect(post).toHaveBeenCalledWith(
      "/catalog/motherboard/query",
      expect.objectContaining({
        filter: expect.objectContaining({ chassisId: "case-1" }),
      }),
    );
  });

  it("loads a motherboard by id", async () => {
    get.mockResolvedValue({
      data: { ...item, pcieSlots: [], m2Slots: [], usbPorts: [] },
    });
    await expect(getMotherboardById("mb-1")).resolves.toMatchObject({
      id: "mb-1",
    });
    expect(get).toHaveBeenCalledWith("/catalog/motherboard/mb-1");
  });
});
