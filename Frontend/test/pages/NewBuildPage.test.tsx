import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Link, Route, Routes } from "react-router-dom";
import type { PcBuildDetail, PcBuildDraft } from "@/api/builds";

const getChassisById = vi.fn();
const getStorageDriveById = vi.fn();
const getBuildById = vi.fn();
const checkPcBuildCompatibility = vi.fn();
const createPcBuild = vi.fn();
const updatePcBuild = vi.fn();

vi.mock("@/api/catalog/chassis", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalog/chassis")>(
    "@/api/catalog/chassis",
  );
  return {
    ...actual,
    getChassisById: (...args: unknown[]) => getChassisById(...args),
  };
});

vi.mock("@/api/catalog/storage-drives", async () => {
  const actual = await vi.importActual<
    typeof import("@/api/catalog/storage-drives")
  >("@/api/catalog/storage-drives");
  return {
    ...actual,
    getStorageDriveById: (...args: unknown[]) => getStorageDriveById(...args),
  };
});

vi.mock("@/api/builds", async () => {
  const actual = await vi.importActual<typeof import("@/api/builds")>(
    "@/api/builds",
  );
  return {
    ...actual,
    getBuildById: (...args: unknown[]) => getBuildById(...args),
    checkPcBuildCompatibility: (...args: unknown[]) =>
      checkPcBuildCompatibility(...args),
    createPcBuild: (...args: unknown[]) => createPcBuild(...args),
    updatePcBuild: (...args: unknown[]) => updatePcBuild(...args),
  };
});
import { AuthContext } from "@/auth/auth-context.ts";
import { BuilderPage } from "@/pages/build/BuilderPage.tsx";
import { authValue, testUser } from "../helpers/auth.ts";
import { renderWithQuery } from "../helpers/query.tsx";

const savedBuild: PcBuildDetail = {
  id: "build-1",
  name: "Office box",
  description: "Quiet",
  userId: "user-1",
  isPublic: false,
  chassisId: "case-1",
  motherboardId: "mb-1",
  cpuId: "cpu-9",
  ramKitId: "ram-1",
  psuId: "psu-1",
  chassisFans: [],
  storageDevices: [],
  wiredNetworkAdapters: [],
  wirelessNetworkAdapters: [],
};

const ownerAuth = authValue({
  user: testUser,
  isAuthenticated: true,
  isMember: true,
});

function renderBuilder(
  route: string,
  initialBuild?: Partial<PcBuildDraft>,
  auth = authValue(),
) {
  return renderWithQuery(
    <AuthContext.Provider value={auth}>
      <Link to="/builds/current">Current draft</Link>
      <Routes>
        <Route path="/builds/current" element={<BuilderPage />} />
        <Route path="/builds/:buildId/edit" element={<BuilderPage />} />
        <Route path="/builds/:buildId" element={<BuilderPage />} />
      </Routes>
    </AuthContext.Provider>,
    { route, initialBuild },
  );
}

