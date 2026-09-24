import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CpuListItem } from "@/api/catalog/cpus.ts";

const listCpus = vi.fn();
const deleteCpus = vi.fn();
const importCpus = vi.fn();
const listManufacturersByProductType = vi.fn();
const listSockets = vi.fn();
const listCpuSeries = vi.fn();

vi.mock("@/api/catalog/cpus", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/catalog/cpus")>(
      "@/api/catalog/cpus",
    );
  return { ...actual, listCpus: (...args: unknown[]) => listCpus(...args) };
});

vi.mock("@/api/catalog/bulk-delete", () => ({
  deleteCpus: (...args: unknown[]) => deleteCpus(...args),
}));

vi.mock("@/api/catalog/import-excel", () => ({
  importCpus: (...args: unknown[]) => importCpus(...args),
}));

vi.mock("@/api/master-data.ts", async () => {
  const actual = await vi.importActual<typeof import("@/api/master-data.ts")>(
    "@/api/master-data.ts",
  );
  return {
    ...actual,
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    listSockets: () => listSockets(),
    listCpuSeries: () => listCpuSeries(),
  };
});

import { CpuListPage } from "@/pages/catalog/cpus/CpuListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const cpu: CpuListItem = {
  id: "cpu-1",
  name: "Ryzen 7 7800X3D",
  manufacturerId: "amd",
  manufacturerName: "AMD",
  seriesId: "r7",
  seriesName: "Ryzen 7",
  socketId: "am5",
  socketName: "AM5",
  maxMemoryGb: 128,
  integratedGraphics: false,
  includedStockCooler: false,
  thermalDesignPower: 120,
  powerConsumptionWatts: 120,
};

