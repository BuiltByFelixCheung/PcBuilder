import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemoryDetail } from "@/api/catalog/memories";

const get = vi.fn();
const post = vi.fn();

vi.mock("@/api/client.ts", () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

import {
  getMemoryById,
  isMemoryFilterActive,
  listMemories,
} from "@/api/catalog/memories";

const paging = {
  pageIndex: 0,
  pageSize: 10,
  sortBy: "name" as const,
  sortDirection: "asc" as const,
};

const item: MemoryDetail = {
  id: "ram-1",
  name: "Trident Z5",
  manufacturerId: "gskill",
  manufacturerName: "G.Skill",
  color: "Black",
  ddrGeneration: "Ddr5",
  ramFormFactor: "UDimm",
  ramRank: "DualRank",
  memorySizePerStickGb: 16,
  totalMemorySizeGb: 32,
  modulesCount: 2,
  maxMemorySpeedMts: 6000,
  heightMm: 44,
};

describe("memory API", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("treats blank filters as inactive", () => {
    expect(isMemoryFilterActive({ name: "  " })).toBe(false);
    expect(isMemoryFilterActive({ name: "Trident" })).toBe(true);
    expect(isMemoryFilterActive({ ddrGeneration: "Ddr5" })).toBe(true);
  });

  it("lists with GET when no filter is set", async () => {
    get.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await expect(
      listMemories({ ...paging, filter: {} }),
    ).resolves.toMatchObject({ items: [item] });
    expect(get).toHaveBeenCalledWith("/catalog/ram", { params: paging });
  });

  it("lists with POST /query when a filter is set", async () => {
    post.mockResolvedValue({
      data: { items: [item], totalCount: 1, pageIndex: 0, pageSize: 10 },
    });
    await listMemories({ ...paging, filter: { name: "Trident" } });
    expect(post).toHaveBeenCalledWith("/catalog/ram/query", {
      ...paging,
      filter: expect.objectContaining({ name: "Trident" }),
    });
  });

  it("omits incomplete height ranges from the query body", async () => {
    post.mockResolvedValue({
      data: { items: [], totalCount: 0, pageIndex: 0, pageSize: 10 },
    });
    await listMemories({
      ...paging,
      filter: { name: "Z5", heightMm: { min: 30, max: null } },
    });
    const body = post.mock.calls[0][1] as { filter: Record<string, unknown> };
    expect(body.filter.heightMm).toBeUndefined();
  });

  it("loads memory by id", async () => {
    get.mockResolvedValue({ data: item });
    await expect(getMemoryById("ram-1")).resolves.toMatchObject({
      id: "ram-1",
    });
    expect(get).toHaveBeenCalledWith("/catalog/ram/ram-1");
  });
});
