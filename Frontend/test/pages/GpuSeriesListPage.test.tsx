import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GpuSeriesOption } from "@/api/master-data";

const listGpuSeries = vi.fn();
const listManufacturersByProductType = vi.fn();
const createGpuSeries = vi.fn();
const updateGpuSeries = vi.fn();
const deleteGpuSeries = vi.fn();
const deleteMultipleGpuSeries = vi.fn();
const updateMultipleGpuSeries = vi.fn();
const importGpuSeries = vi.fn();

vi.mock("@/api/master-data", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/master-data")>(
      "@/api/master-data",
    );
  return {
    ...actual,
    listGpuSeries: () => listGpuSeries(),
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    createGpuSeries: (...args: unknown[]) => createGpuSeries(...args),
    updateGpuSeries: (...args: unknown[]) => updateGpuSeries(...args),
    deleteGpuSeries: (...args: unknown[]) => deleteGpuSeries(...args),
    deleteMultipleGpuSeries: (...args: unknown[]) =>
      deleteMultipleGpuSeries(...args),
    updateMultipleGpuSeries: (...args: unknown[]) =>
      updateMultipleGpuSeries(...args),
    importGpuSeries: (...args: unknown[]) => importGpuSeries(...args),
  };
});

import { GpuSeriesListPage } from "@/pages/master-data/gpu-series/GpuSeriesListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const rtx: GpuSeriesOption = {
  id: "rtx40",
  name: "RTX 40",
  manufacturerId: "nvidia",
  manufacturerName: "NVIDIA",
};
const rx: GpuSeriesOption = {
  id: "rx7000",
  name: "RX 7000",
  manufacturerId: "amd",
  manufacturerName: "AMD",
};
const manufacturers = [
  { id: "nvidia", name: "NVIDIA" },
  { id: "amd", name: "AMD" },
];

function apiError(status: number, data: object) {
  const error = new AxiosError("fail");
  error.response = {
    status,
    data,
    statusText: "Error",
    headers: {},
    config: {} as never,
  };
  return error;
}

function selectById(root: ParentNode, id: string) {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(`Missing select #${id}`);
  }
  return element;
}

