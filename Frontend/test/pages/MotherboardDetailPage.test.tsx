import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MotherboardDetail } from "@/api/catalog/motherboards";

const getMotherboardById = vi.fn();

vi.mock("@/api/catalog/motherboards", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/motherboards")>(
    "@/api/catalog/motherboards",
  );
  return {
    ...actual,
    getMotherboardById: (...args: unknown[]) => getMotherboardById(...args),
  };
});

import { MotherboardDetailPage } from "@/pages/catalog/MotherboardDetailPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";
import { Route, Routes } from "react-router-dom";

const motherboard: MotherboardDetail = {
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
  bluetoothEnabled: false,
  pcieSlots: [
    {
      slotType: "X16",
      slotLanes: "X16",
      generation: "Gen5",
      slotCount: 1,
    },
  ],
  m2Slots: [
    {
      key: "M",
      pcieGeneration: "Gen5",
      slotCount: 1,
      supportsSata: false,
      formFactors: ["M22280", "M222110"],
    },
  ],
  usbPorts: [
    {
      usbVersion: "Usb32Gen2",
      usbType: "TypeC",
      portCount: 2,
    },
  ],
};

function renderDetail(route = "/catalog/motherboards/mb-1") {
  return renderWithQuery(
    <Routes>
      <Route
        path="/catalog/motherboards/:motherboardId"
        element={<MotherboardDetailPage />}
      />
    </Routes>,
    { route },
  );
}

describe("MotherboardDetailPage", () => {
  beforeEach(() => {
    getMotherboardById.mockReset();
  });

  it("renders motherboard details and child collections", async () => {
    getMotherboardById.mockResolvedValue(motherboard);
    renderDetail();
    expect(
      await screen.findByRole("heading", { name: "ROG Strix X870-F" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ASUS")).toBeInTheDocument();
    expect(screen.getByText("X870")).toBeInTheDocument();
    expect(screen.getByText("DDR5")).toBeInTheDocument();
    expect(screen.getAllByText("PCIe 5")).toHaveLength(2);
    expect(screen.getByText("2280, 22110")).toBeInTheDocument();
    expect(screen.getByText("Usb32Gen2")).toBeInTheDocument();
    expect(screen.getByText("TypeC")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Motherboards" }),
    ).toHaveAttribute("href", "/catalog/motherboards");
  });

  it("shows an API error", async () => {
    getMotherboardById.mockRejectedValue(new Error("fail"));
    renderDetail();
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("shows a loading state", async () => {
    getMotherboardById.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(
      await screen.findByText("Loading motherboard…"),
    ).toBeInTheDocument();
  });

  it("shows empty collection messages", async () => {
    getMotherboardById.mockResolvedValue({
      ...motherboard,
      pcieSlots: [],
      m2Slots: [],
      usbPorts: [],
    });
    renderDetail();
    expect(await screen.findByText("No PCIe slots.")).toBeInTheDocument();
    expect(screen.getByText("No M.2 slots.")).toBeInTheDocument();
    expect(screen.getByText("No USB ports.")).toBeInTheDocument();
  });

  it("shows none when an M.2 slot has no form factors", async () => {
    getMotherboardById.mockResolvedValue({
      ...motherboard,
      m2Slots: [
        {
          key: "M",
          pcieGeneration: "Gen4",
          slotCount: 1,
          supportsSata: true,
          formFactors: [],
        },
      ],
    });
    renderDetail();
    expect(await screen.findByText("None")).toBeInTheDocument();
  });

  it("shows not found when the motherboard is missing", async () => {
    getMotherboardById.mockResolvedValue(null);
    renderDetail();
    expect(
      await screen.findByText("Motherboard not found."),
    ).toBeInTheDocument();
  });
});
