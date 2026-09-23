import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { PcBuildContext } from "./pcbuild-context.ts";
import {
  emptyBuildWorkspace,
  loadBuildDraft,
  saveBuildDraft,
} from "./session-storage.ts";
import type {
  CatalogProductType,
  PcBuildContextValue,
  PcBuildWorkspace,
} from "./types";
import {
  toPcBuildDraft,
  type PcBuildDetail,
  type PcBuildDraft,
  type PcBuildPart,
  type PcBuildPartType,
} from "@/api/builds.ts";

const emptyWorkspace: PcBuildWorkspace = emptyBuildWorkspace();

type SingularKey =
  | "chassisId"
  | "motherboardId"
  | "cpuId"
  | "cpuCoolerId"
  | "ramKitId"
  | "graphicsCardId"
  | "psuId";

type MultiKey =
  | "chassisFans"
  | "storageDevices"
  | "wiredNetworkAdapters"
  | "wirelessNetworkAdapters";

const singularSlot: Partial<Record<CatalogProductType, SingularKey>> = {
  chassis: "chassisId",
  motherboard: "motherboardId",
  cpu: "cpuId",
  cpucooler: "cpuCoolerId",
  ram: "ramKitId",
  graphicscard: "graphicsCardId",
  psu: "psuId",
};

const multiSlot: Partial<
  Record<CatalogProductType, { key: MultiKey; type: PcBuildPartType }>
> = {
  chassisfan: { key: "chassisFans", type: "ChassisFan" },
  storagedrive: { key: "storageDevices", type: "StorageDrive" },
  wirednetworkadapter: {
    key: "wiredNetworkAdapters",
    type: "WiredNetworkAdapter",
  },
  wirelessnetworkadapter: {
    key: "wirelessNetworkAdapters",
    type: "WirelessNetworkAdapter",
  },
};

function upsertPart(
  parts: PcBuildPart[],
  type: PcBuildPartType,
  partId: string,
  quantity: number,
): PcBuildPart[] {
  const existing = parts.some((part) => part.partId === partId);
  if (!existing) {
    return [...parts, { type, partId, quantity }];
  }
  return parts.map((part) =>
    part.partId === partId
      ? { ...part, quantity: part.quantity + quantity }
      : part,
  );
}

function subtractPart(
  parts: PcBuildPart[],
  partId: string,
  quantity: number | undefined,
): PcBuildPart[] {
  return parts.flatMap((part) => {
    if (part.partId !== partId) {
      return [part];
    }
    if (quantity === undefined) {
      return [];
    }
    const next = part.quantity - quantity;
    return next <= 0 ? [] : [{ ...part, quantity: next }];
  });
}

function setPartQuantity(
  parts: PcBuildPart[],
  type: PcBuildPartType,
  partId: string,
  quantity: number,
): PcBuildPart[] {
  if (quantity <= 0) {
    return parts.filter((part) => part.partId !== partId);
  }
  const existing = parts.some((part) => part.partId === partId);
  if (!existing) {
    return [...parts, { type, partId, quantity }];
  }
  return parts.map((part) =>
    part.partId === partId ? { ...part, quantity } : part,
  );
}

export function PcBuildProvider({
  children,
  initialDraft,
}: Readonly<{ children: ReactNode; initialDraft?: Partial<PcBuildDraft> }>) {
  const [workspace, setWorkspace] = useState<PcBuildWorkspace>(() => ({
    ...emptyWorkspace,
    ...(initialDraft ? undefined : loadBuildDraft()),
    ...initialDraft,
  }));

  useEffect(() => {
    saveBuildDraft(workspace);
  }, [workspace]);

  const addToBuild = useCallback(
    (productType: CatalogProductType, partId: string, quantity?: number) => {
      setWorkspace((current) => {
        const singular = singularSlot[productType];
        if (singular) {
          return { ...current, [singular]: partId };
        }
        const multi = multiSlot[productType];
        if (!multi) {
          return current;
        }
        return {
          ...current,
          [multi.key]: upsertPart(
            current[multi.key],
            multi.type,
            partId,
            quantity ?? 1,
          ),
        };
      });
    },
    [],
  );

  const removeFromBuild = useCallback(
    (productType: CatalogProductType, partId: string, quantity?: number) => {
      setWorkspace((current) => {
        const singular = singularSlot[productType];
        if (singular) {
          if (current[singular] !== partId) {
            return current;
          }
          return { ...current, [singular]: undefined };
        }
        const multi = multiSlot[productType];
        if (!multi) {
          return current;
        }
        return {
          ...current,
          [multi.key]: subtractPart(current[multi.key], partId, quantity),
        };
      });
    },
    [],
  );

  const setQuantity = useCallback(
    (productType: CatalogProductType, partId: string, quantity: number) => {
      setWorkspace((current) => {
        const multi = multiSlot[productType];
        if (!multi) {
          return current;
        }
        return {
          ...current,
          [multi.key]: setPartQuantity(
            current[multi.key],
            multi.type,
            partId,
            quantity,
          ),
        };
      });
    },
    [],
  );

  const resetBuild = useCallback(() => {
    setWorkspace(emptyWorkspace);
  }, []);

  const applyDetail = useCallback((detail: PcBuildDetail) => {
    setWorkspace({
      ...toPcBuildDraft(detail),
      sourceId: detail.id,
      name: detail.name,
      description: detail.description,
      isPublic: detail.isPublic,
    });
  }, []);

  const value = useMemo<PcBuildContextValue>(
    () => ({
      ...workspace,
      addToBuild,
      removeFromBuild,
      setQuantity,
      resetBuild,
      applyDetail,
    }),
    [workspace, addToBuild, removeFromBuild, setQuantity, resetBuild, applyDetail],
  );

  return (
    <PcBuildContext.Provider value={value}>{children}</PcBuildContext.Provider>
  );
}