describe("CpuListPage", () => {
  beforeEach(() => {
    listCpus.mockReset();
    deleteCpus.mockReset().mockResolvedValue(undefined);
    importCpus.mockReset().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    listManufacturersByProductType
      .mockReset()
      .mockResolvedValue([{ id: "amd", name: "AMD" }]);
    listSockets.mockReset().mockResolvedValue([
      {
        id: "am5",
        name: "AM5",
        manufacturerId: "amd",
        manufacturerName: "AMD",
      },
    ]);
    listCpuSeries.mockReset().mockResolvedValue([
      {
        id: "r7",
        name: "Ryzen 7",
        manufacturerId: "amd",
        manufacturerName: "AMD",
        socketId: "am5",
        socketName: "AM5",
      },
    ]);
  });

  it("loads the unfiltered catalog", async () => {
    listCpus.mockResolvedValue({
      items: [cpu],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus" });
    expect(
      await screen.findByRole("link", { name: "Ryzen 7 7800X3D" }),
    ).toHaveAttribute("href", "/catalog/cpus/cpu-1");
    expect(listManufacturersByProductType).toHaveBeenCalledWith("cpu");
    expect(listCpus).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ name: "" }),
      }),
    );
    expect(screen.queryByLabelText("DDR")).not.toBeInTheDocument();
  });

  it("applies a name filter", async () => {
    listCpus.mockResolvedValue({
      items: [cpu],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus" });
    await screen.findByRole("link", { name: "Ryzen 7 7800X3D" });
    await user.type(screen.getByLabelText("Name"), "7800");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(
      await screen.findByRole("link", { name: "Ryzen 7 7800X3D" }),
    ).toBeInTheDocument();
    expect(listCpus).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ name: "7800" }),
      }),
    );
  });

  it("shows an empty filtered state", async () => {
    listCpus.mockResolvedValue({
      items: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus?name=nope" });
    expect(
      await screen.findByText("No CPUs match these filters."),
    ).toBeInTheDocument();
  });

  it("shows an empty catalog state", async () => {
    listCpus.mockResolvedValue({
      items: [],
      totalCount: 0,
      pageIndex: 0,
      pageSize: 10,
    });
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus" });
    expect(
      await screen.findByText("No CPUs in the catalog yet."),
    ).toBeInTheDocument();
  });

  it("shows a loading state", async () => {
    listCpus.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus" });
    expect(await screen.findByText("Loading CPUs…")).toBeInTheDocument();
  });

  it("shows an API error", async () => {
    listCpus.mockRejectedValue(new Error("fail"));
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus" });
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("filters by manufacturer, socket, series, and ranges", async () => {
    listCpus.mockResolvedValue({
      items: [{ ...cpu, integratedGraphics: true }],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus" });
    await screen.findByRole("link", { name: "Ryzen 7 7800X3D" });
    expect(screen.getByText("Yes")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Manufacturer"), "amd");
    await user.selectOptions(screen.getByLabelText("Socket"), "am5");
    await user.selectOptions(screen.getByLabelText("Series"), "r7");
    await user.type(screen.getByLabelText("TDP (W)"), "65");
    await user.type(screen.getByLabelText("TDP max"), "170");
    await user.type(screen.getByLabelText("Power (W)"), "80");
    await user.type(screen.getByLabelText("Power max"), "150");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(listCpus).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 0,
        filter: expect.objectContaining({
          manufacturerId: "amd",
          socketId: "am5",
          seriesId: "r7",
          thermalDesignPower: { min: 65, max: 170 },
          powerConsumptionWatts: { min: 80, max: 150 },
        }),
      }),
    );
  });

  it("clears filters and paginates", async () => {
    listCpus.mockResolvedValue({
      items: [cpu],
      totalCount: 21,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus?name=7800" });
    await screen.findByRole("link", { name: "Ryzen 7 7800X3D" });
    expect(screen.getByText("Page 1 of 3 (21 CPUs)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(listCpus).toHaveBeenCalledWith(
      expect.objectContaining({ pageIndex: 1 }),
    );
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(listCpus).toHaveBeenCalledWith(
      expect.objectContaining({ pageIndex: 0 }),
    );

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(listCpus).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 0,
        filter: expect.objectContaining({ name: "" }),
      }),
    );
  });

  it("filters CPUs by the motherboard in the current build", async () => {
    listCpus.mockResolvedValue({
      items: [cpu],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<CpuListPage />, {
      route: "/catalog/cpus",
      initialBuild: { motherboardId: "mb-1" },
    });
    await screen.findByRole("link", { name: "Ryzen 7 7800X3D" });
    const checkbox = screen.getByLabelText("Show only compatible");
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(listCpus).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ motherboardId: "mb-1" }),
      }),
    );
  });

  it("keeps the compatibility checkbox checked without a motherboard in the build", async () => {
    listCpus.mockResolvedValue({
      items: [cpu],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus" });
    await screen.findByRole("link", { name: "Ryzen 7 7800X3D" });
    const checkbox = screen.getByLabelText("Show only compatible");
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(listCpus).not.toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ motherboardId: expect.anything() }),
      }),
    );
  });

  it("deletes the selected CPU", async () => {
    listCpus.mockResolvedValue({
      items: [cpu],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus", isAdmin: true });

    const row = await screen.findByRole("row", { name: /Ryzen 7 7800X3D/ });
    await user.click(within(row).getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Delete Selected" }));

    await waitFor(() => {
      expect(deleteCpus).toHaveBeenCalledWith(["cpu-1"]);
    });
    expect(window.confirm).toHaveBeenCalledWith("Delete 1 CPU?");
  });

  it("imports an Excel workbook", async () => {
    listCpus.mockResolvedValue({
      items: [cpu],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus", isAdmin: true });

    await user.click(await screen.findByRole("button", { name: "Import" }));
    const dialog = await screen.findByRole("dialog", { name: "Import from Excel" });
    const file = new File(["sheet"], "cpus.xlsx");
    await user.upload(within(dialog).getByLabelText("Excel file"), file);
    await user.click(within(dialog).getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(importCpus).toHaveBeenCalledWith(file);
    });
  });

  it("rejects a file that is not an Excel workbook", async () => {
    listCpus.mockResolvedValue({
      items: [cpu],
      totalCount: 1,
      pageIndex: 0,
      pageSize: 10,
    });
    const user = userEvent.setup();
    renderWithQuery(<CpuListPage />, { route: "/catalog/cpus", isAdmin: true });

    await user.click(await screen.findByRole("button", { name: "Import" }));
    const dialog = await screen.findByRole("dialog", { name: "Import from Excel" });
    fireEvent.change(within(dialog).getByLabelText("Excel file"), {
      target: { files: [new File(["notes"], "cpus.csv", { type: "text/csv" })] },
    });

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Choose an .xls or .xlsx file.",
    );
    expect(importCpus).not.toHaveBeenCalled();
  });
});