describe("BuilderPage", () => {
  beforeEach(() => {
    getChassisById.mockReset();
    getStorageDriveById.mockReset();
    getBuildById.mockReset();
    checkPcBuildCompatibility.mockReset();
    createPcBuild.mockReset();
    updatePcBuild.mockReset();
    checkPcBuildCompatibility.mockResolvedValue({
      status: "Compatible",
      issues: [],
    });
  });

  it("lists every component slot with choose actions", async () => {
    renderWithQuery(<BuilderPage />, { route: "/builds/current" });
    expect(
      await screen.findByRole("heading", { name: "New build" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear build" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Choose a chassis" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose a motherboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose a CPU" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose a graphics card" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose storage" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose a PSU" }),
    ).toBeInTheDocument();
  });

  it("shows a selected chassis and can remove it", async () => {
    getChassisById.mockResolvedValue({
      id: "case-1",
      name: "Lian Li O11",
      manufacturerName: "Lian Li",
    });
    const user = userEvent.setup();
    renderWithQuery(<BuilderPage />, {
      route: "/builds/current",
      initialBuild: { chassisId: "case-1" },
    });
    expect(
      await screen.findByRole("link", { name: "Lian Li O11" }),
    ).toHaveAttribute("href", "/catalog/chassis/case-1");
    expect(screen.getByText("Lian Li")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear build" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(
      await screen.findByRole("button", { name: "Choose a chassis" }),
    ).toBeInTheDocument();
  });

  it("lets quantity change on multi-select parts", async () => {
    getStorageDriveById.mockResolvedValue({
      id: "ssd-1",
      name: "990 Pro",
      manufacturerName: "Samsung",
    });
    const user = userEvent.setup();
    renderWithQuery(<BuilderPage />, {
      route: "/builds/current",
      initialBuild: {
        storageDevices: [
          { type: "StorageDrive", partId: "ssd-1", quantity: 1 },
        ],
      },
    });
    expect(
      await screen.findByRole("link", { name: "990 Pro" }),
    ).toHaveAttribute("href", "/catalog/storage/ssd-1");
    expect(screen.getByText("Qty 1")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Increase 990 Pro quantity" }),
    );
    expect(await screen.findByText("Qty 2")).toBeInTheDocument();
  });

  it("does not fetch a saved build on /builds/current", async () => {
    renderBuilder("/builds/current");
    expect(
      await screen.findByRole("heading", { name: "New build" }),
    ).toBeInTheDocument();
    expect(getBuildById).not.toHaveBeenCalled();
  });

  it("does not check compatibility when no parts are chosen", async () => {
    renderWithQuery(<BuilderPage />, { route: "/builds/current" });
    expect(
      await screen.findByRole("heading", { name: "New build" }),
    ).toBeInTheDocument();
    expect(checkPcBuildCompatibility).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: "Compatibility" }),
    ).not.toBeInTheDocument();
  });

  it("checks compatibility on load when a part is chosen", async () => {
    getChassisById.mockResolvedValue({
      id: "case-1",
      name: "Lian Li O11",
      manufacturerName: "Lian Li",
    });
    renderWithQuery(<BuilderPage />, {
      route: "/builds/current",
      initialBuild: { chassisId: "case-1" },
    });
    expect(
      await screen.findByRole("heading", { name: "Compatibility" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("No issues.")).toBeInTheDocument();
    expect(checkPcBuildCompatibility).toHaveBeenCalledWith(
      expect.objectContaining({ chassisId: "case-1" }),
    );
  });

  it("lists compatibility issues returned by the API", async () => {
    checkPcBuildCompatibility.mockResolvedValue({
      status: "Incompatible",
      issues: [
        {
          status: "Incompatible",
          reason: "SocketMismatch",
          rated: null,
          executing: null,
          parts: [
            { slot: "Cpu", partId: "cpu-1" },
            { slot: "Motherboard", partId: "mb-1" },
          ],
        },
      ],
    });
    renderWithQuery(<BuilderPage />, {
      route: "/builds/current",
      initialBuild: { cpuId: "cpu-1", motherboardId: "mb-1" },
    });
    expect(await screen.findByText("Incompatible")).toBeInTheDocument();
    expect(await screen.findByText("Socket Mismatch")).toBeInTheDocument();
  });

  it("shows a saved build as read-only on /builds/:id", async () => {
    getBuildById.mockResolvedValue(savedBuild);
    getChassisById.mockResolvedValue({
      id: "case-1",
      name: "Lian Li O11",
      manufacturerName: "Lian Li",
    });
    renderBuilder("/builds/build-1");
    expect(
      await screen.findByRole("heading", { name: "Office box" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Quiet")).toBeInTheDocument();
    expect(getBuildById).toHaveBeenCalledWith("build-1");
    expect(
      await screen.findByRole("link", { name: "Lian Li O11" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Compatibility" }),
    ).toBeInTheDocument();
    expect(checkPcBuildCompatibility).toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Save build" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("None").length).toBeGreaterThan(0);
  });

  it("lets the owner edit a saved build on /builds/:id/edit", async () => {
    getBuildById.mockResolvedValue(savedBuild);
    getChassisById.mockResolvedValue({
      id: "case-1",
      name: "Lian Li O11",
      manufacturerName: "Lian Li",
    });
    renderBuilder("/builds/build-1/edit", undefined, ownerAuth);
    expect(
      await screen.findByRole("heading", { name: "Office box" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Save build" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("sends a non-owner from /edit to the view page", async () => {
    getBuildById.mockResolvedValue(savedBuild);
    renderBuilder("/builds/build-1/edit");
    expect(
      await screen.findByRole("heading", { name: "Office box" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save build" }),
    ).not.toBeInTheDocument();
  });

  it("lets the owner open the editor from the view page", async () => {
    getBuildById.mockResolvedValue(savedBuild);
    renderBuilder("/builds/build-1", undefined, ownerAuth);
    expect(
      await screen.findByRole("link", { name: "Edit this build" }),
    ).toHaveAttribute("href", "/builds/build-1/edit");
  });

  it("shows an error when the saved build cannot be loaded", async () => {
    getBuildById.mockRejectedValue(new Error("fail"));
    renderBuilder("/builds/build-1");
    expect(
      await screen.findByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });

  const completeDraft = {
    chassisId: "case-1",
    motherboardId: "mb-1",
    cpuId: "cpu-9",
    ramKitId: "ram-1",
    psuId: "psu-1",
  };

  it("keeps save disabled until required parts are chosen", async () => {
    renderWithQuery(<BuilderPage />, {
      route: "/builds/current",
      initialBuild: { chassisId: "case-1" },
    });
    expect(
      await screen.findByRole("heading", { name: "Compatibility" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save build" })).toBeDisabled();
  });

  it("opens the save dialog and creates a build", async () => {
    createPcBuild.mockResolvedValue({
      ...savedBuild,
      id: "created-1",
      name: "Living room",
      description: "Quiet daily driver",
      ...completeDraft,
    });
    const user = userEvent.setup();
    renderBuilder("/builds/current", completeDraft);
    expect(
      await screen.findByRole("heading", { name: "Compatibility" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save build" }));
    expect(
      await screen.findByRole("heading", { name: "Save build" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText("Build name is required."),
    ).toBeInTheDocument();
    expect(createPcBuild).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Name"), "Living room");
    await user.type(
      screen.getByLabelText("Description"),
      "Quiet daily driver",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(createPcBuild).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Living room",
        description: "Quiet daily driver",
        chassisId: "case-1",
        cpuId: "cpu-9",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Living room" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Current draft" }));
    expect(
      await screen.findByRole("heading", { name: "New build" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose a chassis" }),
    ).toBeInTheDocument();
  });

  it("updates an existing build from the save dialog", async () => {
    getBuildById.mockResolvedValue(savedBuild);
    updatePcBuild.mockResolvedValue({
      ...savedBuild,
      name: "Office box v2",
      description: "Revised",
    });
    const user = userEvent.setup();
    renderBuilder("/builds/build-1/edit", undefined, ownerAuth);
    expect(
      await screen.findByRole("heading", { name: "Office box" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save build" }));
    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Office box v2");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(updatePcBuild).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "build-1",
        name: "Office box v2",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Office box v2" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Current draft" }));
    expect(
      await screen.findByRole("heading", { name: "New build" }),
    ).toBeInTheDocument();
  });

  it("explains that guest builds cannot be updated on 401", async () => {
    const { AxiosError } = await import("axios");
    const error = new AxiosError("fail");
    error.response = {
      status: 401,
      data: {},
      statusText: "Unauthorized",
      headers: {},
      config: {} as never,
    };
    getBuildById.mockResolvedValue(savedBuild);
    updatePcBuild.mockRejectedValue(error);
    const user = userEvent.setup();
    renderBuilder("/builds/build-1/edit", undefined, ownerAuth);
    expect(
      await screen.findByRole("heading", { name: "Office box" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save build" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText("Builds by guests cannot be updated"),
    ).toBeInTheDocument();
  });
});
