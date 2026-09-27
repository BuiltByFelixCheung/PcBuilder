import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GpuOption, GpuSeriesOption } from "@/api/master-data";

const listGpus = vi.fn();
const listGpuSeries = vi.fn();
const listManufacturersByProductType = vi.fn();
const createGpu = vi.fn();
const updateGpu = vi.fn();
const deleteGpu = vi.fn();
const deleteGpus = vi.fn();
const updateGpus = vi.fn();
const importGpus = vi.fn();

vi.mock("@/api/master-data", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/master-data")>(
      "@/api/master-data",
    );
  return {
    ...actual,
    listGpus: () => listGpus(),
    listGpuSeries: () => listGpuSeries(),
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    createGpu: (...args: unknown[]) => createGpu(...args),
    updateGpu: (...args: unknown[]) => updateGpu(...args),
    deleteGpu: (...args: unknown[]) => deleteGpu(...args),
    deleteGpus: (...args: unknown[]) => deleteGpus(...args),
    updateGpus: (...args: unknown[]) => updateGpus(...args),
    importGpus: (...args: unknown[]) => importGpus(...args),
  };
});

import { GpuListPage } from "@/pages/master-data/gpus/GpuListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const rtx: GpuOption = {
  id: "rtx",
  name: "GeForce RTX 4070",
  manufacturerId: "nvidia",
  manufacturerName: "NVIDIA",
  gpuSeriesId: "rtx40",
  gpuSeriesName: "RTX 40",
};
const rx: GpuOption = {
  id: "rx",
  name: "Radeon RX 7800 XT",
  manufacturerId: "amd",
  manufacturerName: "AMD",
  gpuSeriesId: "rx7000",
  gpuSeriesName: "RX 7000",
};
const series: GpuSeriesOption[] = [
  {
    id: "rtx40",
    name: "RTX 40",
    manufacturerId: "nvidia",
    manufacturerName: "NVIDIA",
  },
  {
    id: "rx7000",
    name: "RX 7000",
    manufacturerId: "amd",
    manufacturerName: "AMD",
  },
];
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

