import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChipsetOption } from "@/api/master-data";

const listChipsets = vi.fn();
const listManufacturersByProductType = vi.fn();
const listSockets = vi.fn();
const updateChipset = vi.fn();
const createChipset = vi.fn();

vi.mock("@/api/master-data", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/master-data")>(
      "@/api/master-data",
    );
  return {
    ...actual,
    listChipsets: () => listChipsets(),
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    listSockets: () => listSockets(),
    updateChipset: (...args: unknown[]) => updateChipset(...args),
    createChipset: (...args: unknown[]) => createChipset(...args),
  };
});

import { ChipsetListPage } from "@/pages/master-data/chipsets/ChipsetListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const chipset: ChipsetOption = {
  id: "x870",
  name: "X870",
  manufacturerId: "amd",
  manufacturerName: "AMD",
  socketId: "am5",
  socketName: "AM5",
};

describe("ChipsetListPage", () => {
  beforeEach(() => {
    listChipsets.mockReset().mockResolvedValue([chipset]);
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
    updateChipset.mockReset().mockResolvedValue(chipset);
    createChipset.mockReset().mockResolvedValue(chipset);
  });

  it("opens the chipset named in the edit query", async () => {
    renderWithQuery(<ChipsetListPage />, {
      route: "/master-data/chipsets",
    });

    const link = await screen.findByRole("link", { name: "X870" });
    expect(link).toHaveAttribute("href", "/master-data/chipsets?edit=x870");

    await userEvent.click(link);

    const dialog = await screen.findByRole("dialog", { name: "Edit chipset" });
    expect(await within(dialog).findByLabelText("Name")).toHaveValue("X870");
    expect(within(dialog).getByLabelText("Manufacturer")).toHaveValue("amd");
    expect(within(dialog).getByLabelText("Socket")).toHaveValue("am5");
  });

  it("opens a blank dialog for a new chipset", async () => {
    renderWithQuery(<ChipsetListPage />, {
      route: "/master-data/chipsets",
    });

    await userEvent.click(
      await screen.findByRole("link", { name: "New Chipset" }),
    );

    const dialog = await screen.findByRole("dialog", { name: "New chipset" });
    expect(await within(dialog).findByLabelText("Name")).toHaveValue("");
  });

  it("saves the open chipset and clears the edit query", async () => {
    renderWithQuery(<ChipsetListPage />, {
      route: "/master-data/chipsets?edit=x870",
    });

    const dialog = await screen.findByRole("dialog", { name: "Edit chipset" });
    const name = await within(dialog).findByLabelText("Name");
    await userEvent.clear(name);
    await userEvent.type(name, "X870E");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateChipset).toHaveBeenCalledWith("x870", {
        name: "X870E",
        manufacturerId: "amd",
        socketId: "am5",
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
