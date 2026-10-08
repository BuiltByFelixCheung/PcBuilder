import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CpuSeriesOption, SocketOption } from "@/api/master-data";
import { chooseOption } from "../helpers/choose-option.ts";

const listCpuSeries = vi.fn();
const listSockets = vi.fn();
const listManufacturersByProductType = vi.fn();
const createCpuSeries = vi.fn();
const updateCpuSeries = vi.fn();
const deleteCpuSeries = vi.fn();
const deleteMultipleCpuSeries = vi.fn();
const updateMultipleCpuSeries = vi.fn();
const importCpuSeries = vi.fn();

vi.mock("@/api/master-data", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/master-data")>(
      "@/api/master-data",
    );
  return {
    ...actual,
    listCpuSeries: () => listCpuSeries(),
    listSockets: () => listSockets(),
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    createCpuSeries: (...args: unknown[]) => createCpuSeries(...args),
    updateCpuSeries: (...args: unknown[]) => updateCpuSeries(...args),
    deleteCpuSeries: (...args: unknown[]) => deleteCpuSeries(...args),
    deleteMultipleCpuSeries: (...args: unknown[]) =>
      deleteMultipleCpuSeries(...args),
    updateMultipleCpuSeries: (...args: unknown[]) =>
      updateMultipleCpuSeries(...args),
    importCpuSeries: (...args: unknown[]) => importCpuSeries(...args),
  };
});

