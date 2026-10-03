import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CpuDetail, CpuListItem } from "@/api/catalog/cpus.ts";

const getCpuById = vi.fn();
const updateCpu = vi.fn();
const updateCpuRamCompats = vi.fn();
const listManufacturersByProductType = vi.fn();
const listSockets = vi.fn();
const listCpuSeries = vi.fn();
const listChipsets = vi.fn();

vi.mock("@/api/catalog/cpus", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/catalog/cpus")>(
      "@/api/catalog/cpus",
    );
  return {
    ...actual,
    getCpuById: (...args: unknown[]) => getCpuById(...args),
    updateCpu: (...args: unknown[]) => updateCpu(...args),
    updateCpuRamCompats: (...args: unknown[]) => updateCpuRamCompats(...args),
  };
});

vi.mock("@/api/master-data.ts", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/master-data.ts")>(
      "@/api/master-data.ts",
    );
  return {
    ...actual,
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    listSockets: () => listSockets(),
    listCpuSeries: () => listCpuSeries(),
    listChipsets: () => listChipsets(),
  };
});

import { CpuDetailPage } from "@/pages/catalog/cpus/CpuDetailPage.tsx";
import { chooseOption } from "../helpers/choose-option.ts";

async function expectOpenChoices(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  present: readonly string[],
  absent: readonly string[],
) {
  await user.click(screen.getByLabelText(label));
  for (const name of present) {
    expect(await screen.findByRole("option", { name })).toBeInTheDocument();
  }
  for (const name of absent) {
    expect(screen.queryByRole("option", { name })).not.toBeInTheDocument();
  }
  await user.keyboard("{Escape}");
}
import { renderWithQuery } from "../helpers/query.tsx";
import { Route, Routes } from "react-router-dom";

const cpu: CpuDetail = {
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
  ramCompats: [
    {
      ddrGeneration: "Ddr5",
      ramModuleCount: 2,
      ramRank: "DualRank",
      maxSpeedMts: 6000,
    },
  ],
  supportChipsets: [
    { chipsetId: "x670", chipsetName: "X670", requiresBiosUpdate: false },
    { chipsetId: "b650", chipsetName: "B650", requiresBiosUpdate: true },
  ],
};

function renderDetail(
  route = "/catalog/cpus/cpu-1",
  options?: { isAdmin?: boolean },
) {
  return renderWithQuery(
    <Routes>
      <Route path="/catalog/cpus/:cpuId" element={<CpuDetailPage />} />
    </Routes>,
    { route, isAdmin: options?.isAdmin },
  );
}

