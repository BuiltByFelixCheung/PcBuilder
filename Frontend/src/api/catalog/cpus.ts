import { api } from "../client";
import {
  catalogApiSortField,
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import { type DdrGeneration, type RamRank } from "../enums";

export type CpuFilter = {
  manufacturerId?: string;
  name?: string;
  socketId?: string;
  seriesId?: string;
  motherboardId?: string;
  powerConsumptionWatts?: RangeFilter;
  thermalDesignPower?: RangeFilter;
};

export type CpuListParams = PagedRequest & {
  filter: CpuFilter;
};

export type CpuListItem = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  seriesId: string;
  seriesName: string;
  socketId: string;
  socketName: string;
  maxMemoryGb: number;
  integratedGraphics: boolean;
  includedStockCooler: boolean;
  thermalDesignPower: number;
  powerConsumptionWatts: number;
};

export type CpuRamCompat = {
  ddrGeneration: DdrGeneration;
  ramModuleCount: number;
  ramRank: RamRank;
  maxSpeedMts: number;
};

export type CpuSupportChipset = {
  chipsetId: string;
  chipsetName: string;
  requiresBiosUpdate: boolean;
};

export type CpuDetail = CpuListItem & {
  ramCompats: CpuRamCompat[];
  supportChipsets: CpuSupportChipset[];
};

export const cpuKeys = {
  all: ["cpus"] as const,
  lists: () => [...cpuKeys.all, "list"] as const,
  list: (params: CpuListParams) => [...cpuKeys.lists(), params] as const,
  details: () => [...cpuKeys.all, "detail"] as const,
  detail: (id: string) => [...cpuKeys.details(), id] as const,
};

export function isCpuFilterActive(filter: CpuFilter): boolean {
  return Boolean(
    filter.name?.trim() ||
    filter.manufacturerId ||
    filter.socketId ||
    filter.seriesId ||
    filter.motherboardId ||
    hasCompleteRange(filter.powerConsumptionWatts) ||
    hasCompleteRange(filter.thermalDesignPower),
  );
}

export function listCpus(params: CpuListParams) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: catalogApiSortField(params.sortBy),
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isCpuFilterActive(params.filter)) {
    return api
      .get<PagedResult<CpuListItem>>("/catalog/cpu", { params: paging })
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<CpuListItem>>("/catalog/cpu/query", {
      ...paging,
      filter: toCpuFilterBody(params.filter),
    })
    .then((response) => response.data);
}

export function getCpuById(id: string) {
  return api
    .get<CpuDetail>(`/catalog/cpu/${id}`)
    .then((response) => response.data);
}

function toCpuFilterBody(filter: CpuFilter): CpuFilter {
  return {
    name: filter.name?.trim() || undefined,
    manufacturerId: filter.manufacturerId,
    socketId: filter.socketId,
    seriesId: filter.seriesId,
    motherboardId: filter.motherboardId,
    powerConsumptionWatts: hasCompleteRange(filter.powerConsumptionWatts)
      ? filter.powerConsumptionWatts
      : undefined,
    thermalDesignPower: hasCompleteRange(filter.thermalDesignPower)
      ? filter.thermalDesignPower
      : undefined,
  };
}

export function cpuListItem(detail: CpuDetail): CpuListItem {
  return {
    id: detail.id,
    name: detail.name,
    manufacturerId: detail.manufacturerId,
    manufacturerName: detail.manufacturerName,
    seriesId: detail.seriesId,
    seriesName: detail.seriesName,
    socketId: detail.socketId,
    socketName: detail.socketName,
    maxMemoryGb: detail.maxMemoryGb,
    integratedGraphics: detail.integratedGraphics,
    includedStockCooler: detail.includedStockCooler,
    thermalDesignPower: detail.thermalDesignPower,
    powerConsumptionWatts: detail.powerConsumptionWatts,
  };
}

export function updateCpus(cpus: CpuListItem[]) {
  return api.put("/catalog/cpu/bulk", { cpus }).then((response) => response.data);
}

export function updateCpu(cpu: CpuListItem) {
  return api
    .put("/catalog/cpu", cpu)
    .then((response) => response.data);
}

export function updateCpuRamCompats(cpuId: string, ramCompats: CpuRamCompat[]) {
  return api
    .put<CpuRamCompat[]>(`/catalog/cpu/${cpuId}/ram-compats`, ramCompats)
    .then((response) => response.data);
}

export function updateCpuSupportChipsets(cpuId: string, supportChipsets: CpuSupportChipset[]) {
  return api
    .put<CpuSupportChipset[]>(`/catalog/cpu/${cpuId}/support-chipsets`, supportChipsets)
    .then((response) => response.data);
}

export function createCpu(
  cpu: CpuListItem & {
    ramCompats: CpuRamCompat[];
    supportChipsets: CpuSupportChipset[];
  },
) {
  return api
    .post<{ id: string }>("/catalog/cpu", cpu)
    .then((response) => response.data);
}