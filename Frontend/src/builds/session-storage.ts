import {
  PC_BUILD_PART_TYPES,
  type PcBuildDraft,
  type PcBuildPart,
  type PcBuildPartType,
} from "@/api/builds";
import type { PcBuildWorkspace } from "./types";

export const BUILD_SESSION_KEY = "pcbuilder.current-build";

const emptyLists: Pick<
  PcBuildDraft,
  | "chassisFans"
  | "storageDevices"
  | "wiredNetworkAdapters"
  | "wirelessNetworkAdapters"
> = {
  chassisFans: [],
  storageDevices: [],
  wiredNetworkAdapters: [],
  wirelessNetworkAdapters: [],
};

function optionalId(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function parts(value: unknown): PcBuildPart[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row.partId !== "string" ||
      typeof row.quantity !== "number" ||
      row.quantity <= 0 ||
      !PC_BUILD_PART_TYPES.includes(row.type as PcBuildPartType)
    ) {
      return [];
    }
    return [
      {
        type: row.type as PcBuildPartType,
        partId: row.partId,
        quantity: row.quantity,
      },
    ];
  });
}

export function loadBuildDraft(): PcBuildWorkspace | undefined {
  try {
    const raw = sessionStorage.getItem(BUILD_SESSION_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return undefined;
    }
    const row = parsed as Record<string, unknown>;
    return {
      chassisId: optionalId(row.chassisId),
      motherboardId: optionalId(row.motherboardId),
      cpuId: optionalId(row.cpuId),
      cpuCoolerId: optionalId(row.cpuCoolerId),
      ramKitId: optionalId(row.ramKitId),
      graphicsCardId: optionalId(row.graphicsCardId),
      psuId: optionalId(row.psuId),
      chassisFans: parts(row.chassisFans),
      storageDevices: parts(row.storageDevices),
      wiredNetworkAdapters: parts(row.wiredNetworkAdapters),
      wirelessNetworkAdapters: parts(row.wirelessNetworkAdapters),
      sourceId: optionalId(row.sourceId) ?? null,
      name: typeof row.name === "string" ? row.name : "",
      description: typeof row.description === "string" ? row.description : "",
      isPublic: row.isPublic === true,
    };
  } catch {
    return undefined;
  }
}

export function saveBuildDraft(workspace: PcBuildWorkspace): void {
  try {
    sessionStorage.setItem(BUILD_SESSION_KEY, JSON.stringify(workspace));
  } catch {
    /* sessionStorage can throw in private mode */
  }
}

export function emptyBuildDraft(): PcBuildDraft {
  return { ...emptyLists };
}

export function emptyBuildWorkspace(): PcBuildWorkspace {
  return {
    ...emptyBuildDraft(),
    sourceId: null,
    name: "",
    description: "",
    isPublic: false,
  };
}