describe("CpuDetailPage", () => {
  beforeEach(() => {
    getCpuById.mockReset();
    updateCpu.mockReset();
    updateCpuRamCompats.mockReset();
    listManufacturersByProductType.mockReset().mockResolvedValue([
      { id: "amd", name: "AMD" },
      { id: "intel", name: "Intel" },
    ]);
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
        id: "z890",
        name: "Z890",
        manufacturerId: "intel",
        manufacturerName: "Intel",
        socketId: "lga1851",
        socketName: "LGA1851",
      },
      {
        id: "b650",
        name: "B650",
        manufacturerId: "amd",
        manufacturerName: "AMD",
        socketId: "am5",
        socketName: "AM5",
      },
      {
        id: "x670",
        name: "X670",
        manufacturerId: "amd",
        manufacturerName: "AMD",
        socketId: "am5",
        socketName: "AM5",
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
      {
        id: "ultra",
        name: "Core Ultra",
        manufacturerId: "intel",
        manufacturerName: "Intel",
        socketId: "lga1851",
        socketName: "LGA1851",
      },
    ]);
  });

  it("renders CPU details and RAM compatibility", async () => {
    getCpuById.mockResolvedValue(cpu);
    renderDetail();
    expect(
      await screen.findByRole("heading", { name: "Ryzen 7 7800X3D" }),
    ).toBeInTheDocument();
    expect(screen.getByText("AMD")).toBeInTheDocument();
    expect(screen.getByText("DDR5")).toBeInTheDocument();
    expect(screen.getByText("X670, B650*")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to CPUs" })).toHaveAttribute(
      "href",
      "/catalog/cpus",
    );
    expect(screen.queryByLabelText("QTY")).not.toBeInTheDocument();
  });

  it("saves the list item and replaces RAM compatibility", async () => {
    getCpuById.mockResolvedValue(cpu);
    updateCpu.mockResolvedValue(undefined);
    updateCpuRamCompats.mockResolvedValue([]);
    const user = userEvent.setup();
    renderDetail("/catalog/cpus/cpu-1", { isAdmin: true });

    const title = await screen.findByRole("heading", {
      name: "Ryzen 7 7800X3D",
    });
    await user.click(
      within(title.parentElement!).getByRole("button", { name: "Edit" }),
    );
    const name = screen.getByRole("textbox", {
      name: "Name for Ryzen 7 7800X3D",
    });
    await user.clear(name);
    await user.type(name, "7800X3D");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateCpu).toHaveBeenCalledTimes(1);
    });
    const [saved] = updateCpu.mock.calls[0] as [CpuListItem];
    expect(saved.name).toBe("7800X3D");
    expect(saved).not.toHaveProperty("ramCompats");
    expect(saved).not.toHaveProperty("supportChipsets");

    await user.click(screen.getByRole("button", { name: "Edit RAM" }));
    await user.click(screen.getByRole("button", { name: "Remove row 1" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateCpuRamCompats).toHaveBeenCalledWith("cpu-1", []);
    });
  });

  it("limits edit series and socket choices to the manufacturer", async () => {
    getCpuById.mockResolvedValue(cpu);
    const user = userEvent.setup();
    renderDetail("/catalog/cpus/cpu-1", { isAdmin: true });

    const title = await screen.findByRole("heading", {
      name: "Ryzen 7 7800X3D",
    });
    await user.click(
      within(title.parentElement!).getByRole("button", { name: "Edit" }),
    );
    const seriesLabel = "Series for Ryzen 7 7800X3D";
    const socketLabel = "Socket for Ryzen 7 7800X3D";
    await expectOpenChoices(user, seriesLabel, ["Ryzen 7"], ["Core Ultra"]);
    await expectOpenChoices(user, socketLabel, ["AM5"], ["LGA1851"]);
    await chooseOption(user, "Manufacturer for Ryzen 7 7800X3D", "Intel");
    await expectOpenChoices(user, seriesLabel, ["Core Ultra"], ["Ryzen 7"]);
    await expectOpenChoices(user, socketLabel, ["LGA1851"], ["AM5"]);
    expect(screen.getByLabelText(seriesLabel)).not.toHaveTextContent("Ryzen 7");
    expect(screen.getByLabelText(socketLabel)).not.toHaveTextContent("AM5");
  });

  it("limits chipset choices to the manufacturer", async () => {
    getCpuById.mockResolvedValue(cpu);
    const user = userEvent.setup();
    renderDetail("/catalog/cpus/cpu-1", { isAdmin: true });
    await screen.findByRole("heading", { name: "Ryzen 7 7800X3D" });
    await user.click(screen.getByRole("button", { name: "Edit chipsets" }));
    await user.click(screen.getAllByLabelText("Chipset")[0]);
    expect(await screen.findByRole("option", { name: "B650" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "X670" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Z890" })).not.toBeInTheDocument();
  });

  it("shows an API error", async () => {
    getCpuById.mockRejectedValue(new Error("fail"));
    renderDetail();
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  it("shows a loading state", async () => {
    getCpuById.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(await screen.findByText("Loading CPU…")).toBeInTheDocument();
  });

  it("shows empty compatibility tables and included options", async () => {
    getCpuById.mockResolvedValue({
      ...cpu,
      integratedGraphics: true,
      includedStockCooler: true,
      ramCompats: [],
    });
    renderDetail();
    expect(await screen.findByText("Included")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(
      screen.getByText("No RAM compatibility entries."),
    ).toBeInTheDocument();
    expect(screen.getByText("X670, B650*")).toBeInTheDocument();
  });
});
