import { describe, expect, it } from "vitest";
import {
  emptyPsuFilter,
  psuListParamsFromSearch,
  psuListSearchFromParams,
} from "@/api/catalog/params/psu-list-params";
import {
  storageDriveListParamsFromSearch,
  storageDriveListSearchFromParams,
} from "@/api/catalog/params/storage-drive-list-params";
import {
  cpuCoolerListParamsFromSearch,
  cpuCoolerListSearchFromParams,
} from "@/api/catalog/params/cpu-cooler-list-params";
import {
  chassisFanListParamsFromSearch,
  chassisFanListSearchFromParams,
} from "@/api/catalog/params/chassis-fan-list-params";
import {
  wiredNetworkAdapterListParamsFromSearch,
  wiredNetworkAdapterListSearchFromParams,
} from "@/api/catalog/params/wired-network-adapter-list-params";
import {
  wirelessNetworkAdapterListParamsFromSearch,
  wirelessNetworkAdapterListSearchFromParams,
} from "@/api/catalog/params/wireless-network-adapter-list-params";

describe("remaining catalog search params", () => {
  it("round-trips PSU, storage, cooler, fan, and NIC filters", () => {
    const psuSearch = psuListSearchFromParams({
      pageIndex: 1,
      pageSize: 10,
      sortBy: "name",
      sortDirection: "asc",
      filter: {
        name: "RM",
        manufacturerId: "corsair",
        wattage: { min: 750, max: 1000 },
        modularity: "FullModular",
        formFactor: "Atx",
        lengthMm: { min: 140, max: 180 },
        widthMm: { min: 140, max: 160 },
        heightMm: { min: 80, max: 90 },
        chassisId: "case-1",
        motherboardId: "mb-1",
        graphicsCardId: "gpu-1",
        cpuId: "cpu-1",
      },
    });
    expect(psuListParamsFromSearch(psuSearch).filter).toMatchObject({
      name: "RM",
      manufacturerId: "corsair",
      wattage: { min: 750, max: 1000 },
      modularity: "FullModular",
      formFactor: "Atx",
      lengthMm: { min: 140, max: 180 },
      chassisId: "case-1",
      motherboardId: "mb-1",
      graphicsCardId: "gpu-1",
      cpuId: "cpu-1",
    });

    const storageSearch = storageDriveListSearchFromParams({
      pageIndex: 0,
      pageSize: 10,
      filter: {
        name: "990",
        media: "Ssd",
        interface: "Nvme",
        formFactor: "M22280",
        capacityGb: { min: 1000, max: 4000 },
        pcieGeneration: "Gen4",
        rpm: { min: 5400, max: 7200 },
        motherboardId: "mb-1",
        chassisId: "case-1",
      },
    });
    expect(
      storageDriveListParamsFromSearch(storageSearch).filter,
    ).toMatchObject({
      name: "990",
      media: "Ssd",
      interface: "Nvme",
      formFactor: "M22280",
      pcieGeneration: "Gen4",
      rpm: { min: 5400, max: 7200 },
      motherboardId: "mb-1",
      chassisId: "case-1",
    });

    const coolerSearch = cpuCoolerListSearchFromParams({
      pageIndex: 0,
      pageSize: 10,
      filter: {
        name: "NH",
        type: "Air",
        socketId: "am5",
        coolerHeightMm: { min: 140, max: 170 },
        maxRamHeightMm: { min: 30, max: 50 },
        cpuId: "cpu-1",
        chassisId: "case-1",
        ramId: "ram-1",
        motherboardId: "mb-1",
      },
    });
    expect(cpuCoolerListParamsFromSearch(coolerSearch).filter).toMatchObject({
      name: "NH",
      type: "Air",
      socketId: "am5",
      coolerHeightMm: { min: 140, max: 170 },
      maxRamHeightMm: { min: 30, max: 50 },
      cpuId: "cpu-1",
      chassisId: "case-1",
      ramId: "ram-1",
      motherboardId: "mb-1",
    });

    const fanSearch = chassisFanListSearchFromParams({
      pageIndex: 0,
      pageSize: 10,
      filter: {
        name: "AF",
        diameterMm: "Mm120",
        fansCountPerPack: 3,
        chassisId: "case-1",
      },
    });
    expect(chassisFanListParamsFromSearch(fanSearch).filter).toMatchObject({
      name: "AF",
      diameterMm: "Mm120",
      fansCountPerPack: 3,
      chassisId: "case-1",
    });

    const wiredSearch = wiredNetworkAdapterListSearchFromParams({
      pageIndex: 0,
      pageSize: 10,
      filter: {
        name: "I225",
        hostInterface: "Pcie",
        usbVersion: "Usb32Gen2",
        usbType: "TypeA",
        pcieSlotType: "X4",
        motherboardId: "mb-1",
      },
    });
    expect(
      wiredNetworkAdapterListParamsFromSearch(wiredSearch).filter,
    ).toMatchObject({
      name: "I225",
      hostInterface: "Pcie",
      usbVersion: "Usb32Gen2",
      usbType: "TypeA",
      pcieSlotType: "X4",
      motherboardId: "mb-1",
    });

    const wirelessSearch = wirelessNetworkAdapterListSearchFromParams({
      pageIndex: 0,
      pageSize: 10,
      filter: {
        name: "AX",
        wifiStandard: "Wifi6E",
        hostInterface: "M2",
        bluetoothVersion: "V5Point2",
        maxSpeedMbps: { min: 1000, max: 2400 },
        maxSpeedMbps5G: { min: 1200, max: 2400 },
        maxSpeedMbps6G: { min: 2400, max: 4800 },
        pcieSlotType: "X1",
        key: "E",
        m2FormFactor: "M22230",
        usbVersion: "Usb32Gen1",
        usbType: "TypeC",
        motherboardId: "mb-1",
      },
    });
    expect(
      wirelessNetworkAdapterListParamsFromSearch(wirelessSearch).filter,
    ).toMatchObject({
      name: "AX",
      wifiStandard: "Wifi6E",
      hostInterface: "M2",
      bluetoothVersion: "V5Point2",
      maxSpeedMbps: { min: 1000, max: 2400 },
      key: "E",
      motherboardId: "mb-1",
    });
  });

  it("omits empty PSU filters from the query string", () => {
    expect(
      psuListSearchFromParams({
        pageIndex: 0,
        pageSize: 10,
        filter: emptyPsuFilter,
      }).toString(),
    ).toBe("");
  });
});
