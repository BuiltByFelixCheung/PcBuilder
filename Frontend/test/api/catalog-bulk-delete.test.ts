import { beforeEach, describe, expect, it, vi } from "vitest";

const del = vi.fn();

vi.mock("@/api/client.ts", () => ({
  api: {
    delete: (...args: unknown[]) => del(...args),
  },
}));

import {
  deleteChassis,
  deleteChassisFans,
  deleteCpuCoolers,
  deleteCpus,
  deleteGraphicsCards,
  deleteMemories,
  deleteMotherboards,
  deletePsus,
  deleteStorageDrives,
  deleteWiredNetworkAdapters,
  deleteWirelessNetworkAdapters,
} from "@/api/catalog/bulk-delete.ts";

describe("catalog bulk delete", () => {
  beforeEach(() => {
    del.mockReset().mockResolvedValue({ status: 204 });
  });

  it("posts each catalog resource to its bulk route", async () => {
    const ids = ["a", "b"];

    await deleteCpus(ids);
    await deleteChassis(ids);
    await deleteChassisFans(ids);
    await deleteCpuCoolers(ids);
    await deleteGraphicsCards(ids);
    await deleteMemories(ids);
    await deleteMotherboards(ids);
    await deletePsus(ids);
    await deleteStorageDrives(ids);
    await deleteWiredNetworkAdapters(ids);
    await deleteWirelessNetworkAdapters(ids);

    expect(del).toHaveBeenNthCalledWith(1, "/catalog/cpu/bulk", {
      data: { cpuIds: ids },
    });
    expect(del).toHaveBeenNthCalledWith(2, "/catalog/chassis/bulk", {
      data: { ids },
    });
    expect(del).toHaveBeenNthCalledWith(3, "/catalog/chassis-fan/bulk", {
      data: { ids },
    });
    expect(del).toHaveBeenNthCalledWith(4, "/catalog/cpu-cooler/bulk", {
      data: { cpuCoolerIds: ids },
    });
    expect(del).toHaveBeenNthCalledWith(5, "/catalog/graphics-card/bulk", {
      data: { ids },
    });
    expect(del).toHaveBeenNthCalledWith(6, "/catalog/ram/bulk", {
      data: { memoryIds: ids },
    });
    expect(del).toHaveBeenNthCalledWith(7, "/catalog/motherboard/bulk", {
      data: { motherboardIds: ids },
    });
    expect(del).toHaveBeenNthCalledWith(8, "/catalog/psu/bulk", {
      data: { ids },
    });
    expect(del).toHaveBeenNthCalledWith(9, "/catalog/storage-drive/bulk", {
      data: { ids },
    });
    expect(del).toHaveBeenNthCalledWith(
      10,
      "/catalog/wired-network-adapter/bulk",
      { data: { ids } },
    );
    expect(del).toHaveBeenNthCalledWith(
      11,
      "/catalog/wireless-network-adapter/bulk",
      { data: { ids } },
    );
  });
});