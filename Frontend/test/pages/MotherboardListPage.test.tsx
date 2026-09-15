import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MotherboardListItem } from "@/api/catalog/motherboards";

const listMotherboards = vi.fn();
const listManufacturersByProductType = vi.fn();
const listSockets = vi.fn();
const listChipsets = vi.fn();

vi.mock("@/api/catalog/motherboards", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/motherboards")>(
    "@/api/catalog/motherboards",
  );
  return {
    ...actual,
    listMotherboards: (...args: unknown[]) => listMotherboards(...args),
  };
});

vi.mock("@/api/master-data.ts", async () => {
  const actual = await vi.importActual<typeof import("@/api/master-data.ts")>(
    "@/api/master-data.ts",
  );
  return {
    ...actual,
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    listSockets: () => listSockets(),
    listChipsets: () => listChipsets(),
  };
});

import { MotherboardListPage } from "@/pages/catalog/MotherboardListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const motherboard: MotherboardListItem = {
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
  bluetoothEnabled: true,
};

describe("MotherboardListPage", () => {
  beforeEach(() => {
    listMotherboards.mockReset();
    listManufacturersByProductType
      .mockReset()
      .mockResolvedValue([{ id: "asus", name: "ASUS" }]);
    listSockets.mockReset().mockResolvedValue([
      {
        id: "am5",
        name: "AM5",
        manufacturerId: "amd",
        manufacturerName: "AMD",
      },
      {
        id: "lga1851",
        name: "LGA1851",
        manufacturerId: "intel",
        manufacturerName: "Intel",
      },
    ]);
    listChipsets.mockReset().mockResolvedValue([
      {
        id: "x870",
        name: "X870",
        manufacturerId: "amd",
        manufacturerName: "AMD",
        socketId: "am5",
        socketName: "AM5",
      },
      {
        id: "z890",
        name: "Z890",
        manufacturerId: "intel",
        manufacturerName: "Intel",
        socketId: "lga1851",
        socketName: "LGA1851",
      },
    ]);
  });

  it("loads the unfiltered catalog", async () => {
    listMotherboards.mockResolvedValue({
      items: [motherboard],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<MotherboardListPage />, {
      route: "/catalog/motherboards",
    });
    expect(
      await screen.findByRole("link", { name: "ROG Strix X870-F" }),
    ).toHaveAttribute("href", "/catalog/motherboards/mb-1");
    expect(listManufacturersByProductType).toHaveBeenCalledWith("motherboard");
    expect(listMotherboards).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ name: "" }),
      }),
    );
  });

  it("applies a name filter", async () => {
    listMotherboards.mockResolvedValue({
      items: [motherboard],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<MotherboardListPage />, {
      route: "/catalog/motherboards",
    });
    await screen.findByRole("link", { name: "ROG Strix X870-F" });
    await user.type(screen.getByLabelText("Name"), "X870");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(listMotherboards).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ name: "X870" }),
      }),
    );
  });

  it("shows an empty filtered state", async () => {
    listMotherboards.mockResolvedValue({
      items: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<MotherboardListPage />, {
      route: "/catalog/motherboards?name=nope",
    });
    expect(
      await screen.findByText("No motherboards match these filters."),
    ).toBeInTheDocument();
  });

  it("shows an empty catalog state", async () => {
    listMotherboards.mockResolvedValue({
      items: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<MotherboardListPage />, {
      route: "/catalog/motherboards",
    });
    expect(
      await screen.findByText("No motherboards in the catalog yet."),
    ).toBeInTheDocument();
  });

  it("shows a loading state", async () => {
    listMotherboards.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<MotherboardListPage />, {
      route: "/catalog/motherboards",
    });
    expect(
      await screen.findByText("Loading motherboards…"),
    ).toBeInTheDocument();
  });

  it("shows an API error", async () => {
    listMotherboards.mockRejectedValue(new Error("fail"));
    renderWithQuery(<MotherboardListPage />, {
      route: "/catalog/motherboards",
    });
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("filters by manufacturer, socket, chipset, and wifi", async () => {
    listMotherboards.mockResolvedValue({
      items: [motherboard],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<MotherboardListPage />, {
      route: "/catalog/motherboards",
    });
    await screen.findByRole("link", { name: "ROG Strix X870-F" });

    await user.selectOptions(screen.getByLabelText("Manufacturer"), "asus");
    await user.selectOptions(screen.getByLabelText("Socket"), "am5");
    await user.selectOptions(screen.getByLabelText("Chipset"), "x870");
    await user.selectOptions(screen.getByLabelText("Wi-Fi"), "true");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(listMotherboards).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 0,
        filter: expect.objectContaining({
          manufacturerId: "asus",
          socketId: "am5",
          chipsetId: "x870",
          wifiEnabled: true,
        }),
      }),
    );
  });

  it("clears filters and paginates", async () => {
    listMotherboards.mockResolvedValue({
      items: [motherboard],
      totalCount: 21,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<MotherboardListPage />, {
      route: "/catalog/motherboards?name=X870",
    });
    await screen.findByRole("link", { name: "ROG Strix X870-F" });
    expect(
      screen.getByText("Page 1 of 3 (21 motherboards)"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(listMotherboards).toHaveBeenCalledWith(
      expect.objectContaining({ pageIndex: 1 }),
    );
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(listMotherboards).toHaveBeenCalledWith(
      expect.objectContaining({ pageIndex: 0 }),
    );

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(listMotherboards).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 0,
        filter: expect.objectContaining({ name: "" }),
      }),
    );
  });

  it("narrows chipsets by socket and applies DDR and size filters", async () => {
    listMotherboards.mockResolvedValue({
      items: [motherboard],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<MotherboardListPage />, {
      route: "/catalog/motherboards",
    });
    await screen.findByRole("link", { name: "ROG Strix X870-F" });

    const chipset = screen.getByLabelText("Chipset");
    expect(chipset).toHaveTextContent("Z890");
    await user.selectOptions(screen.getByLabelText("Socket"), "am5");
    expect(chipset).not.toHaveTextContent("Z890");
    expect(chipset).toHaveTextContent("X870");

    await user.selectOptions(screen.getByLabelText("DDR"), "Ddr5");
    await user.type(screen.getByLabelText("Width (mm)"), "200");
    await user.type(screen.getByLabelText("Width max"), "330");
    await user.selectOptions(screen.getByLabelText("Bluetooth"), "false");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(listMotherboards).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          socketId: "am5",
          ddrGeneration: "Ddr5",
          bluetoothEnabled: false,
          widthMm: { min: 200, max: 330 },
        }),
      }),
    );
  });
});
