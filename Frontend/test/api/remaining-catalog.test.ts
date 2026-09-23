import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PsuListItem } from "@/api/catalog/psus";
import type { StorageDrive } from "@/api/catalog/storage-drives";
import type { CpuCoolerListItem } from "@/api/catalog/cpu-coolers";
import type { ChassisFan } from "@/api/catalog/chassis-fans";
import type { WiredNetworkAdapter } from "@/api/catalog/wired-network-adapters";
import type { WirelessNetworkAdapter } from "@/api/catalog/wireless-network-adapters";

const get = vi.fn();
const post = vi.fn();

vi.mock("@/api/client.ts", () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

import { getPsuById, isPsuFilterActive, listPsus } from "@/api/catalog/psus";
import {
  getStorageDriveById,
  isStorageDriveFilterActive,
  listStorageDrives,
} from "@/api/catalog/storage-drives";
import {
  getCpuCoolerById,
  isCpuCoolerFilterActive,
  listCpuCoolers,
} from "@/api/catalog/cpu-coolers";
import {
  getChassisFanById,
  isChassisFanFilterActive,
  listChassisFans,
} from "@/api/catalog/chassis-fans";
import {
  getWiredNetworkAdapterById,
  isWiredNetworkAdapterFilterActive,
  listWiredNetworkAdapters,
} from "@/api/catalog/wired-network-adapters";
import {
  getWirelessNetworkAdapterById,
  isWirelessNetworkAdapterFilterActive,
  listWirelessNetworkAdapters,
} from "@/api/catalog/wireless-network-adapters";

const paging = {
  pageIndex: 0,
  pageSize: 10,
  sortBy: "name" as const,
  sortDirection: "asc" as const,
};

const psu: PsuListItem = {
  id: "psu-1",
  name: "RM850x",
  manufacturerId: "corsair",
  manufacturerName: "Corsair",
  wattage: 850,
  modularity: "FullModular",
  formFactor: "Atx",
  lengthMm: 160,
  widthMm: 150,
  heightMm: 86,
};

const drive: StorageDrive = {
  id: "ssd-1",
  name: "990 PRO",
  manufacturerId: "samsung",
  manufacturerName: "Samsung",
  media: "Ssd",
  interface: "Nvme",
  formFactor: "M22280",
  capacityGb: 2000,
  isM2: true,
};

const cooler: CpuCoolerListItem = {
  id: "cooler-1",
  name: "NH-D15",
  manufacturerId: "noctua",
  manufacturerName: "Noctua",
  maxTdp: 220,
  type: "Air",
  coolerHeightMm: 165,
};

const fan: ChassisFan = {
  id: "fan-1",
  name: "AF120",
  manufacturerId: "corsair",
  manufacturerName: "Corsair",
  diameterMm: "Mm120",
  fansCountPerPack: 3,
};

const wired: WiredNetworkAdapter = {
  id: "nic-1",
  name: "I225-V",
  manufacturerId: "intel",
  manufacturerName: "Intel",
  hostInterface: "Pcie",
  maxSpeedMbps: 2500,
  pcieSlotType: "X1",
};

const wireless: WirelessNetworkAdapter = {
  id: "wifi-1",
  name: "AX210",
  manufacturerId: "intel",
  manufacturerName: "Intel",
  wifiStandard: "Wifi6E",
  hostInterface: "M2",
  maxSpeedMbps: 2400,
  key: "E",
  m2FormFactor: "M22230",
};

describe("remaining catalog APIs", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("uses GET when filters are blank and POST when they are set", async () => {
    get.mockResolvedValue({ data: { items: [psu], totalCount: 1 } });
    post.mockResolvedValue({ data: { items: [psu], totalCount: 1 } });

    expect(isPsuFilterActive({ name: "  " })).toBe(false);
    expect(isPsuFilterActive({ cpuId: "cpu-1" })).toBe(true);
    expect(isStorageDriveFilterActive({ name: "990" })).toBe(true);
    expect(isStorageDriveFilterActive({ motherboardId: "mb-1" })).toBe(true);
    expect(isCpuCoolerFilterActive({ type: "Air" })).toBe(true);
    expect(isCpuCoolerFilterActive({ motherboardId: "mb-1" })).toBe(true);
    expect(
      isCpuCoolerFilterActive({ maxRamHeightMm: { min: 30, max: 50 } }),
    ).toBe(true);
    expect(isChassisFanFilterActive({ diameterMm: "Mm120" })).toBe(true);
    expect(isChassisFanFilterActive({ chassisId: "case-1" })).toBe(true);
    expect(isWiredNetworkAdapterFilterActive({ hostInterface: "Pcie" })).toBe(
      true,
    );
    expect(isWiredNetworkAdapterFilterActive({ motherboardId: "mb-1" })).toBe(
      true,
    );
    expect(
      isWirelessNetworkAdapterFilterActive({ wifiStandard: "Wifi6E" }),
    ).toBe(true);
    expect(
      isWirelessNetworkAdapterFilterActive({ motherboardId: "mb-1" }),
    ).toBe(true);

    await listPsus({ ...paging, filter: { name: "" } });
    expect(get).toHaveBeenCalledWith("/catalog/psu", { params: paging });

    await listStorageDrives({ ...paging, filter: { name: "990" } });
    expect(post).toHaveBeenCalledWith(
      "/catalog/storage-drive/query",
      expect.objectContaining({
        filter: expect.objectContaining({ name: "990" }),
      }),
    );

    await listCpuCoolers({ ...paging, filter: { name: "NH" } });
    expect(post).toHaveBeenCalledWith(
      "/catalog/cpu-cooler/query",
      expect.objectContaining({
        filter: expect.objectContaining({ name: "NH" }),
      }),
    );

    await listChassisFans({ ...paging, filter: { name: "AF" } });
    expect(post).toHaveBeenCalledWith(
      "/catalog/chassis-fan/query",
      expect.objectContaining({
        filter: expect.objectContaining({ name: "AF" }),
      }),
    );

    await listWiredNetworkAdapters({ ...paging, filter: { name: "I225" } });
    expect(post).toHaveBeenCalledWith(
      "/catalog/wired-network-adapter/query",
      expect.objectContaining({
        filter: expect.objectContaining({ name: "I225" }),
      }),
    );

    await listWirelessNetworkAdapters({ ...paging, filter: { name: "AX" } });
    expect(post).toHaveBeenCalledWith(
      "/catalog/wireless-network-adapter/query",
      expect.objectContaining({
        filter: expect.objectContaining({ name: "AX" }),
      }),
    );
  });

  it("omits incomplete ranges from PSU query bodies", async () => {
    post.mockResolvedValue({ data: { items: [], totalCount: 0 } });
    await listPsus({
      ...paging,
      filter: { name: "RM", wattage: { min: 500, max: null } },
    });
    const body = post.mock.calls[0][1] as { filter: Record<string, unknown> };
    expect(body.filter.wattage).toBeUndefined();
  });

  it("loads details by id", async () => {
    get.mockResolvedValue({ data: { ...psu, cables: [] } });
    await expect(getPsuById("psu-1")).resolves.toMatchObject({ id: "psu-1" });
    expect(get).toHaveBeenCalledWith("/catalog/psu/psu-1");

    get.mockResolvedValue({ data: drive });
    await expect(getStorageDriveById("ssd-1")).resolves.toMatchObject({
      id: "ssd-1",
    });
    expect(get).toHaveBeenCalledWith("/catalog/storage-drive/ssd-1");

    get.mockResolvedValue({ data: { ...cooler, sockets: [] } });
    await expect(getCpuCoolerById("cooler-1")).resolves.toMatchObject({
      id: "cooler-1",
    });
    expect(get).toHaveBeenCalledWith("/catalog/cpu-cooler/cooler-1");

    get.mockResolvedValue({ data: fan });
    await expect(getChassisFanById("fan-1")).resolves.toMatchObject({
      id: "fan-1",
    });
    expect(get).toHaveBeenCalledWith("/catalog/chassis-fan/fan-1");

    get.mockResolvedValue({ data: wired });
    await expect(getWiredNetworkAdapterById("nic-1")).resolves.toMatchObject({
      id: "nic-1",
    });
    expect(get).toHaveBeenCalledWith("/catalog/wired-network-adapter/nic-1");

    get.mockResolvedValue({ data: wireless });
    await expect(
      getWirelessNetworkAdapterById("wifi-1"),
    ).resolves.toMatchObject({
      id: "wifi-1",
    });
    expect(get).toHaveBeenCalledWith(
      "/catalog/wireless-network-adapter/wifi-1",
    );
  });
});
