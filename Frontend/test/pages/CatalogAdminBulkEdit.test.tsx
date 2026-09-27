import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listChassis = vi.fn();
const updateMultipleChassis = vi.fn();
const listMemories = vi.fn();
const updateMemories = vi.fn();
const listGraphicsCards = vi.fn();
const updateGraphicsCards = vi.fn();
const listCpus = vi.fn();
const updateCpus = vi.fn();
const listMotherboards = vi.fn();
const updateMotherboards = vi.fn();
const listPsus = vi.fn();
const updatePsus = vi.fn();
const listStorageDrives = vi.fn();
const updateStorageDrives = vi.fn();
const listCpuCoolers = vi.fn();
const updateCpuCoolers = vi.fn();
const listChassisFans = vi.fn();
const updateChassisFans = vi.fn();
const listWiredNetworkAdapters = vi.fn();
const updateWiredNetworkAdapters = vi.fn();
const listWirelessNetworkAdapters = vi.fn();
const updateWirelessNetworkAdapters = vi.fn();

const deleteChassis = vi.fn();
const deleteMemories = vi.fn();
const deleteGraphicsCards = vi.fn();
const deleteCpus = vi.fn();
const deleteMotherboards = vi.fn();
const deletePsus = vi.fn();
const deleteStorageDrives = vi.fn();
const deleteCpuCoolers = vi.fn();
const deleteChassisFans = vi.fn();
const deleteWiredNetworkAdapters = vi.fn();
const deleteWirelessNetworkAdapters = vi.fn();

const importChassis = vi.fn();
const importMemories = vi.fn();
const importGraphicsCards = vi.fn();
const importCpus = vi.fn();
const importMotherboards = vi.fn();
const importPsus = vi.fn();
const importStorageDrives = vi.fn();
const importCpuCoolers = vi.fn();
const importChassisFans = vi.fn();
const importWiredNetworkAdapters = vi.fn();
const importWirelessNetworkAdapters = vi.fn();

const listManufacturersByProductType = vi.fn();
const listSockets = vi.fn();
const listCpuSeries = vi.fn();
const listChipsets = vi.fn();
const listGpus = vi.fn();
const listGpuSeries = vi.fn();

vi.mock("@/api/catalog/chassis", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/chassis")>(
    "@/api/catalog/chassis",
  );
  return {
    ...actual,
    listChassis: (...args: unknown[]) => listChassis(...args),
    updateMultipleChassis: (...args: unknown[]) => updateMultipleChassis(...args),
  };
});

vi.mock("@/api/catalog/memories", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/memories")>(
    "@/api/catalog/memories",
  );
  return {
    ...actual,
    listMemories: (...args: unknown[]) => listMemories(...args),
    updateMemories: (...args: unknown[]) => updateMemories(...args),
  };
});

vi.mock("@/api/catalog/graphics-cards", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/graphics-cards")
  >("@/api/catalog/graphics-cards");
  return {
    ...actual,
    listGraphicsCards: (...args: unknown[]) => listGraphicsCards(...args),
    updateGraphicsCards: (...args: unknown[]) => updateGraphicsCards(...args),
  };
});

vi.mock("@/api/catalog/cpus", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/cpus")>(
    "@/api/catalog/cpus",
  );
  return {
    ...actual,
    listCpus: (...args: unknown[]) => listCpus(...args),
    updateCpus: (...args: unknown[]) => updateCpus(...args),
  };
});

vi.mock("@/api/catalog/motherboards", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/motherboards")
  >("@/api/catalog/motherboards");
  return {
    ...actual,
    listMotherboards: (...args: unknown[]) => listMotherboards(...args),
    updateMotherboards: (...args: unknown[]) => updateMotherboards(...args),
  };
});

vi.mock("@/api/catalog/psus", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/psus")>(
    "@/api/catalog/psus",
  );
  return {
    ...actual,
    listPsus: (...args: unknown[]) => listPsus(...args),
    updatePsus: (...args: unknown[]) => updatePsus(...args),
  };
});

vi.mock("@/api/catalog/storage-drives", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/storage-drives")
  >("@/api/catalog/storage-drives");
  return {
    ...actual,
    listStorageDrives: (...args: unknown[]) => listStorageDrives(...args),
    updateStorageDrives: (...args: unknown[]) => updateStorageDrives(...args),
  };
});

