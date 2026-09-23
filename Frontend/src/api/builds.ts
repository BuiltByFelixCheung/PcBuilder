import { api } from "./client";
import { type PagedRequest, type PagedResult } from "./paging";

export type PcBuildFields = {
  chassisId: string;
  motherboardId: string;
  cpuId: string;
  cpuCoolerId?: string;
  ramKitId: string;
  graphicsCardId?: string;
  psuId: string;
  chassisFans: PcBuildPart[];
  storageDevices: PcBuildPart[];
  wiredNetworkAdapters: PcBuildPart[];
  wirelessNetworkAdapters: PcBuildPart[];
};

export type PcBuildDraft = {
  chassisId?: string;
  motherboardId?: string;
  cpuId?: string;
  cpuCoolerId?: string;
  ramKitId?: string;
  graphicsCardId?: string;
  psuId?: string;
  chassisFans: PcBuildPart[];
  storageDevices: PcBuildPart[];
  wiredNetworkAdapters: PcBuildPart[];
  wirelessNetworkAdapters: PcBuildPart[];
};

export type PcBuildListItem = {
  id: string;
  name: string;
  description: string;
  userId: string | null;
  isPublic: boolean;
};

export type PcBuildDetail = PcBuildListItem & PcBuildFields;

export const pcBuildKeys = {
  all: ["builds"] as const,
  details: () => [...pcBuildKeys.all, "detail"] as const,
  detail: (id: string) => [...pcBuildKeys.details(), id] as const,
  compatibility: (draft: PcBuildDraft) =>
    [...pcBuildKeys.all, "compatibility", draft] as const,
};

export function toPcBuildDraft(detail: PcBuildDetail): PcBuildDraft {
  return workspaceToDraft(detail);
}

export function workspaceToDraft(draft: PcBuildDraft): PcBuildDraft {
  return {
    chassisId: draft.chassisId,
    motherboardId: draft.motherboardId,
    cpuId: draft.cpuId,
    cpuCoolerId: draft.cpuCoolerId,
    ramKitId: draft.ramKitId,
    graphicsCardId: draft.graphicsCardId,
    psuId: draft.psuId,
    chassisFans: draft.chassisFans,
    storageDevices: draft.storageDevices,
    wiredNetworkAdapters: draft.wiredNetworkAdapters,
    wirelessNetworkAdapters: draft.wirelessNetworkAdapters,
  };
}

export function toPcBuildFields(
  draft: PcBuildDraft,
): PcBuildFields | undefined {
  if (
    !draft.chassisId ||
    !draft.motherboardId ||
    !draft.cpuId ||
    !draft.ramKitId ||
    !draft.psuId
  ) {
    return undefined;
  }

  return {
    chassisId: draft.chassisId,
    motherboardId: draft.motherboardId,
    cpuId: draft.cpuId,
    cpuCoolerId: draft.cpuCoolerId,
    ramKitId: draft.ramKitId,
    graphicsCardId: draft.graphicsCardId,
    psuId: draft.psuId,
    chassisFans: draft.chassisFans,
    storageDevices: draft.storageDevices,
    wiredNetworkAdapters: draft.wiredNetworkAdapters,
    wirelessNetworkAdapters: draft.wirelessNetworkAdapters,
  };
}

export const PC_BUILD_PART_TYPES = [
  "StorageDrive",
  "ChassisFan",
  "WiredNetworkAdapter",
  "WirelessNetworkAdapter",
] as const;
export type PcBuildPartType = (typeof PC_BUILD_PART_TYPES)[number];

export type PcBuildPart = {
  type: PcBuildPartType;
  partId: string;
  quantity: number;
};

export const PARTS_COMPATIBILITY = [
  "Incompatible",
  "CompatibleActionRequired",
  "CompatibleReduced",
  "Compatible",
] as const;
export type PartsCompatibility = (typeof PARTS_COMPATIBILITY)[number];

export const COMPATIBILITY_CHECK_REASONS = [
  "None",
  "SocketMismatch",
  "ChipsetNotSupported",
  "RequiresBiosUpdate",
  "RequiresIntegratedGraphics",
  "NoMatchingRamConfig",
  "MemorySpeedExceedsCpuSupport",
  "NotEnoughPcieSlots",
  "PcieGenerationReduced",
  "ExceedsPowerBudget",
  "InsufficientCpuPowerCables",
  "MissingMotherboardPowerCable",
  "InsufficientPciePowerCables",
  "MissingCpuCoolerSocket",
  "ExceedsThermalDesignPower",
  "RamHeightExceedsCoolerLimit",
  "InsufficientSataCables",
  "NoMatchingM2Slot",
  "SlotDoesNotSupportSata",
  "InsufficientSataPorts",
  "NoMatchingUsbPort",
  "UsbVersionReduced",
  "PartSizeExceedsLimits",
  "CpuCoolerRequired",
] as const;
export type CompatibilityCheckReason =
  (typeof COMPATIBILITY_CHECK_REASONS)[number];

export const COMPATIBILITY_SLOTS = [
  "Chassis",
  "Motherboard",
  "Cpu",
  "CpuCooler",
  "RamKit",
  "GraphicsCard",
  "Psu",
  "ChassisFans",
  "StorageDevices",
  "WiredNetworkAdapters",
  "WirelessNetworkAdapters",
] as const;

export type CompatibilitySlot = (typeof COMPATIBILITY_SLOTS)[number];

export type CompatibilityPartRef = {
  slot: CompatibilitySlot;
  partId: string | null;
};

export type CompatibilityIssue = {
  status: PartsCompatibility;
  reason: CompatibilityCheckReason;
  rated: string | null;
  executing: string | null;
  parts: CompatibilityPartRef[];
};

export type CompatibilityCheckResult = {
  status: PartsCompatibility;
  issues: CompatibilityIssue[];
};

export type CreatePcBuildCommand = PcBuildFields & {
  name: string;
  description: string;
};

export type UpdatePcBuildCommand = PcBuildFields & {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
};

export function listPublicBuilds(
  request: PagedRequest,
): Promise<PagedResult<PcBuildListItem>> {
  return api
    .get<PagedResult<PcBuildListItem>>("/builds", { params: request })
    .then((response) => response.data);
}

export function listMyBuilds(
  request: PagedRequest,
): Promise<PagedResult<PcBuildListItem>> {
  return api
    .get<PagedResult<PcBuildListItem>>("/builds/me", { params: request })
    .then((response) => response.data);
}

export function getBuildById(id: string): Promise<PcBuildDetail> {
  return api
    .get<PcBuildDetail>(`/builds/${id}`)
    .then((response) => response.data);
}

export function checkPcBuildCompatibility(
  query: PcBuildDraft,
): Promise<CompatibilityCheckResult> {
  return api
    .post<CompatibilityCheckResult>("/builds/compatibility", query)
    .then((response) => response.data);
}

export function createPcBuild(
  build: CreatePcBuildCommand,
): Promise<PcBuildDetail> {
  return api
    .post<PcBuildDetail>("/builds", build)
    .then((response) => response.data);
}

export function updatePcBuild(
  build: UpdatePcBuildCommand,
): Promise<PcBuildDetail> {
  return api
    .put<PcBuildDetail>("/builds", build)
    .then((response) => response.data);
}