describe("GpuListPage", () => {
  beforeEach(() => {
    listGpus.mockReset().mockResolvedValue([rtx, rx]);
    listGpuSeries.mockReset().mockResolvedValue(series);
    listManufacturersByProductType.mockReset().mockResolvedValue(manufacturers);
    createGpu.mockReset().mockResolvedValue(rtx);
    updateGpu.mockReset().mockResolvedValue(rtx);
    deleteGpu.mockReset().mockResolvedValue(undefined);
    deleteGpus.mockReset().mockResolvedValue(undefined);
    updateGpus.mockReset().mockResolvedValue([rtx]);
    importGpus.mockReset().mockResolvedValue([]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("filters by name, manufacturer, and series, then clears", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus" });

    expect(await screen.findByRole("link", { name: "GeForce RTX 4070" })).toHaveAttribute(
      "href",
      "/master-data/gpus?edit=rtx",
    );
    await user.type(document.getElementById("gpu-name") as HTMLInputElement, "7800");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.queryByRole("link", { name: "GeForce RTX 4070" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Radeon RX 7800 XT" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.selectOptions(selectById(document, "gpu-manufacturer"), "nvidia");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByRole("link", { name: "GeForce RTX 4070" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Radeon RX 7800 XT" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.selectOptions(selectById(document, "gpu-series"), "rx7000");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.queryByRole("link", { name: "GeForce RTX 4070" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Radeon RX 7800 XT" })).toBeInTheDocument();
  });

  it("shows the empty filter message when nothing matches", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus" });
    await screen.findByRole("link", { name: "GeForce RTX 4070" });
    await user.type(document.getElementById("gpu-name") as HTMLInputElement, "nope");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByText("No GPUs match these filters.")).toBeInTheDocument();
  });

  it("shows an empty list and a load error", async () => {
    listGpus.mockResolvedValue([]);
    const { unmount } = renderWithQuery(<GpuListPage />, {
      route: "/master-data/gpus",
    });
    expect(await screen.findByText("No GPUs found.")).toBeInTheDocument();
    unmount();

    listGpus.mockRejectedValue(new Error("down"));
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus" });
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("creates a GPU after validation and limits series to the manufacturer", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus" });
    await user.click(await screen.findByRole("link", { name: "New GPU" }));

    const dialog = await screen.findByRole("dialog", { name: "New GPU" });
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Name is required.")).toBeInTheDocument();
    expect(within(dialog).getByText("Series is required.")).toBeInTheDocument();
    expect(selectById(dialog, "gpu-edit-manufacturer")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await user.type(within(dialog).getByLabelText("Name"), "Arc B580");
    await user.selectOptions(selectById(dialog, "gpu-edit-manufacturer"), "nvidia");
    expect(within(dialog).queryByRole("option", { name: "RX 7000" })).not.toBeInTheDocument();
    await user.selectOptions(selectById(dialog, "gpu-edit-series"), "rtx40");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(createGpu).toHaveBeenCalledWith({
        name: "Arc B580",
        manufacturerId: "nvidia",
        gpuSeriesId: "rtx40",
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("updates the open GPU and shows a field error", async () => {
    updateGpu.mockRejectedValueOnce(
      apiError(400, { errors: { name: ["Name is taken."] } }),
    );
    const user = userEvent.setup();
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus?edit=rtx" });

    const dialog = await screen.findByRole("dialog", { name: "Edit GPU" });
    const name = await within(dialog).findByLabelText("Name");
    expect(name).toHaveValue("GeForce RTX 4070");
    expect(selectById(dialog, "gpu-edit-series")).toHaveValue("rtx40");
    await user.clear(name);
    await user.type(name, "RTX 4070 Super");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Name is taken.")).toBeInTheDocument();

    updateGpu.mockResolvedValue(rtx);
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateGpu).toHaveBeenCalledWith("rtx", {
        name: "RTX 4070 Super",
        manufacturerId: "nvidia",
        gpuSeriesId: "rtx40",
      });
    });
  });

  it("deletes the open GPU, and keeps it when delete fails or is cancelled", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus?edit=rtx" });
    const dialog = await screen.findByRole("dialog", { name: "Edit GPU" });
    await within(dialog).findByLabelText("Name");

    vi.mocked(window.confirm).mockReturnValueOnce(false);
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(deleteGpu).not.toHaveBeenCalled();

    let finishDelete: (value: void) => void = () => {};
    deleteGpu.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishDelete = resolve;
        }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(window.confirm).toHaveBeenCalledWith("Delete GeForce RTX 4070?");
    expect(within(dialog).getByRole("button", { name: "Deleting…" })).toBeDisabled();
    finishDelete();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    deleteGpu.mockRejectedValueOnce(
      apiError(404, { detail: "GPU was not found." }),
    );
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus?edit=rtx" });
    const again = await screen.findByRole("dialog", { name: "Edit GPU" });
    await within(again).findByLabelText("Name");
    await user.click(within(again).getByRole("button", { name: "Delete" }));
    expect(await within(again).findByRole("alert")).toHaveTextContent(
      "GPU was not found.",
    );
  });

  it("closes a missing GPU and an options error", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus?edit=missing" });
    const missing = await screen.findByRole("dialog", { name: "GPU not found" });
    await user.click(within(missing).getAllByRole("button", { name: "Close" })[0]);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    listManufacturersByProductType.mockRejectedValue(new Error("no options"));
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus?edit=rtx" });
    const failed = await screen.findByRole("dialog", { name: "Edit GPU" });
    expect(
      await within(failed).findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
    await user.click(within(failed).getAllByRole("button", { name: "Close" })[0]);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Edit GPU" })).not.toBeInTheDocument();
    });
  });

  it("shows the dialog loading state until the GPU list settles", async () => {
    let finish: (gpus: GpuOption[]) => void = () => {};
    listGpus.mockImplementation(
      () =>
        new Promise<GpuOption[]>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus?edit=rtx" });
    expect(await screen.findByText("Loading GPU…")).toBeInTheDocument();
    finish([rtx]);
    const dialog = await screen.findByRole("dialog", { name: "Edit GPU" });
    expect(await within(dialog).findByLabelText("Name")).toHaveValue(
      "GeForce RTX 4070",
    );
  });

  it("bulk-deletes and bulk-edits the selected GPUs", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus" });
    const checkboxes = await screen.findAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Delete Selected" }));
    await waitFor(() => {
      expect(deleteGpus).toHaveBeenCalledWith({ ids: ["rtx"] });
    });
    expect(window.confirm).toHaveBeenCalledWith("Delete 1 GPU?");

    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Edit Selected" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit GPUs" });
    const name = within(dialog).getByRole("textbox");
    const [manufacturer, seriesSelect] = within(dialog).getAllByRole("combobox");
    await user.selectOptions(manufacturer, "amd");
    await user.selectOptions(seriesSelect, "rx7000");
    await user.clear(name);
    await user.type(name, "RTX 4070 Ti");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateGpus).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "rtx",
          name: "RTX 4070 Ti",
          manufacturerId: "amd",
          gpuSeriesId: "rx7000",
        }),
      ]);
    });
  });

  it("imports a workbook and rejects a file that is not Excel", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GpuListPage />, { route: "/master-data/gpus" });
    await user.click(await screen.findByRole("button", { name: "Import" }));
    const dialog = await screen.findByRole("dialog", { name: "Import from Excel" });
    const input = within(dialog).getByLabelText("Excel file");
    fireEvent.change(input, {
      target: { files: [new File(["nope"], "notes.txt", { type: "text/plain" })] },
    });
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Choose an .xls or .xlsx file.",
    );

    fireEvent.change(within(dialog).getByLabelText("Excel file"), {
      target: {
        files: [
          new File(["sheet"], "gpus.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
        ],
      },
    });
    await user.click(within(dialog).getByRole("button", { name: "Import" }));
    await waitFor(() => {
      expect(importGpus).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
