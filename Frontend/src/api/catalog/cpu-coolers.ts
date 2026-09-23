import { api } from "../client";
import {
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import type { CpuCoolerType, RadiatorLength } from "../enums";

export type CpuCoolerFilter = {
  manufacturerId?: string;
  name?: string;
  type?: CpuCoolerType;
  maxTdp?: RangeFilter;
  coolerHeightMm?: RangeFilter;
  maxRamHeightMm?: RangeFilter;
  radiatorLength?: RadiatorLength;
  socketId?: string;
  cpuId?: string;
  chassisId?: string;
  ramId?: string;
  motherboardId?: string;
};

export type CpuCoolerListParams = PagedRequest & {
  filter: CpuCoolerFilter;
};

export type CpuCoolerListItem = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  maxTdp: number;
  type: CpuCoolerType;
  coolerHeightMm?: number | null;
  maxRamHeightMm?: number | null;
  radiatorLength?: RadiatorLength | null;
};

export type CpuCoolerSocket = {
  socketId: string;
  socketName: string;
};

export type CpuCoolerDetail = CpuCoolerListItem & {
  sockets: CpuCoolerSocket[];
};

export const cpuCoolerKeys = {
  all: ["cpu-coolers"] as const,
  lists: () => [...cpuCoolerKeys.all, "list"] as const,
  list: (params: CpuCoolerListParams) =>
    [...cpuCoolerKeys.lists(), params] as const,
  details: () => [...cpuCoolerKeys.all, "detail"] as const,
  detail: (id: string) => [...cpuCoolerKeys.details(), id] as const,
};

export function isCpuCoolerFilterActive(filter: CpuCoolerFilter): boolean {
  return Boolean(
    filter.name?.trim() ||
    filter.manufacturerId ||
    filter.type ||
    hasCompleteRange(filter.maxTdp) ||
    hasCompleteRange(filter.coolerHeightMm) ||
    hasCompleteRange(filter.maxRamHeightMm) ||
    filter.radiatorLength ||
    filter.socketId ||
    filter.cpuId ||
    filter.chassisId ||
    filter.ramId ||
    filter.motherboardId,
  );
}

export function listCpuCoolers(params: CpuCoolerListParams) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: params.sortBy ?? "name",
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isCpuCoolerFilterActive(params.filter)) {
    return api
      .get<PagedResult<CpuCoolerListItem>>("/catalog/cpu-cooler", {
        params: paging,
      })
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<CpuCoolerListItem>>("/catalog/cpu-cooler/query", {
      ...paging,
      filter: toCpuCoolerFilterBody(params.filter),
    })
    .then((response) => response.data);
}

export function getCpuCoolerById(id: string) {
  return api
    .get<CpuCoolerDetail>(`/catalog/cpu-cooler/${id}`)
    .then((response) => response.data);
}

function toCpuCoolerFilterBody(filter: CpuCoolerFilter): CpuCoolerFilter {
  return {
    name: filter.name?.trim() || undefined,
    manufacturerId: filter.manufacturerId,
    type: filter.type,
    maxTdp: hasCompleteRange(filter.maxTdp) ? filter.maxTdp : undefined,
    coolerHeightMm: hasCompleteRange(filter.coolerHeightMm)
      ? filter.coolerHeightMm
      : undefined,
    maxRamHeightMm: hasCompleteRange(filter.maxRamHeightMm)
      ? filter.maxRamHeightMm
      : undefined,
    radiatorLength: filter.radiatorLength,
    socketId: filter.socketId,
    cpuId: filter.cpuId,
    chassisId: filter.chassisId,
    ramId: filter.ramId,
    motherboardId: filter.motherboardId,
  };
}
