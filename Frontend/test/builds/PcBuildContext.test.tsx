import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { usePcBuild } from "@/builds";
import { BUILD_SESSION_KEY } from "@/builds/session-storage.ts";
import type { PcBuildDetail } from "@/api/builds";
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

function Probe() {
  const build = usePcBuild();
  return (
    <>
      <span>{build.cpuId ?? "none"}</span>
      <span>source:{build.sourceId ?? "none"}</span>
      <span>name:{build.name || "blank"}</span>
      <button type="button" onClick={() => build.addToBuild("cpu", "cpu-1")}>
        add cpu
      </button>
      <button type="button" onClick={() => build.resetBuild()}>
        reset
      </button>
      <button type="button" onClick={() => build.applyDetail(savedBuild)}>
        apply
      </button>
    </>
  );
}

describe("PcBuildProvider session storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("writes the draft on change and restores it on remount", async () => {
    const user = userEvent.setup();
    const first = renderWithQuery(<Probe />);
    await user.click(screen.getByRole("button", { name: "add cpu" }));
    expect(screen.getByText("cpu-1")).toBeInTheDocument();
    expect(sessionStorage.getItem(BUILD_SESSION_KEY)).toContain("cpu-1");
    first.unmount();

    renderWithQuery(<Probe />);
    expect(screen.getByText("cpu-1")).toBeInTheDocument();
  });

  it("clears storage when the build is reset", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Probe />);
    await user.click(screen.getByRole("button", { name: "add cpu" }));
    await user.click(screen.getByRole("button", { name: "reset" }));
    expect(screen.getByText("none")).toBeInTheDocument();
    expect(sessionStorage.getItem(BUILD_SESSION_KEY)).not.toContain("cpu-1");
  });

  it("hydrates the draft from a saved build and keeps sourceId across remount", async () => {
    const user = userEvent.setup();
    const first = renderWithQuery(<Probe />);
    await user.click(screen.getByRole("button", { name: "apply" }));
    expect(screen.getByText("cpu-9")).toBeInTheDocument();
    expect(screen.getByText("source:build-1")).toBeInTheDocument();
    expect(screen.getByText("name:Office box")).toBeInTheDocument();
    first.unmount();

    renderWithQuery(<Probe />);
    expect(screen.getByText("cpu-9")).toBeInTheDocument();
    expect(screen.getByText("source:build-1")).toBeInTheDocument();
  });
});