vi.mock("@/api/catalog/cpu-coolers", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/cpu-coolers")
  >("@/api/catalog/cpu-coolers");
  return {
    ...actual,
    listCpuCoolers: (...args: unknown[]) => listCpuCoolers(...args),
    updateCpuCoolers: (...args: unknown[]) => updateCpuCoolers(...args),
  };
});

vi.mock("@/api/catalog/chassis-fans", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/chassis-fans")
  >("@/api/catalog/chassis-fans");
  return {
    ...actual,
    listChassisFans: (...args: unknown[]) => listChassisFans(...args),
    updateChassisFans: (...args: unknown[]) => updateChassisFans(...args),
  };
});

vi.mock("@/api/catalog/wired-network-adapters", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/wired-network-adapters")
  >("@/api/catalog/wired-network-adapters");
  return {
    ...actual,
    listWiredNetworkAdapters: (...args: unknown[]) =>
      listWiredNetworkAdapters(...args),
    updateWiredNetworkAdapters: (...args: unknown[]) =>
      updateWiredNetworkAdapters(...args),
  };
});

vi.mock("@/api/catalog/wireless-network-adapters", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/wireless-network-adapters")
  >("@/api/catalog/wireless-network-adapters");
  return {
    ...actual,
    listWirelessNetworkAdapters: (...args: unknown[]) =>
      listWirelessNetworkAdapters(...args),
    updateWirelessNetworkAdapters: (...args: unknown[]) =>
      updateWirelessNetworkAdapters(...args),
  };
});

vi.mock("@/api/catalog/bulk-delete", () => ({
  deleteChassis: (...args: unknown[]) => deleteChassis(...args),
  deleteMemories: (...args: unknown[]) => deleteMemories(...args),
  deleteGraphicsCards: (...args: unknown[]) => deleteGraphicsCards(...args),
  deleteCpus: (...args: unknown[]) => deleteCpus(...args),
  deleteMotherboards: (...args: unknown[]) => deleteMotherboards(...args),
  deletePsus: (...args: unknown[]) => deletePsus(...args),
  deleteStorageDrives: (...args: unknown[]) => deleteStorageDrives(...args),
  deleteCpuCoolers: (...args: unknown[]) => deleteCpuCoolers(...args),
  deleteChassisFans: (...args: unknown[]) => deleteChassisFans(...args),
  deleteWiredNetworkAdapters: (...args: unknown[]) =>
    deleteWiredNetworkAdapters(...args),
  deleteWirelessNetworkAdapters: (...args: unknown[]) =>
    deleteWirelessNetworkAdapters(...args),
}));

vi.mock("@/api/catalog/import-excel", () => ({
  importChassis: (...args: unknown[]) => importChassis(...args),
  importMemories: (...args: unknown[]) => importMemories(...args),
  importGraphicsCards: (...args: unknown[]) => importGraphicsCards(...args),
  importCpus: (...args: unknown[]) => importCpus(...args),
  importMotherboards: (...args: unknown[]) => importMotherboards(...args),
  importPsus: (...args: unknown[]) => importPsus(...args),
  importStorageDrives: (...args: unknown[]) => importStorageDrives(...args),
  importCpuCoolers: (...args: unknown[]) => importCpuCoolers(...args),
  importChassisFans: (...args: unknown[]) => importChassisFans(...args),
  importWiredNetworkAdapters: (...args: unknown[]) =>
    importWiredNetworkAdapters(...args),
  importWirelessNetworkAdapters: (...args: unknown[]) =>
    importWirelessNetworkAdapters(...args),
}));

vi.mock("@/api/master-data", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/master-data")>(
      "@/api/master-data",
    );
  return {
    ...actual,
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    listSockets: () => listSockets(),
    listCpuSeries: () => listCpuSeries(),
    listChipsets: () => listChipsets(),
    listGpus: () => listGpus(),
    listGpuSeries: () => listGpuSeries(),
  };
});

