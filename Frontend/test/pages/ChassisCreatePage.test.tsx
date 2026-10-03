import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createChassis = vi.fn();

vi.mock("@/api/catalog/chassis", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/catalog/chassis")>(
      "@/api/catalog/chassis",
    );
  return {
    ...actual,
    createChassis: (...args: unknown[]) => createChassis(...args),
  };
});

vi.mock("@/api/master-data", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/master-data")>(
      "@/api/master-data",
    );
  return {
    ...actual,
    listManufacturersByProductType: vi
      .fn()
      .mockResolvedValue([{ id: "cm", name: "Cooler Master" }]),
  };
});

import { ChassisCreatePage } from "@/pages/catalog/chassis/ChassisCreatePage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

describe("ChassisCreatePage", () => {
  beforeEach(() => {
    createChassis.mockReset();
    createChassis.mockResolvedValue({ id: "chassis-new" });
  });

  it("posts drive bays from the child table", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ChassisCreatePage />, { route: "/catalog/chassis/new" });

    expect(
      await screen.findByRole("heading", { name: "New chassis" }),
    ).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: /^Name for/ }), "NR200");
    await user.click(screen.getByRole("button", { name: "Add Drive bays" }));
    expect(screen.getByRole("checkbox", { name: "3.5" })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "2.5" }));

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(createChassis).toHaveBeenCalledTimes(1));
    expect(createChassis).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "NR200",
        driveBays: [{ formFactors: ["Inch35", "Inch25"], slotCount: 1 }],
        mbFormFactors: [],
        psuFormFactors: [],
        pcieSlots: [],
        fanMounts: [],
        radiators: [],
      }),
    );
  });
});
