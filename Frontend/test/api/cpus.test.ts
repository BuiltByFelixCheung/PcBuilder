import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CpuListItem } from "@/api/catalog/cpus";

const get = vi.fn();
const post = vi.fn();

vi.mock("@/api/client.ts", () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

import { getCpuById, isCpuFilterActive, listCpus } from "@/api/catalog/cpus";

const paging = {
  pageIndex: 0,
  pageSize: 10,
  sortBy: "name" as const,
  sortDirection: "asc" as const,
};

const item: CpuListItem = {
  id: "cpu-1",
  name: "Ryzen 7 7800X3D",
  manufacturerId: "amd",
  manufacturerName: "AMD",
  seriesId: "r7",
  seriesName: "Ryzen 7",
  socketId: "am5",
  socketName: "AM5",
  maxMemoryGb: 128,
  integratedGraphics: false,
  includedStockCooler: false,
  thermalDesignPower: 120,
  powerConsumptionWatts: 120,
};

describe("cpu API", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("treats blank filters as inactive", () => {
    expect(isCpuFilterActive({ name: "  " })).toBe(false);
    expect(isCpuFilterActive({ name: "Ryzen" })).toBe(true);
    expect(isCpuFilterActive({ motherboardId: "mb-1" })).toBe(true);
  });

  it("lists with GET when no filter is set", async () => {
    get.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await expect(
      listCpus({ ...paging, filter: { name: "" } }),
    ).resolves.toMatchObject({
      items: [item],
    });
    expect(get).toHaveBeenCalledWith("/catalog/cpu", { params: paging });
    expect(post).not.toHaveBeenCalled();
  });

  it("lists with POST /query when a filter is set", async () => {
    post.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await listCpus({ ...paging, filter: { name: "Ryzen" } });
    expect(post).toHaveBeenCalledWith("/catalog/cpu/query", {
      ...paging,
      filter: { name: "Ryzen" },
    });
    expect(get).not.toHaveBeenCalled();
  });

  it("does not send ddrGeneration on the query body", async () => {
    post.mockResolvedValue({
      data: { items: [], totalCount: 0, pageIndex: 0, pageSize: 10 },
    });
    await listCpus({
      ...paging,
      filter: { name: "Ryzen", manufacturerId: "amd" },
    });
    const body = post.mock.calls[0][1] as { filter: Record<string, unknown> };
    expect(body.filter).not.toHaveProperty("ddrGeneration");
  });

  it("posts motherboardId when filtering for compatibility", async () => {
    post.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await listCpus({ ...paging, filter: { motherboardId: "mb-1" } });
    expect(post).toHaveBeenCalledWith(
      "/catalog/cpu/query",
      expect.objectContaining({
        filter: expect.objectContaining({ motherboardId: "mb-1" }),
      }),
    );
  });

  it("loads a CPU by id", async () => {
    get.mockResolvedValue({
      data: { ...item, ramCompats: [], supportChipsets: [] },
    });
    await expect(getCpuById("cpu-1")).resolves.toMatchObject({ id: "cpu-1" });
    expect(get).toHaveBeenCalledWith("/catalog/cpu/cpu-1");
  });
});
