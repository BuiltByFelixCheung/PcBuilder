import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NamedMasterData } from "@/api/master-data";

const listManufacturers = vi.fn();
const createManufacturer = vi.fn();
const updateManufacturer = vi.fn();
const deleteManufacturer = vi.fn();
const deleteManufacturers = vi.fn();
const updateManufacturers = vi.fn();
const importManufacturers = vi.fn();

vi.mock("@/api/master-data", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/master-data")>(
      "@/api/master-data",
    );
  return {
    ...actual,
    listManufacturers: () => listManufacturers(),
    createManufacturer: (...args: unknown[]) => createManufacturer(...args),
    updateManufacturer: (...args: unknown[]) => updateManufacturer(...args),
    deleteManufacturer: (...args: unknown[]) => deleteManufacturer(...args),
    deleteManufacturers: (...args: unknown[]) => deleteManufacturers(...args),
    updateManufacturers: (...args: unknown[]) => updateManufacturers(...args),
    importManufacturers: (...args: unknown[]) => importManufacturers(...args),
  };
});

import { ManufacturerListPage } from "@/pages/master-data/manufacturers/ManufacturerListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const amd: NamedMasterData = { id: "amd", name: "AMD" };
const intel: NamedMasterData = { id: "intel", name: "Intel" };

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

describe("ManufacturerListPage", () => {
  beforeEach(() => {
    listManufacturers.mockReset().mockResolvedValue([amd, intel]);
    createManufacturer.mockReset().mockResolvedValue(amd);
    updateManufacturer.mockReset().mockResolvedValue(amd);
    deleteManufacturer.mockReset().mockResolvedValue(undefined);
    deleteManufacturers.mockReset().mockResolvedValue(undefined);
    updateManufacturers.mockReset().mockResolvedValue([amd]);
    importManufacturers.mockReset().mockResolvedValue([]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("filters by name and shows an empty match", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ManufacturerListPage />, {
      route: "/master-data/manufacturers",
    });
    expect(await screen.findByRole("link", { name: "AMD" })).toHaveAttribute(
      "href",
      "/master-data/manufacturers?edit=amd",
    );
    const name = document.getElementById("manufacturer-name") as HTMLInputElement;
    await user.type(name, "int");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.queryByRole("link", { name: "AMD" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Intel" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.type(name, "zzz");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByText("No Manufacturers match these filters.")).toBeInTheDocument();
  });

  it("shows an empty list and a load error", async () => {
    listManufacturers.mockResolvedValueOnce([]);
    const { unmount } = renderWithQuery(<ManufacturerListPage />, {
      route: "/master-data/manufacturers",
    });
    expect(await screen.findByText("No Manufacturers found.")).toBeInTheDocument();
    unmount();

    listManufacturers.mockRejectedValue(new Error("down"));
    renderWithQuery(<ManufacturerListPage />, {
      route: "/master-data/manufacturers",
    });
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("creates a manufacturer after validation", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ManufacturerListPage />, {
      route: "/master-data/manufacturers",
    });
    await user.click(await screen.findByRole("link", { name: "New Manufacturer" }));
    const dialog = await screen.findByRole("dialog", { name: "New Manufacturer" });
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Name is required.")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Name"), "ASUS");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(createManufacturer).toHaveBeenCalledWith({ name: "ASUS" });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("updates, cancels, and reports delete and field errors", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ManufacturerListPage />, {
      route: "/master-data/manufacturers?edit=amd",
    });
    const dialog = await screen.findByRole("dialog", { name: "Edit Manufacturer" });
    const name = await within(dialog).findByLabelText("Name");
    expect(name).toHaveValue("AMD");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    updateManufacturer.mockRejectedValueOnce(
      apiError(400, { errors: { name: ["Name is taken."] } }),
    );
    renderWithQuery(<ManufacturerListPage />, {
      route: "/master-data/manufacturers?edit=amd",
    });
    const again = await screen.findByRole("dialog", { name: "Edit Manufacturer" });
    await within(again).findByLabelText("Name");
    await user.click(within(again).getByRole("button", { name: "Save" }));
    expect(await within(again).findByText("Name is taken.")).toBeInTheDocument();

    updateManufacturer.mockResolvedValue(amd);
    await user.click(within(again).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateManufacturer).toHaveBeenCalledWith("amd", { name: "AMD" });
    });

    deleteManufacturer.mockRejectedValueOnce(
      apiError(404, { detail: "Manufacturer was not found." }),
    );
    renderWithQuery(<ManufacturerListPage />, {
      route: "/master-data/manufacturers?edit=amd",
    });
    const deleting = await screen.findByRole("dialog", { name: "Edit Manufacturer" });
    await within(deleting).findByLabelText("Name");
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    await user.click(within(deleting).getByRole("button", { name: "Delete" }));
    expect(deleteManufacturer).not.toHaveBeenCalled();
    await user.click(within(deleting).getByRole("button", { name: "Delete" }));
    expect(await within(deleting).findByRole("alert")).toHaveTextContent(
      "Manufacturer was not found.",
    );
  });

  it("closes when the manufacturer is missing", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ManufacturerListPage />, {
      route: "/master-data/manufacturers?edit=missing",
    });
    const dialog = await screen.findByRole("dialog", { name: "Manufacturer not found" });
    await user.click(within(dialog).getAllByRole("button", { name: "Close" })[0]);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("shows the dialog while the list is loading", async () => {
    let finish: (items: NamedMasterData[]) => void = () => {};
    listManufacturers.mockImplementation(
      () =>
        new Promise<NamedMasterData[]>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithQuery(<ManufacturerListPage />, {
      route: "/master-data/manufacturers?edit=amd",
    });
    expect(await screen.findByText("Loading Manufacturer…")).toBeInTheDocument();
    finish([amd]);
    expect(await screen.findByLabelText("Name")).toHaveValue("AMD");
  });

  it("bulk-deletes, bulk-edits, and imports", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ManufacturerListPage />, {
      route: "/master-data/manufacturers",
    });
    const checkboxes = await screen.findAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);
    await user.click(screen.getByRole("button", { name: "Delete Selected" }));
    await waitFor(() => {
      expect(deleteManufacturers).toHaveBeenCalledWith({ ids: ["amd", "intel"] });
    });
    expect(window.confirm).toHaveBeenCalledWith("Delete 2 manufacturers?");
    const fresh = await screen.findAllByRole("checkbox");
    expect({
      same: checkboxes[1] === fresh[1],
      connected: checkboxes[1].isConnected,
    }).toEqual({ same: true, connected: true });

    deleteManufacturers.mockRejectedValueOnce(new Error("nope"));
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Delete Selected" }));
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Selected" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit manufacturers" });
    const name = within(dialog).getByRole("textbox", { name: "Name for AMD" });
    await user.clear(name);
    await user.type(name, "AMD Inc");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateManufacturers).toHaveBeenCalledWith([
        expect.objectContaining({ id: "amd", name: "AMD Inc" }),
      ]);
    });

    await user.click(screen.getByRole("button", { name: "Import" }));
    const importer = await screen.findByRole("dialog", { name: "Import from Excel" });
    fireEvent.change(within(importer).getByLabelText("Excel file"), {
      target: { files: [new File(["sheet"], "makers.xlsx")] },
    });
    await user.click(within(importer).getByRole("button", { name: "Import" }));
    await waitFor(() => {
      expect(importManufacturers).toHaveBeenCalled();
    });
  });
});