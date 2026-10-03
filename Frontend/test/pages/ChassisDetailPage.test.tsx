import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ChassisDetail,
  ChassisListItem,
} from "@/api/catalog/chassis.ts";

const getChassisById = vi.fn();
const updateChassis = vi.fn();
const updateChassisMbFormFactors = vi.fn();
const updateChassisPsuFormFactors = vi.fn();

vi.mock("@/api/catalog/chassis", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/chassis")>(
    "@/api/catalog/chassis",
  );
  return {
    ...actual,
    getChassisById: (...args: unknown[]) => getChassisById(...args),
    updateChassis: (...args: unknown[]) => updateChassis(...args),
    updateChassisMbFormFactors: (...args: unknown[]) =>
      updateChassisMbFormFactors(...args),
    updateChassisPsuFormFactors: (...args: unknown[]) =>
      updateChassisPsuFormFactors(...args),
  };
});

vi.mock("@/api/master-data", async () => {
  const actual = await vi.importActual<typeof import("@/api/master-data")>(
    "@/api/master-data",
  );
  return {
    ...actual,
    listManufacturersByProductType: () =>
      Promise.resolve([{ id: "lian-li", name: "Lian Li" }]),
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
      singleDiameterOnly: true,
      options: [{ diameter: "Mm120", slotCount: 3 }],
    },
    {
      location: "Top",
      singleDiameterOnly: false,
      options: [
        { diameter: "Mm140", slotCount: 2 },
        { diameter: "Mm120", slotCount: 2 },
      ],
    },
  ],
  driveBays: [{ formFactors: ["Inch35"], slotCount: 2 }],
  pcieSlots: [
    { lowProfileSlots: false, slotCount: 7, orientation: "Horizontal" },
  ],
  radiators: [
    { length: "Mm360", location: "Top", radiatorCount: 1 },
    { length: "Mm240", location: "Top", radiatorCount: 1 },
  ],
  psuFormFactors: ["Atx"],
  mbFormFactors: ["Atx", "Matx"],
};

function renderDetail(
  route = "/catalog/chassis/chassis-1",
  options?: { isAdmin?: boolean },
) {
  return renderWithQuery(
    <Routes>
      <Route
        path="/catalog/chassis/:chassisId"
        element={<ChassisDetailPage />}
      />
    </Routes>,
    { route, isAdmin: options?.isAdmin },
  );
}