import { ChassisListPage } from "@/pages/catalog/chassis/ChassisListPage.tsx";
import { RamListPage } from "@/pages/catalog/memories/RamListPage.tsx";
import { GraphicsCardListPage } from "@/pages/catalog/graphics-cards/GraphicsCardListPage.tsx";
import { CpuListPage } from "@/pages/catalog/cpus/CpuListPage.tsx";
import { MotherboardListPage } from "@/pages/catalog/motherboards/MotherboardListPage.tsx";
import { PsuListPage } from "@/pages/catalog/psus/PsuListPage.tsx";
import { StorageListPage } from "@/pages/catalog/storage-drives/StorageListPage.tsx";
import { CpuCoolerListPage } from "@/pages/catalog/cpu-coolers/CpuCoolerListPage.tsx";
import { ChassisFanListPage } from "@/pages/catalog/chassis-fans/ChassisFanListPage.tsx";
import { WiredNetworkAdapterListPage } from "@/pages/catalog/wired-network-adapters/WiredNetworkAdapterListPage.tsx";
import { WirelessNetworkAdapterListPage } from "@/pages/catalog/wireless-network-adapters/WirelessNetworkAdapterListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const page = (item: object) => ({
  items: [item],
  totalCount: 1,
  pageIndex: 0,
  pageSize: 10,
});

const manufacturers = [{ id: "maker", name: "Maker" }];

function fillDialog(dialog: HTMLElement) {
  for (const input of [...dialog.querySelectorAll("input")]) {
    if (input.type === "checkbox") {
      fireEvent.click(input);
      continue;
    }
    fireEvent.change(input, {
      target: { value: input.type === "number" ? "2" : "Edited" },
    });
  }
  for (const select of [...dialog.querySelectorAll("select")]) {
    const option = [...select.options].find((item) => item.value);
    if (option) {
      fireEvent.change(select, { target: { value: option.value } });
    }
  }
}

