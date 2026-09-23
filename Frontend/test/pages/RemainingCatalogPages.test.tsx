import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PsuDetail } from "@/api/catalog/psus";
import type { StorageDrive } from "@/api/catalog/storage-drives";
import type { CpuCoolerDetail } from "@/api/catalog/cpu-coolers";
import type { ChassisFan } from "@/api/catalog/chassis-fans";
import type { WiredNetworkAdapter } from "@/api/catalog/wired-network-adapters";
import type { WirelessNetworkAdapter } from "@/api/catalog/wireless-network-adapters";

const listPsus = vi.fn();
const getPsuById = vi.fn();
const listStorageDrives = vi.fn();
const getStorageDriveById = vi.fn();
const listCpuCoolers = vi.fn();
const getCpuCoolerById = vi.fn();
const listChassisFans = vi.fn();
const getChassisFanById = vi.fn();
const listWiredNetworkAdapters = vi.fn();
const getWiredNetworkAdapterById = vi.fn();
const listWirelessNetworkAdapters = vi.fn();
const getWirelessNetworkAdapterById = vi.fn();
const listManufacturersByProductType = vi.fn();
const listSockets = vi.fn();

vi.mock("@/api/catalog/psus", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/catalog/psus")>(
      "@/api/catalog/psus",
    );
  return {
    ...actual,
    listPsus: (...args: unknown[]) => listPsus(...args),
    getPsuById: (...args: unknown[]) => getPsuById(...args),
  };
});

vi.mock("@/api/catalog/storage-drives", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/storage-drives")
  >("@/api/catalog/storage-drives");
  return {
    ...actual,
    listStorageDrives: (...args: unknown[]) => listStorageDrives(...args),
    getStorageDriveById: (...args: unknown[]) => getStorageDriveById(...args),
  };
});

vi.mock("@/api/catalog/cpu-coolers", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/cpu-coolers")
  >("@/api/catalog/cpu-coolers");
  return {
    ...actual,
    listCpuCoolers: (...args: unknown[]) => listCpuCoolers(...args),
    getCpuCoolerById: (...args: unknown[]) => getCpuCoolerById(...args),
  };
});

vi.mock("@/api/catalog/chassis-fans", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/chassis-fans")
  >("@/api/catalog/chassis-fans");
  return {
    ...actual,
    listChassisFans: (...args: unknown[]) => listChassisFans(...args),
    getChassisFanById: (...args: unknown[]) => getChassisFanById(...args),
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
    getWiredNetworkAdapterById: (...args: unknown[]) =>
      getWiredNetworkAdapterById(...args),
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
    getWirelessNetworkAdapterById: (...args: unknown[]) =>
      getWirelessNetworkAdapterById(...args),
  };
});

vi.mock("@/api/builds", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/builds")>("@/api/builds");
  return {
    ...actual,
    checkPcBuildCompatibility: vi.fn().mockResolvedValue({
      status: "Compatible",
      issues: [],
    }),
  };
});

vi.mock("@/api/master-data", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/master-data")>(
      "@/api/master-data",
    );
  return {
    ...actual,
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    listSockets: (...args: unknown[]) => listSockets(...args),
  };
});

import { PsuListPage } from "@/pages/catalog/psus/PsuListPage.tsx";
import { PsuDetailPage } from "@/pages/catalog/psus/PsuDetailPage.tsx";
import { StorageListPage } from "@/pages/catalog/storage-drives/StorageListPage.tsx";
import { StorageDetailPage } from "@/pages/catalog/storage-drives/StorageDetailPage.tsx";
import { CpuCoolerListPage } from "@/pages/catalog/cpu-coolers/CpuCoolerListPage.tsx";
import { CpuCoolerDetailPage } from "@/pages/catalog/cpu-coolers/CpuCoolerDetailPage.tsx";
import { ChassisFanListPage } from "@/pages/catalog/chassis-fans/ChassisFanListPage.tsx";
import { ChassisFanDetailPage } from "@/pages/catalog/chassis-fans/ChassisFanDetailPage.tsx";
import { WiredNetworkAdapterListPage } from "@/pages/catalog/wired-network-adapters/WiredNetworkAdapterListPage.tsx";
import { WiredNetworkAdapterDetailPage } from "@/pages/catalog/wired-network-adapters/WiredNetworkAdapterDetailPage.tsx";
import { WirelessNetworkAdapterListPage } from "@/pages/catalog/wireless-network-adapters/WirelessNetworkAdapterListPage.tsx";
import { WirelessNetworkAdapterDetailPage } from "@/pages/catalog/wireless-network-adapters/WirelessNetworkAdapterDetailPage.tsx";
import { BuilderPage } from "@/pages/build/BuilderPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const paged = (item: unknown) => ({
  items: [item],
  totalCount: 1,
  pageIndex: 0,
  pageSize: 10,
});