describe("ChassisDetailPage", () => {
  beforeEach(() => {
    getChassisById.mockReset();
    updateChassis.mockReset();
    updateChassisMbFormFactors.mockReset();
    updateChassisPsuFormFactors.mockReset();
  });

  it("renders chassis details and child collections", async () => {
    getChassisById.mockResolvedValue(chassis);
    renderDetail();
    expect(
      await screen.findByRole("heading", { name: "Lian Li O11" }),
    ).toBeInTheDocument();
    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings.indexOf("Dimensions")).toBeLessThan(
      headings.indexOf("Motherboard Dimensions"),
    );
    expect(headings.indexOf("Motherboard Dimensions")).toBeLessThan(
      headings.indexOf("Clearances"),
    );
    const motherboardFormFactors = screen
      .getByRole("heading", { name: "Motherboard form factors" })
      .closest("div")!.parentElement!;
    expect(within(motherboardFormFactors).getByText("Atx")).toBeInTheDocument();
    expect(within(motherboardFormFactors).getByText("Matx")).toBeInTheDocument();
    const psuFormFactors = screen
      .getByRole("heading", { name: "PSU form factors" })
      .closest("div")!.parentElement!;
    expect(within(psuFormFactors).getByText("Atx")).toBeInTheDocument();
    expect(within(psuFormFactors).queryByText("Matx")).not.toBeInTheDocument();
    expect(
      screen.getByRole("rowheader", { name: "Front" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "120 mm x 3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "120 mm x 2 or 140 mm x 2" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Inch35")).toBeInTheDocument();
    expect(screen.getByText("Horizontal")).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "240 mm x 1 or 360 mm x 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "120 mm x 2 or 140 mm x 2" }).closest("table"),
    ).not.toBe(
      screen.getByRole("cell", { name: "240 mm x 1 or 360 mm x 1" }).closest("table"),
    );
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
    expect(await screen.findByText("No fan mounts.")).toBeInTheDocument();
    expect(screen.getByText("No drive bays.")).toBeInTheDocument();
    expect(screen.getByText("No PCIe slots.")).toBeInTheDocument();
    expect(screen.getByText("No radiator mounts.")).toBeInTheDocument();
    expect(screen.getByText("No motherboard form factors.")).toBeInTheDocument();
    expect(screen.getByText("No PSU form factors.")).toBeInTheDocument();
  });

  it("keeps a 3.5 inch drive bay selected in the editor", async () => {
    getChassisById.mockResolvedValue({
      ...chassis,
      driveBays: [
        { formFactors: ["Inch25"], slotCount: 2 },
        { formFactors: ["Inch35"], slotCount: 1 },
      ],
    });
    const user = userEvent.setup();
    renderDetail("/catalog/chassis/chassis-1", { isAdmin: true });

    const heading = await screen.findByRole("heading", { name: "Drive bays" });
    await user.click(
      within(heading.parentElement!).getByRole("button", { name: "Edit" }),
    );

    const twoPointFive = screen.getAllByRole("checkbox", { name: "2.5" });
    const threePointFive = screen.getAllByRole("checkbox", { name: "3.5" });
    expect(twoPointFive[0]).toBeChecked();
    expect(threePointFive[0]).not.toBeChecked();
    expect(twoPointFive[1]).not.toBeChecked();
    expect(threePointFive[1]).toBeChecked();
  });

  it("replaces motherboard and PSU form factors", async () => {
    getChassisById.mockResolvedValue(chassis);
    updateChassisMbFormFactors.mockResolvedValue(["Atx"]);
    updateChassisPsuFormFactors.mockResolvedValue(["Sfx"]);
    const user = userEvent.setup();
    renderDetail("/catalog/chassis/chassis-1", { isAdmin: true });

    const motherboard = await screen.findByRole("heading", {
      name: "Motherboard form factors",
    });
    await user.click(
      within(motherboard.parentElement!).getByRole("button", { name: "Edit" }),
    );
    await user.click(screen.getByRole("button", { name: "Remove row 2" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateChassisMbFormFactors).toHaveBeenCalledWith("chassis-1", [
        "Atx",
      ]);
    });

    const psu = screen.getByRole("heading", { name: "PSU form factors" });
    await user.click(
      within(psu.parentElement!).getByRole("button", { name: "Edit" }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "PSU form factor" }),
      "Sfx",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateChassisPsuFormFactors).toHaveBeenCalledWith("chassis-1", [
        "Sfx",
      ]);
    });
  });

  it("saves only list item fields from the edit dialog", async () => {
    getChassisById.mockResolvedValue(chassis);
    updateChassis.mockResolvedValue(chassis);
    const user = userEvent.setup();
    renderDetail("/catalog/chassis/chassis-1", { isAdmin: true });

    const title = await screen.findByRole("heading", { name: "Lian Li O11" });
    await user.click(
      within(title.parentElement!).getByRole("button", { name: "Edit" }),
    );
    expect(
      screen.getByRole("heading", { name: "Edit Chassis" }),
    ).toBeInTheDocument();
    const name = screen.getByRole("textbox", { name: "Name for Lian Li O11" });
    await user.clear(name);
    await user.type(name, "O11 Dynamic");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateChassis).toHaveBeenCalledTimes(1);
    });
    const [saved] = updateChassis.mock.calls[0] as [ChassisListItem];
    expect(saved.name).toBe("O11 Dynamic");
    expect(saved.manufacturerName).toBe("Lian Li");
    expect(saved).not.toHaveProperty("fanMounts");
    expect(saved).not.toHaveProperty("driveBays");
    expect(saved).not.toHaveProperty("pcieSlots");
  });
});