async function exerciseAdminList({
  Page,
  route,
  linkName,
  dialogName,
  update,
  remove,
  importer,
}: {
  Page: ComponentType;
  route: string;
  linkName: string;
  dialogName: string;
  update: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  importer: ReturnType<typeof vi.fn>;
}) {
  const user = userEvent.setup();
  const view = renderWithQuery(<Page />, { route, isAdmin: true });
  const row = await screen.findByRole("row", { name: new RegExp(linkName) });
  await user.click(within(row).getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Edit Selected" }));
  const dialog = await screen.findByRole("dialog", { name: dialogName });
  fillDialog(dialog);
  await user.click(within(dialog).getByRole("button", { name: "Save" }));
  await waitFor(() => {
    expect(update).toHaveBeenCalled();
  });

  const savedRow = await screen.findByRole("row", { name: new RegExp(linkName) });
  const checkbox = within(savedRow).getByRole("checkbox");
  if (!(checkbox as HTMLInputElement).checked) {
    await user.click(checkbox);
  }
  await user.click(screen.getByRole("button", { name: "Delete Selected" }));
  await waitFor(() => {
    expect(remove).toHaveBeenCalledWith({ ids: [expect.any(String)] });
  });

  await user.click(screen.getByRole("button", { name: "Import" }));
  const importerDialog = await screen.findByRole("dialog", {
    name: "Import from Excel",
  });
  fireEvent.change(within(importerDialog).getByLabelText("Excel file"), {
    target: { files: [new File(["sheet"], "parts.xlsx")] },
  });
  await user.click(within(importerDialog).getByRole("button", { name: "Import" }));
  await waitFor(() => {
    expect(importer).toHaveBeenCalled();
  });
  view.unmount();
}

describe("catalog admin bulk actions", () => {
  beforeEach(() => {
    for (const fn of [
      listChassis,
      updateMultipleChassis,
      listMemories,
      updateMemories,
      listGraphicsCards,
      updateGraphicsCards,
      listCpus,
      updateCpus,
      listMotherboards,
      updateMotherboards,
      listPsus,
      updatePsus,
      listStorageDrives,
      updateStorageDrives,
      listCpuCoolers,
      updateCpuCoolers,
      listChassisFans,
      updateChassisFans,
      listWiredNetworkAdapters,
      updateWiredNetworkAdapters,
      listWirelessNetworkAdapters,
      updateWirelessNetworkAdapters,
      deleteChassis,
      deleteMemories,
      deleteGraphicsCards,
      deleteCpus,
      deleteMotherboards,
      deletePsus,
      deleteStorageDrives,
      deleteCpuCoolers,
      deleteChassisFans,
      deleteWiredNetworkAdapters,
      deleteWirelessNetworkAdapters,
      importChassis,
      importMemories,
      importGraphicsCards,
      importCpus,
      importMotherboards,
      importPsus,
      importStorageDrives,
      importCpuCoolers,
      importChassisFans,
      importWiredNetworkAdapters,
      importWirelessNetworkAdapters,
    ]) {
      fn.mockReset().mockResolvedValue(undefined);
    }
    listManufacturersByProductType.mockReset().mockResolvedValue(manufacturers);
    listSockets.mockReset().mockResolvedValue([
      {
        id: "am5",
        name: "AM5",
        manufacturerId: "maker",
        manufacturerName: "Maker",
      },
    ]);
    listCpuSeries.mockReset().mockResolvedValue([
      {
        id: "r7",
        name: "Ryzen 7",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        socketId: "am5",
        socketName: "AM5",
      },
    ]);
    listChipsets.mockReset().mockResolvedValue([
      {
        id: "x870",
        name: "X870",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        socketId: "am5",
        socketName: "AM5",
      },
    ]);
    listGpus.mockReset().mockResolvedValue([
      {
        id: "4070",
        name: "RTX 4070",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        gpuSeriesId: "rtx40",
        gpuSeriesName: "RTX 40",
      },
    ]);
    listGpuSeries.mockReset().mockResolvedValue([
      {
        id: "rtx40",
        name: "RTX 40",
        manufacturerId: "maker",
        manufacturerName: "Maker",
      },
    ]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("edits, deletes, and imports chassis", async () => {
    listChassis.mockResolvedValue(
      page({
        id: "chassis-1",
        name: "O11",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        lengthMm: 465,
        widthMm: 285,
        heightMm: 446,
        motherboardMaxWidthMm: 305,
        motherboardMaxHeightMm: 330,
        maxCpuCoolerHeightMm: 167,
        maxGraphicsCardLengthMm: 420,
        maxPsuLengthMm: 220,
      }),
    );
    await exerciseAdminList({
      Page: ChassisListPage,
      route: "/catalog/chassis",
      linkName: "O11",
      dialogName: "Edit Chassis",
      update: updateMultipleChassis,
      remove: deleteChassis,
      importer: importChassis,
    });
  });

  it("edits, deletes, and imports memory", async () => {
    listMemories.mockResolvedValue(
      page({
        id: "ram-1",
        name: "Trident Z5",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        color: "Black",
        ddrGeneration: "Ddr5",
        ramFormFactor: "UDimm",
        ramRank: "DualRank",
        memorySizePerStickGb: 16,
        totalMemorySizeGb: 32,
        modulesCount: 2,
        maxMemorySpeedMts: 6000,
        heightMm: 44,
      }),
    );
    await exerciseAdminList({
      Page: RamListPage,
      route: "/catalog/memory",
      linkName: "Trident Z5",
      dialogName: "Edit Memories",
      update: updateMemories,
      remove: deleteMemories,
      importer: importMemories,
    });
  });

  it("edits, deletes, and imports graphics cards", async () => {
    listGraphicsCards.mockResolvedValue(
      page({
        id: "gpu-1",
        name: "TUF RTX 4070",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        gpuId: "4070",
        gpuName: "RTX 4070",
        videoMemoryGb: 12,
        pcieSlotsUsed: 2,
        pcieGeneration: "Gen4",
        isLowProfile: false,
        lengthMm: 305,
        widthMm: 140,
        heightMm: 50,
        powerConsumptionWatts: 200,
        powerConnectorType: "Pcie6Plus2Pin",
        powerConnectorCount: 1,
      }),
    );
    await exerciseAdminList({
      Page: GraphicsCardListPage,
      route: "/catalog/graphics-cards",
      linkName: "TUF RTX 4070",
      dialogName: "Edit Graphics Cards",
      update: updateGraphicsCards,
      remove: deleteGraphicsCards,
      importer: importGraphicsCards,
    });
  });

  it("edits, deletes, and imports CPUs", async () => {
    listCpus.mockResolvedValue(
      page({
        id: "cpu-1",
        name: "Ryzen 7 7800X3D",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        seriesId: "r7",
        seriesName: "Ryzen 7",
        socketId: "am5",
        socketName: "AM5",
        maxMemoryGb: 128,
        integratedGraphics: false,
        includedStockCooler: false,
        thermalDesignPower: 120,
        powerConsumptionWatts: 120,
      }),
    );
    await exerciseAdminList({
      Page: CpuListPage,
      route: "/catalog/cpus",
      linkName: "Ryzen 7 7800X3D",
      dialogName: "Edit CPUs",
      update: updateCpus,
      remove: deleteCpus,
      importer: importCpus,
    });
  });

  it("edits, deletes, and imports motherboards", async () => {
    listMotherboards.mockResolvedValue(
      page({
        id: "mb-1",
        name: "ROG Strix",
        manufacturerId: "maker",
        manufacturerName: "Maker",
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
      }),
    );
    await exerciseAdminList({
      Page: MotherboardListPage,
      route: "/catalog/motherboards",
      linkName: "ROG Strix",
      dialogName: "Edit Motherboards",
      update: updateMotherboards,
      remove: deleteMotherboards,
      importer: importMotherboards,
    });
  });

  it("edits, deletes, and imports PSUs", async () => {
    listPsus.mockResolvedValue(
      page({
        id: "psu-1",
        name: "RM850x",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        wattage: 850,
        modularity: "FullModular",
        formFactor: "Atx",
        lengthMm: 160,
        widthMm: 150,
        heightMm: 86,
        cables: [],
      }),
    );
    await exerciseAdminList({
      Page: PsuListPage,
      route: "/catalog/psus",
      linkName: "RM850x",
      dialogName: "Edit PSUs",
      update: updatePsus,
      remove: deletePsus,
      importer: importPsus,
    });
  });

  it("edits, deletes, and imports storage", async () => {
    listStorageDrives.mockResolvedValue(
      page({
        id: "ssd-1",
        name: "990 PRO",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        media: "Ssd",
        interface: "Nvme",
        formFactor: "M22280",
        capacityGb: 2000,
        isM2: true,
        pcieGeneration: "Gen4",
        moduleKey: "M",
        m2FormFactor: "M22280",
      }),
    );
    await exerciseAdminList({
      Page: StorageListPage,
      route: "/catalog/storage",
      linkName: "990 PRO",
      dialogName: "Edit Storage Drives",
      update: updateStorageDrives,
      remove: deleteStorageDrives,
      importer: importStorageDrives,
    });
  });

  it("edits, deletes, and imports CPU coolers", async () => {
    listCpuCoolers.mockResolvedValue(
      page({
        id: "cooler-1",
        name: "NH-D15",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        maxTdp: 220,
        type: "Air",
        coolerHeightMm: 165,
        sockets: [{ socketId: "am5", socketName: "AM5" }],
      }),
    );
    await exerciseAdminList({
      Page: CpuCoolerListPage,
      route: "/catalog/cpu-coolers",
      linkName: "NH-D15",
      dialogName: "Edit CPU Coolers",
      update: updateCpuCoolers,
      remove: deleteCpuCoolers,
      importer: importCpuCoolers,
    });
  });

  it("edits, deletes, and imports chassis fans", async () => {
    listChassisFans.mockResolvedValue(
      page({
        id: "fan-1",
        name: "AF120",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        diameterMm: "Mm120",
        fansCountPerPack: 3,
      }),
    );
    await exerciseAdminList({
      Page: ChassisFanListPage,
      route: "/catalog/chassis-fans",
      linkName: "AF120",
      dialogName: "Edit Chassis Fans",
      update: updateChassisFans,
      remove: deleteChassisFans,
      importer: importChassisFans,
    });
  });

  it("edits, deletes, and imports wired adapters", async () => {
    listWiredNetworkAdapters.mockResolvedValue(
      page({
        id: "nic-1",
        name: "I225-V",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        hostInterface: "Pcie",
        maxSpeedMbps: 2500,
        pcieSlotType: "X1",
      }),
    );
    await exerciseAdminList({
      Page: WiredNetworkAdapterListPage,
      route: "/catalog/wired-network-adapters",
      linkName: "I225-V",
      dialogName: "Edit Wired Network Adapters",
      update: updateWiredNetworkAdapters,
      remove: deleteWiredNetworkAdapters,
      importer: importWiredNetworkAdapters,
    });
  });

  it("edits, deletes, and imports wireless adapters", async () => {
    listWirelessNetworkAdapters.mockResolvedValue(
      page({
        id: "wifi-1",
        name: "AX210",
        manufacturerId: "maker",
        manufacturerName: "Maker",
        wifiStandard: "Wifi6E",
        bluetoothVersion: "V5Point2",
        hostInterface: "M2",
        maxSpeedMbps: 2400,
        key: "E",
        m2FormFactor: "M22230",
      }),
    );
    await exerciseAdminList({
      Page: WirelessNetworkAdapterListPage,
      route: "/catalog/wireless-network-adapters",
      linkName: "AX210",
      dialogName: "Edit Wireless Network Adapters",
      update: updateWirelessNetworkAdapters,
      remove: deleteWirelessNetworkAdapters,
      importer: importWirelessNetworkAdapters,
    });
  });
});