const psu: PsuDetail = {
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
  cables: [{ type: "Motherboard24Pin", cablesCount: 1, connectorsCount: 1 }],
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
  pcieGeneration: "Gen4",
  moduleKey: "M",
  m2FormFactor: "M22280",
};

const cooler: CpuCoolerDetail = {
  id: "cooler-1",
  name: "NH-D15",
  manufacturerId: "noctua",
  manufacturerName: "Noctua",
  maxTdp: 220,
  type: "Air",
  coolerHeightMm: 165,
  sockets: [{ socketId: "am5", socketName: "AM5" }],
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
  bluetoothVersion: "V5Point2",
  hostInterface: "M2",
  maxSpeedMbps: 2400,
  key: "E",
  m2FormFactor: "M22230",
};

describe("remaining catalog pages", () => {
  beforeEach(() => {
    listManufacturersByProductType
      .mockReset()
      .mockResolvedValue([{ id: "corsair", name: "Corsair" }]);
    listSockets.mockReset().mockResolvedValue([{ id: "am5", name: "AM5" }]);
    listPsus.mockReset().mockResolvedValue(paged(psu));
    getPsuById.mockReset().mockResolvedValue(psu);
    listStorageDrives.mockReset().mockResolvedValue(paged(drive));
    getStorageDriveById.mockReset().mockResolvedValue(drive);
    listCpuCoolers.mockReset().mockResolvedValue(paged(cooler));
    getCpuCoolerById.mockReset().mockResolvedValue(cooler);
    listChassisFans.mockReset().mockResolvedValue(paged(fan));
    getChassisFanById.mockReset().mockResolvedValue(fan);
    listWiredNetworkAdapters.mockReset().mockResolvedValue(paged(wired));
    getWiredNetworkAdapterById.mockReset().mockResolvedValue(wired);
    listWirelessNetworkAdapters.mockReset().mockResolvedValue(paged(wireless));
    getWirelessNetworkAdapterById.mockReset().mockResolvedValue(wireless);
  });

  it("lists and filters PSUs", async () => {
    const user = userEvent.setup();
    renderWithQuery(<PsuListPage />, { route: "/catalog/psus" });
    expect(await screen.findByRole("link", { name: "RM850x" })).toHaveAttribute(
      "href",
      "/catalog/psus/psu-1",
    );
    expect(listManufacturersByProductType).toHaveBeenCalledWith("psu");
    await user.type(screen.getByLabelText("Name"), "RM");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(listPsus).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ name: "RM" }),
      }),
    );
  });

  it("shows PSU details and cables", async () => {
    renderWithQuery(
      <Routes>
        <Route path="/catalog/psus/:psuId" element={<PsuDetailPage />} />
      </Routes>,
      { route: "/catalog/psus/psu-1" },
    );
    expect(
      await screen.findByRole("heading", { name: "RM850x" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Motherboard24Pin")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to PSUs" })).toHaveAttribute(
      "href",
      "/catalog/psus",
    );
  });

  it("lists storage and shows drive details", async () => {
    const list = renderWithQuery(<StorageListPage />, {
      route: "/catalog/storage",
    });
    expect(
      await screen.findByRole("link", { name: "990 PRO" }),
    ).toHaveAttribute("href", "/catalog/storage/ssd-1");
    list.unmount();
    renderWithQuery(
      <Routes>
        <Route
          path="/catalog/storage/:storageId"
          element={<StorageDetailPage />}
        />
      </Routes>,
      { route: "/catalog/storage/ssd-1" },
    );
    expect(
      await screen.findByRole("heading", { name: "990 PRO" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Storage" }),
    ).toHaveAttribute("href", "/catalog/storage");
    expect(screen.getByLabelText("QTY")).toHaveValue(1);
    expect(
      screen.getByRole("button", { name: "Add to Build" }),
    ).toBeInTheDocument();
  });

  it("lists CPU coolers and sockets on detail", async () => {
    const user = userEvent.setup();
    const list = renderWithQuery(<CpuCoolerListPage />, {
      route: "/catalog/cpu-coolers",
    });
    expect(await screen.findByRole("link", { name: "NH-D15" })).toHaveAttribute(
      "href",
      "/catalog/cpu-coolers/cooler-1",
    );
    await user.type(screen.getByLabelText("Height (mm)"), "140");
    await user.type(screen.getByLabelText("Height max"), "170");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(listCpuCoolers).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          coolerHeightMm: { min: 140, max: 170 },
        }),
      }),
    );
    list.unmount();
    renderWithQuery(
      <Routes>
        <Route
          path="/catalog/cpu-coolers/:cpuCoolerId"
          element={<CpuCoolerDetailPage />}
        />
      </Routes>,
      { route: "/catalog/cpu-coolers/cooler-1" },
    );
    expect(await screen.findByText("AM5")).toBeInTheDocument();
    expect(screen.queryByLabelText("QTY")).not.toBeInTheDocument();
  });

  it("lists chassis fans and NIC pages", async () => {
    const fans = renderWithQuery(<ChassisFanListPage />, {
      route: "/catalog/chassis-fans",
    });
    expect(await screen.findByRole("link", { name: "AF120" })).toHaveAttribute(
      "href",
      "/catalog/chassis-fans/fan-1",
    );
    fans.unmount();
    const fanDetail = renderWithQuery(
      <Routes>
        <Route
          path="/catalog/chassis-fans/:chassisFanId"
          element={<ChassisFanDetailPage />}
        />
      </Routes>,
      { route: "/catalog/chassis-fans/fan-1" },
    );
    expect(
      await screen.findByRole("link", { name: "Back to Chassis Fans" }),
    ).toHaveAttribute("href", "/catalog/chassis-fans");
    expect(screen.getByLabelText("QTY")).toBeInTheDocument();
    fanDetail.unmount();

    const wiredList = renderWithQuery(<WiredNetworkAdapterListPage />, {
      route: "/catalog/wired-network-adapters",
    });
    expect(await screen.findByRole("link", { name: "I225-V" })).toHaveAttribute(
      "href",
      "/catalog/wired-network-adapters/nic-1",
    );
    wiredList.unmount();
    const wiredDetail = renderWithQuery(
      <Routes>
        <Route
          path="/catalog/wired-network-adapters/:wiredNetworkAdapterId"
          element={<WiredNetworkAdapterDetailPage />}
        />
      </Routes>,
      { route: "/catalog/wired-network-adapters/nic-1" },
    );
    expect(
      await screen.findByRole("link", {
        name: "Back to Wired Network Adapters",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("QTY")).toBeInTheDocument();
    wiredDetail.unmount();

    const wirelessList = renderWithQuery(<WirelessNetworkAdapterListPage />, {
      route: "/catalog/wireless-network-adapters",
    });
    expect(await screen.findByRole("link", { name: "AX210" })).toHaveAttribute(
      "href",
      "/catalog/wireless-network-adapters/wifi-1",
    );
    wirelessList.unmount();
    renderWithQuery(
      <Routes>
        <Route
          path="/catalog/wireless-network-adapters/:wirelessNetworkAdapterId"
          element={<WirelessNetworkAdapterDetailPage />}
        />
      </Routes>,
      { route: "/catalog/wireless-network-adapters/wifi-1" },
    );
    expect(
      await screen.findByRole("link", {
        name: "Back to Wireless Network Adapters",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("QTY")).toBeInTheDocument();
  });

  it("adds storage to the build using the QTY input", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <Routes>
        <Route
          path="/catalog/storage/:storageId"
          element={<StorageDetailPage />}
        />
        <Route path="/build/current" element={<BuilderPage />} />
        <Route path="/build/:buildId/edit" element={<BuilderPage />} />
        <Route path="/build/:buildId" element={<BuilderPage />} />
      </Routes>,
      { route: "/catalog/storage/ssd-1" },
    );
    const qty = await screen.findByLabelText("QTY");
    fireEvent.change(qty, { target: { value: "3" } });
    await user.click(screen.getByRole("button", { name: "Add to Build" }));
    expect(await screen.findByText("Qty 3")).toBeInTheDocument();
  });

  it("shows empty and error states for PSUs", async () => {
    listPsus.mockResolvedValue({
      items: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<PsuListPage />, { route: "/catalog/psus" });
    expect(
      await screen.findByText("No PSUs in the catalog yet."),
    ).toBeInTheDocument();

    listPsus.mockRejectedValue(new Error("fail"));
    renderWithQuery(<PsuListPage />, { route: "/catalog/psus" });
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();

    getPsuById.mockResolvedValue(null);
    renderWithQuery(
      <Routes>
        <Route path="/catalog/psus/:psuId" element={<PsuDetailPage />} />
      </Routes>,
      { route: "/catalog/psus/missing" },
    );
    expect(await screen.findByText("PSU not found.")).toBeInTheDocument();
  });
});
