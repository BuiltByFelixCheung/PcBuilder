import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChassisListItem } from "@/api/catalog/chassis";

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();

vi.mock("@/api/client.ts", () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    put: (...args: unknown[]) => put(...args),
  },
}));

import {
  getChassisById,
  isChassisFilterActive,
  listChassis,
  updateChassis,
  updateChassisDriveBays,
  updateChassisFanMounts,
  updateChassisRadiators,
  updateChassisMbFormFactors,
  updateChassisPcieSlots,
  updateChassisPsuFormFactors,
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
    put.mockReset();
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

  it("updates one chassis with PUT /catalog/chassis", async () => {
    put.mockResolvedValue({ data: item });
    await updateChassis({ ...item, name: "O11 Dynamic" });
    expect(put).toHaveBeenCalledWith("/catalog/chassis", {
      id: "chassis-1",
      name: "O11 Dynamic",
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
    });
  });

  it("replaces drive bays", async () => {
    const driveBays = [{ formFactors: ["Inch35" as const], slotCount: 2 }];
    put.mockResolvedValue({ data: driveBays });
    await expect(updateChassisDriveBays("chassis-1", driveBays)).resolves.toEqual(
      driveBays,
    );
    expect(put).toHaveBeenCalledWith(
      "/catalog/chassis/chassis-1/drive-bay",
      driveBays,
    );
  });

  it("replaces radiators", async () => {
    const radiators = [
      { location: "Top" as const, length: "Mm360" as const, radiatorCount: 1 },
    ];
    put.mockResolvedValue({ data: radiators });
    await expect(updateChassisRadiators("chassis-1", radiators)).resolves.toEqual(
      radiators,
    );
    expect(put).toHaveBeenCalledWith("/catalog/chassis/chassis-1/radiator", radiators);
  });

  it("replaces fan mounts", async () => {
    const mounts = [
      {
        location: "Front" as const,
        singleDiameterOnly: true,
        options: [{ diameter: "Mm120" as const, slotCount: 3 }],
      },
    ];
    put.mockResolvedValue({ data: mounts });
    await expect(updateChassisFanMounts("chassis-1", mounts)).resolves.toEqual(
      mounts,
    );
    expect(put).toHaveBeenCalledWith("/catalog/chassis/chassis-1/fan-mount", mounts);
  });

  it("replaces PCIe slots", async () => {
    const slots = [
      { lowProfileSlots: false, slotCount: 7, orientation: "Horizontal" as const },
    ];
    put.mockResolvedValue({ data: slots });
    await expect(updateChassisPcieSlots("chassis-1", slots)).resolves.toEqual(
      slots,
    );
    expect(put).toHaveBeenCalledWith("/catalog/chassis/chassis-1/pcie-slot", slots);
  });

  it("replaces motherboard form factors", async () => {
    put.mockResolvedValue({ data: ["Atx", "Matx"] });
    await expect(
      updateChassisMbFormFactors("chassis-1", ["Atx", "Matx"]),
    ).resolves.toEqual(["Atx", "Matx"]);
    expect(put).toHaveBeenCalledWith("/catalog/chassis/chassis-1/mb-form-factor", [
      "Atx",
      "Matx",
    ]);
  });

  it("replaces PSU form factors", async () => {
    put.mockResolvedValue({ data: ["Sfx"] });
    await expect(
      updateChassisPsuFormFactors("chassis-1", ["Sfx"]),
    ).resolves.toEqual(["Sfx"]);
    expect(put).toHaveBeenCalledWith("/catalog/chassis/chassis-1/psu-form-factor", [
      "Sfx",
    ]);
  });
});
