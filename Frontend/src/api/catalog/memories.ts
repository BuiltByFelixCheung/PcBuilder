import { api } from "../client";
import {
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import type { DdrGeneration, RamRank, RamFormFactor } from "../enums";

export type MemoryFilter = {
  manufacturerId?: string;
  name?: string;
  color?: string;
  ddrGeneration?: DdrGeneration;
  ramFormFactor?: RamFormFactor;
  ramRank?: RamRank;
  memorySizePerStickGb?: number;
  totalMemorySizeGb?: number;
  modulesCount?: number;
  maxMemorySpeedMts?: number;
  heightMm?: RangeFilter;
  cpuId?: string;
  motherboardId?: string;
};

export type MemoryListParams = PagedRequest & {
  filter: MemoryFilter;
};

export type MemoryDetail = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  color: string;
  ddrGeneration: DdrGeneration;
  ramFormFactor: RamFormFactor;
  ramRank: RamRank;
  memorySizePerStickGb: number;
  totalMemorySizeGb: number;
  modulesCount: number;
  maxMemorySpeedMts: number;
  heightMm: number;
};

export const memoryKeys = {
  all: ["memories"] as const,
  lists: () => [...memoryKeys.all, "list"] as const,
  list: (params: MemoryListParams) => [...memoryKeys.lists(), params] as const,
  details: () => [...memoryKeys.all, "detail"] as const,
  detail: (id: string) => [...memoryKeys.details(), id] as const,
};

export function isMemoryFilterActive(filter: MemoryFilter): boolean {
  return Boolean(
    filter.name?.trim() ||
    filter.manufacturerId ||
    filter.color ||
    filter.ddrGeneration ||
    filter.ramFormFactor ||
    filter.ramRank ||
    filter.memorySizePerStickGb ||
    filter.totalMemorySizeGb ||
    filter.modulesCount ||
    filter.maxMemorySpeedMts ||
    hasCompleteRange(filter.heightMm) ||
    filter.cpuId ||
    filter.motherboardId,
  );
}

export function listMemories(params: MemoryListParams) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: params.sortBy ?? "name",
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isMemoryFilterActive(params.filter)) {
    return api
      .get<PagedResult<MemoryDetail>>("/catalog/ram", { params: paging })
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<MemoryDetail>>("/catalog/ram/query", {
      ...paging,
      filter: toMemoryFilterBody(params.filter),
    })
    .then((response) => response.data);
}

export function getMemoryById(id: string) {
  return api
    .get<MemoryDetail>(`/catalog/ram/${id}`)
    .then((response) => response.data);
}

function toMemoryFilterBody(filter: MemoryFilter): MemoryFilter {
  return {
    name: filter.name?.trim() || undefined,
    manufacturerId: filter.manufacturerId,
    color: filter.color,
    ddrGeneration: filter.ddrGeneration,
    ramFormFactor: filter.ramFormFactor,
    ramRank: filter.ramRank,
    memorySizePerStickGb: filter.memorySizePerStickGb,
    totalMemorySizeGb: filter.totalMemorySizeGb,
    modulesCount: filter.modulesCount,
    maxMemorySpeedMts: filter.maxMemorySpeedMts,
    heightMm: hasCompleteRange(filter.heightMm) ? filter.heightMm : undefined,
    cpuId: filter.cpuId,
    motherboardId: filter.motherboardId,
  };
}

export function updateMemories(memories: MemoryDetail[]) {
  return api
    .put("/catalog/ram/bulk", { memories })
    .then((response) => response.data);
}