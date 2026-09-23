import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChassisDetail } from "@/api/catalog/chassis.ts";

const getChassisById = vi.fn();

vi.mock("@/api/catalog/chassis", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/chassis")>(
    "@/api/catalog/chassis",
  );
  return {
    ...actual,
    getChassisById: (...args: unknown[]) => getChassisById(...args),
  };
});

import { ChassisDetailPage } from "@/pages/catalog/chassis/ChassisDetailPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";
import { Route, Routes } from "react-router-dom";

const chassis: ChassisDetail = {
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
  fanMounts: [
    {
      location: "Front",
      singleDiameterOnly: false,
      options: [{ diameter: "Mm120", slotCount: 3 }],
    },
  ],
  driveBays: [{ formFactor: "3.5", slotCount: 2 }],
  pcieSlots: [
    { lowProfileSlots: false, slotCount: 7, orientation: "Horizontal" },
  ],
  radiators: [{ length: "Mm360", location: "Top", radiatorCount: 1 }],
  psuFormFactors: ["Atx"],
  mbFormFactors: ["Atx", "Matx"],
};

function renderDetail(route = "/catalog/chassis/chassis-1") {
  return renderWithQuery(
    <Routes>
      <Route
        path="/catalog/chassis/:chassisId"
        element={<ChassisDetailPage />}
      />
    </Routes>,
    { route },
  );
}

describe("ChassisDetailPage", () => {
  beforeEach(() => {
    getChassisById.mockReset();
  });

  it("renders chassis details and child collections", async () => {
    getChassisById.mockResolvedValue(chassis);
    renderDetail();
    expect(
      await screen.findByRole("heading", { name: "Lian Li O11" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lian Li")).toBeInTheDocument();
    expect(screen.getByText("Atx, Matx")).toBeInTheDocument();
    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("120 mm")).toBeInTheDocument();
    expect(screen.getByText("3.5")).toBeInTheDocument();
    expect(screen.getByText("Horizontal")).toBeInTheDocument();
    expect(screen.getByText("360 mm")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Chassis" }),
    ).toHaveAttribute("href", "/catalog/chassis");
  });

  it("shows an API error", async () => {
    getChassisById.mockRejectedValue(new Error("fail"));
    renderDetail();
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("shows a loading state", async () => {
    getChassisById.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(await screen.findByText("Loading chassis…")).toBeInTheDocument();
  });

  it("shows empty collection messages", async () => {
    getChassisById.mockResolvedValue({
      ...chassis,
      fanMounts: [],
      driveBays: [],
      pcieSlots: [],
      radiators: [],
      psuFormFactors: [],
      mbFormFactors: [],
    });
    renderDetail();
    expect(await screen.findAllByText("None")).toHaveLength(2);
    expect(screen.getByText("No fan mounts.")).toBeInTheDocument();
    expect(screen.getByText("No drive bays.")).toBeInTheDocument();
    expect(screen.getByText("No PCIe slots.")).toBeInTheDocument();
    expect(screen.getByText("No radiator mounts.")).toBeInTheDocument();
  });
});