describe("GpuSeriesListPage", () => {
  beforeEach(() => {
    listGpuSeries.mockReset().mockResolvedValue([rtx, rx]);
    listManufacturersByProductType.mockReset().mockResolvedValue(manufacturers);
    createGpuSeries.mockReset().mockResolvedValue(rtx);
    updateGpuSeries.mockReset().mockResolvedValue(rtx);
    deleteGpuSeries.mockReset().mockResolvedValue(undefined);
    deleteMultipleGpuSeries.mockReset().mockResolvedValue(undefined);
    updateMultipleGpuSeries.mockReset().mockResolvedValue([rtx]);
    importGpuSeries.mockReset().mockResolvedValue([]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("filters by name and manufacturer", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuSeriesListPage />, { route: "/master-data/gpu-series" });
    expect(await screen.findByRole("link", { name: "RTX 40" })).toHaveAttribute(
      "href",
      "/master-data/gpu-series?edit=rtx40",
    );
    await user.type(document.getElementById("gpu-series-name") as HTMLInputElement, "RX");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.queryByRole("link", { name: "RTX 40" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RX 7000" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.selectOptions(selectById(document, "gpu-series-manufacturer"), "nvidia");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByRole("link", { name: "RTX 40" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "RX 7000" })).not.toBeInTheDocument();
  });

  it("shows the filtered empty message and a load error", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuSeriesListPage />, { route: "/master-data/gpu-series" });
    await screen.findByRole("link", { name: "RTX 40" });
    await user.type(document.getElementById("gpu-series-name") as HTMLInputElement, "nope");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByText("No GPU Series match these filters.")).toBeInTheDocument();

    listGpuSeries.mockRejectedValue(new Error("down"));
    renderWithQuery(<GpuSeriesListPage />, { route: "/master-data/gpu-series" });
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("creates a series after validation", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuSeriesListPage />, { route: "/master-data/gpu-series" });
    await user.click(await screen.findByRole("link", { name: "New GPU Series" }));
    const dialog = await screen.findByRole("dialog", { name: "New GPU series" });
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByText("Name is required.")).toBeInTheDocument();
    expect(selectById(dialog, "gpu-series-edit-manufacturer")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await user.type(within(dialog).getByLabelText("Name"), "Arc");
    await user.selectOptions(
      selectById(dialog, "gpu-series-edit-manufacturer"),
      "nvidia",
    );
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() => {
      expect(createGpuSeries).toHaveBeenCalledWith({
        name: "Arc",
        manufacturerId: "nvidia",
      });
    });
  });

  it("updates a series and surfaces a field error from delete", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuSeriesListPage />, {
      route: "/master-data/gpu-series?edit=rtx40",
    });
    const dialog = await screen.findByRole("dialog", { name: "Edit GPU series" });
    const name = await within(dialog).findByLabelText("Name");
    expect(name).toHaveValue("RTX 40");
    await user.clear(name);
    await user.type(name, "RTX 40 Super");
    await user.click(within(dialog).getByRole("button", { name: "Update" }));
    await waitFor(() => {
      expect(updateGpuSeries).toHaveBeenCalledWith("rtx40", {
        name: "RTX 40 Super",
        manufacturerId: "nvidia",
      });
    });

    updateGpuSeries.mockRejectedValueOnce(
      apiError(400, { errors: { name: ["Name is taken."] } }),
    );
    renderWithQuery(<GpuSeriesListPage />, {
      route: "/master-data/gpu-series?edit=rtx40",
    });
    const again = await screen.findByRole("dialog", { name: "Edit GPU series" });
    await within(again).findByLabelText("Name");
    await user.click(within(again).getByRole("button", { name: "Update" }));
    expect(await within(again).findByText("Name is taken.")).toBeInTheDocument();

    vi.mocked(window.confirm).mockReturnValueOnce(false);
    await user.click(within(again).getByRole("button", { name: "Delete" }));
    expect(deleteGpuSeries).not.toHaveBeenCalled();

    deleteGpuSeries.mockRejectedValueOnce(new Error("nope"));
    await user.click(within(again).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteGpuSeries).toHaveBeenCalledWith("rtx40");
    });
    expect(within(again).getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("shows a missing series and an options error", async () => {
    renderWithQuery(<GpuSeriesListPage />, {
      route: "/master-data/gpu-series?edit=missing",
    });
    expect(
      await screen.findByRole("dialog", { name: "GPU series not found" }),
    ).toBeInTheDocument();

    listManufacturersByProductType.mockRejectedValue(new Error("no options"));
    renderWithQuery(<GpuSeriesListPage />, {
      route: "/master-data/gpu-series?edit=rtx40",
    });
    const failed = await screen.findByRole("dialog", { name: "Edit GPU series" });
    expect(
      await within(failed).findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("bulk-deletes, bulk-edits, and imports", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuSeriesListPage />, { route: "/master-data/gpu-series" });
    const checkboxes = await screen.findAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Delete Selected" }));
    await waitFor(() => {
      expect(deleteMultipleGpuSeries).toHaveBeenCalledWith({ ids: ["rtx40"] });
    });

    await user.click(checkboxes[2]);
    await user.click(screen.getByRole("button", { name: "Edit Selected" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit GPU Series" });
    await user.selectOptions(within(dialog).getAllByRole("combobox")[0], "nvidia");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateMultipleGpuSeries).toHaveBeenCalledWith([
        expect.objectContaining({ id: "rx7000", manufacturerId: "nvidia" }),
      ]);
    });

    await user.click(screen.getByRole("button", { name: "Import" }));
    const importer = await screen.findByRole("dialog", { name: "Import from Excel" });
    fireEvent.change(within(importer).getByLabelText("Excel file"), {
      target: { files: [new File(["sheet"], "series.xls")] },
    });
    await user.click(within(importer).getByRole("button", { name: "Import" }));
    await waitFor(() => {
      expect(importGpuSeries).toHaveBeenCalled();
    });
  });
});
