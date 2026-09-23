import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChassisListItem } from "@/api/catalog/chassis";

const listChassis = vi.fn();
const listManufacturersByProductType = vi.fn();

vi.mock("@/api/catalog/chassis", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/chassis")>(
    "@/api/catalog/chassis",
  );
  return {
    ...actual,
    listChassis: (...args: unknown[]) => listChassis(...args),
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
  };
});

import { ChassisListPage } from "@/pages/catalog/chassis/ChassisListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const chassis: ChassisListItem = {
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
};

describe("ChassisListPage", () => {
  beforeEach(() => {
    listChassis.mockReset();
    listManufacturersByProductType
      .mockReset()
      .mockResolvedValue([{ id: "lian-li", name: "Lian Li" }]);
  });

  it("loads the unfiltered catalog", async () => {
    listChassis.mockResolvedValue({
      items: [chassis],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<ChassisListPage />, { route: "/catalog/chassis" });
    expect(
      await screen.findByRole("link", { name: "Lian Li O11" }),
    ).toHaveAttribute("href", "/catalog/chassis/chassis-1");
    expect(listManufacturersByProductType).toHaveBeenCalledWith("chassis");
  });

  it("applies name, manufacturer, length, and form-factor filters", async () => {
    listChassis.mockResolvedValue({
      items: [chassis],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<ChassisListPage />, { route: "/catalog/chassis" });
    await screen.findByRole("link", { name: "Lian Li O11" });
    await user.type(screen.getByLabelText("Name"), "O11");
    await user.selectOptions(screen.getByLabelText("Manufacturer"), "lian-li");
    await user.type(screen.getByLabelText("Length min"), "400");
    await user.type(screen.getByLabelText("Length max"), "500");
    await user.click(screen.getByLabelText("Atx"));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(listChassis).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          name: "O11",
          manufacturerId: "lian-li",
          lengthMm: { min: 400, max: 500 },
          maxSupportedMbFormFactor: "Atx",
        }),
      }),
    );
  });

  it("shows empty, loading, and error states", async () => {
    listChassis.mockResolvedValue({
      items: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<ChassisListPage />, { route: "/catalog/chassis" });
    expect(
      await screen.findByText("No chassis in the catalog yet."),
    ).toBeInTheDocument();

    listChassis.mockResolvedValue({
      items: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<ChassisListPage />, {
      route: "/catalog/chassis?name=nope",
    });
    expect(
      await screen.findByText("No chassis match these filters."),
    ).toBeInTheDocument();

    listChassis.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<ChassisListPage />, { route: "/catalog/chassis" });
    expect(await screen.findByText("Loading chassis…")).toBeInTheDocument();

    listChassis.mockRejectedValue(new Error("fail"));
    renderWithQuery(<ChassisListPage />, { route: "/catalog/chassis" });
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("paginates and clears filters", async () => {
    listChassis.mockResolvedValue({
      items: [chassis],
      totalCount: 21,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<ChassisListPage />, {
      route: "/catalog/chassis?name=O11",
    });
    await screen.findByRole("link", { name: "Lian Li O11" });
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(listChassis).toHaveBeenCalledWith(
      expect.objectContaining({ pageIndex: 1 }),
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(listChassis).toHaveBeenCalledWith(
      expect.objectContaining({ pageIndex: 0 }),
    );
  });
});