import { CpuSeriesListPage } from "@/pages/master-data/cpu-series/CpuSeriesListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const ryzen: CpuSeriesOption = {
  id: "ryzen7000",
  name: "Ryzen 7000",
  manufacturerId: "amd",
  manufacturerName: "AMD",
  socketId: "am5",
  socketName: "AM5",
};
const core: CpuSeriesOption = {
  id: "core-ultra",
  name: "Core Ultra",
  manufacturerId: "intel",
  manufacturerName: "Intel",
  socketId: "lga1851",
  socketName: "LGA1851",
};
const sockets: SocketOption[] = [
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
];
const manufacturers = [
  { id: "amd", name: "AMD" },
  { id: "intel", name: "Intel" },
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

describe("CpuSeriesListPage", () => {
  beforeEach(() => {
    listCpuSeries.mockReset().mockResolvedValue([ryzen, core]);
    listSockets.mockReset().mockResolvedValue(sockets);
    listManufacturersByProductType.mockReset().mockResolvedValue(manufacturers);
    createCpuSeries.mockReset().mockResolvedValue(ryzen);
    updateCpuSeries.mockReset().mockResolvedValue(ryzen);
    deleteCpuSeries.mockReset().mockResolvedValue(undefined);
    deleteMultipleCpuSeries.mockReset().mockResolvedValue(undefined);
    updateMultipleCpuSeries.mockReset().mockResolvedValue([ryzen]);
    importCpuSeries.mockReset().mockResolvedValue([]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("filters by name, manufacturer, and socket", async () => {
    const user = userEvent.setup();
    renderWithQuery(<CpuSeriesListPage />, { route: "/master-data/cpu-series" });
    expect(await screen.findByRole("link", { name: "Ryzen 7000" })).toHaveAttribute(
      "href",
      "/master-data/cpu-series?edit=ryzen7000",
    );

    await chooseOption(user, "Manufacturer", "Intel");
    await user.click(screen.getByLabelText("Socket"));
    expect(screen.queryByRole("option", { name: "AM5" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("option", { name: "LGA1851" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.queryByRole("link", { name: "Ryzen 7000" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Core Ultra" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.type(document.getElementById("cpu-series-name") as HTMLInputElement, "Ryzen");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByRole("link", { name: "Ryzen 7000" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Core Ultra" })).not.toBeInTheDocument();
  });

  it("shows empty and error states", async () => {
    listCpuSeries.mockResolvedValueOnce([]);
    const { unmount } = renderWithQuery(<CpuSeriesListPage />, {
      route: "/master-data/cpu-series",
    });
    expect(await screen.findByText("No CPU Series yet.")).toBeInTheDocument();
    unmount();

    listCpuSeries.mockRejectedValue(new Error("down"));
    renderWithQuery(<CpuSeriesListPage />, { route: "/master-data/cpu-series" });
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("creates a series and clears a socket from another manufacturer", async () => {
    const user = userEvent.setup();
    renderWithQuery(<CpuSeriesListPage />, { route: "/master-data/cpu-series" });
    await user.click(await screen.findByRole("link", { name: "New CPU Series" }));
    const dialog = await screen.findByRole("dialog", { name: "New CPU Series" });
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByText("Name is required.")).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Name"), "Ryzen 9000");
    await user.selectOptions(
      selectById(dialog, "cpu-series-edit-manufacturer"),
      "amd",
    );
    await user.selectOptions(selectById(dialog, "cpu-series-edit-socket"), "am5");
    await user.selectOptions(
      selectById(dialog, "cpu-series-edit-manufacturer"),
      "intel",
    );
    expect(selectById(dialog, "cpu-series-edit-socket")).toHaveValue("");
    await user.selectOptions(selectById(dialog, "cpu-series-edit-socket"), "lga1851");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createCpuSeries).toHaveBeenCalledWith({
        name: "Ryzen 9000",
        manufacturerId: "intel",
        socketId: "lga1851",
      });
    });
  });

  it("updates, reports a form error, and deletes", async () => {
    updateCpuSeries.mockRejectedValueOnce(
      apiError(409, { detail: "Series already exists." }),
    );
    const user = userEvent.setup();
    renderWithQuery(<CpuSeriesListPage />, {
      route: "/master-data/cpu-series?edit=ryzen7000",
    });
    const dialog = await screen.findByRole("dialog", { name: "Edit CPU Series" });
    await within(dialog).findByLabelText("Name");
    await user.click(within(dialog).getByRole("button", { name: "Update" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Series already exists.",
    );

    updateCpuSeries.mockResolvedValue(ryzen);
    await user.click(within(dialog).getByRole("button", { name: "Update" }));
    await waitFor(() => {
      expect(updateCpuSeries).toHaveBeenCalledWith("ryzen7000", {
        name: "Ryzen 7000",
        manufacturerId: "amd",
        socketId: "am5",
      });
    });

    deleteCpuSeries.mockRejectedValueOnce(
      apiError(404, { detail: "CPU series was not found." }),
    );
    renderWithQuery(<CpuSeriesListPage />, {
      route: "/master-data/cpu-series?edit=ryzen7000",
    });
    const again = await screen.findByRole("dialog", { name: "Edit CPU Series" });
    await within(again).findByLabelText("Name");
    await user.click(within(again).getByRole("button", { name: "Delete" }));
    expect(await within(again).findByRole("alert")).toHaveTextContent(
      "CPU series was not found.",
    );
    expect(within(again).getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("closes when the series is missing or options fail to load", async () => {
    const user = userEvent.setup();
    renderWithQuery(<CpuSeriesListPage />, {
      route: "/master-data/cpu-series?edit=missing",
    });
    const missing = await screen.findByRole("dialog", { name: "CPU Series not found" });
    expect(
      within(missing).getByText("This CPU series is not in the current list."),
    ).toBeInTheDocument();
    await user.click(within(missing).getAllByRole("button", { name: "Close" })[0]);
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "CPU Series not found" }),
      ).not.toBeInTheDocument();
    });

    listSockets.mockRejectedValue(new Error("no sockets"));
    renderWithQuery(<CpuSeriesListPage />, {
      route: "/master-data/cpu-series?edit=ryzen7000",
    });
    const failed = await screen.findByRole("dialog", { name: "Edit CPU Series" });
    expect(
      await within(failed).findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("bulk-edits selected series and imports a workbook", async () => {
    const user = userEvent.setup();
    renderWithQuery(<CpuSeriesListPage />, { route: "/master-data/cpu-series" });
    const checkboxes = await screen.findAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Edit Selected" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit CPU Series" });
    const name = within(dialog).getByRole("textbox");
    const [manufacturer, socket] = within(dialog).getAllByRole("combobox");
    await user.clear(name);
    await user.type(name, "Ryzen 7000X");
    await user.selectOptions(manufacturer, "intel");
    await user.selectOptions(socket, "lga1851");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateMultipleCpuSeries).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "ryzen7000",
          name: "Ryzen 7000X",
          socketId: "lga1851",
        }),
      ]);
    });

    await user.click(screen.getByRole("button", { name: "Import" }));
    const importer = await screen.findByRole("dialog", { name: "Import from Excel" });
    fireEvent.change(within(importer).getByLabelText("Excel file"), {
      target: { files: [new File(["sheet"], "series.xlsx")] },
    });
    await user.click(within(importer).getByRole("button", { name: "Import" }));
    await waitFor(() => {
      expect(importCpuSeries).toHaveBeenCalled();
    });
  });

  it("cancels bulk delete", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const user = userEvent.setup();
    renderWithQuery(<CpuSeriesListPage />, { route: "/master-data/cpu-series" });
    const checkboxes = await screen.findAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Delete Selected" }));
    expect(deleteMultipleCpuSeries).not.toHaveBeenCalled();
    expect(checkboxes[1]).toBeChecked();
  });
});
