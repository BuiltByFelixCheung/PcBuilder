import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createCpu = vi.fn();
const listManufacturersByProductType = vi.fn();
const listSockets = vi.fn();
const listCpuSeries = vi.fn();

vi.mock("@/api/catalog/cpus", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/catalog/cpus")>(
      "@/api/catalog/cpus",
    );
  return {
    ...actual,
    createCpu: (...args: unknown[]) => createCpu(...args),
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
    listSockets: () => listSockets(),
    listCpuSeries: () => listCpuSeries(),
    listChipsets: vi.fn().mockResolvedValue([
      {
        id: "z890",
        name: "Z890",
        manufacturerId: "intel",
      },
      {
        id: "b650",
        name: "B650",
        manufacturerId: "amd",
      },
    ]),
  };
});

import { CpuCreatePage } from "@/pages/catalog/cpus/CpuCreatePage.tsx";
import { chooseOption } from "../helpers/choose-option.ts";
import { renderWithQuery } from "../helpers/query.tsx";

describe("CpuCreatePage", () => {
  beforeEach(() => {
    createCpu.mockReset();
    createCpu.mockResolvedValue({ id: "cpu-new" });
    listManufacturersByProductType.mockReset().mockResolvedValue([
      { id: "amd", name: "AMD" },
      { id: "intel", name: "Intel" },
    ]);
    listSockets.mockReset().mockResolvedValue([
      { id: "am5", name: "AM5", manufacturerId: "amd" },
      { id: "lga1851", name: "LGA1851", manufacturerId: "intel" },
    ]);
    listCpuSeries.mockReset().mockResolvedValue([
      { id: "r7", name: "Ryzen 7", manufacturerId: "amd" },
      { id: "ultra", name: "Core Ultra", manufacturerId: "intel" },
    ]);
  });

  it("posts scalar fields and child rows", async () => {
    const user = userEvent.setup();
    renderWithQuery(<CpuCreatePage />, { route: "/catalog/cpus/new" });

    expect(
      await screen.findByRole("heading", { name: "New CPU" }),
    ).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: /^Name for/ }), "Ryzen 5");
    await chooseOption(user, "Manufacturer for Ryzen 5", "AMD");
    await user.click(screen.getByLabelText("Series for Ryzen 5"));
    expect(await screen.findByRole("option", { name: "Ryzen 7" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Core Ultra" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Ryzen 7" }));
    await user.click(screen.getByLabelText("Socket for Ryzen 5"));
    expect(await screen.findByRole("option", { name: "AM5" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "LGA1851" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "AM5" }));
    await user.click(
      screen.getByRole("button", { name: "Add RAM compatibility" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Add Supported chipsets" }),
    );
    expect(screen.getByRole("combobox", { name: "DDR generation" })).toHaveTextContent(
      "DDR5",
    );
    expect(screen.getByRole("combobox", { name: "Chipset" })).toHaveTextContent(
      "B650",
    );
    await user.click(screen.getByLabelText("Chipset"));
    expect(await screen.findByRole("option", { name: "B650" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Z890" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(createCpu).toHaveBeenCalledTimes(1));
    expect(createCpu).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ryzen 5",
        manufacturerId: "amd",
        seriesId: "r7",
        socketId: "am5",
        ramCompats: [
          expect.objectContaining({
            ddrGeneration: "Ddr5",
            ramModuleCount: 1,
            ramRank: "SingleRank",
            maxSpeedMts: 4800,
          }),
        ],
        supportChipsets: [
          expect.objectContaining({
            chipsetId: "b650",
            chipsetName: "B650",
            requiresBiosUpdate: false,
          }),
        ],
      }),
    );
  });
});
