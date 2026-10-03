import { api } from "../client";
import {
  catalogApiSortField,
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import type { CpuCoolerType, RadiatorClass } from "../enums";

export type CpuCoolerFilter = {
  manufacturerId?: string;
  name?: string;
  type?: CpuCoolerType;
  coolerHeightMm?: RangeFilter;
  maxRamHeightMm?: RangeFilter;
  radiatorClass?: RadiatorClass;
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
  type: CpuCoolerType;
  coolerLengthMm?: number | null;
  coolerWidthMm?: number | null;
  coolerHeightMm?: number | null;
  maxRamHeightMm?: number | null;
  radiatorClass?: RadiatorClass | null;
  radiatorLengthMm?: number | null;
  radiatorWidthMm?: number | null;
  radiatorHeightMm?: number | null;
  waterBlockLengthMm?: number | null;
  waterBlockWidthMm?: number | null;
  waterBlockHeightMm?: number | null;
  fanThicknessMm?: number | null;
  fanWidthMm?: number | null;
  fanHeightMm?: number | null;
  fanCount?: number | null;
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
    hasCompleteRange(filter.coolerHeightMm) ||
    hasCompleteRange(filter.maxRamHeightMm) ||
    filter.radiatorClass ||
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
    sortBy: catalogApiSortField(params.sortBy),
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
    coolerHeightMm: hasCompleteRange(filter.coolerHeightMm)
      ? filter.coolerHeightMm
      : undefined,
    maxRamHeightMm: hasCompleteRange(filter.maxRamHeightMm)
      ? filter.maxRamHeightMm
      : undefined,
    radiatorClass: filter.radiatorClass,
    socketId: filter.socketId,
    cpuId: filter.cpuId,
    chassisId: filter.chassisId,
    ramId: filter.ramId,
    motherboardId: filter.motherboardId,
  };
}

export function cpuCoolerListItem(detail: CpuCoolerDetail): CpuCoolerListItem {
  return {
    id: detail.id,
    name: detail.name,
    manufacturerId: detail.manufacturerId,
    manufacturerName: detail.manufacturerName,
    type: detail.type,
    coolerLengthMm: detail.coolerLengthMm,
    coolerWidthMm: detail.coolerWidthMm,
    coolerHeightMm: detail.coolerHeightMm,
    maxRamHeightMm: detail.maxRamHeightMm,
    radiatorClass: detail.radiatorClass,
    radiatorLengthMm: detail.radiatorLengthMm,
    radiatorWidthMm: detail.radiatorWidthMm,
    radiatorHeightMm: detail.radiatorHeightMm,
    waterBlockLengthMm: detail.waterBlockLengthMm,
    waterBlockWidthMm: detail.waterBlockWidthMm,
    waterBlockHeightMm: detail.waterBlockHeightMm,
    fanThicknessMm: detail.fanThicknessMm,
    fanWidthMm: detail.fanWidthMm,
    fanHeightMm: detail.fanHeightMm,
    fanCount: detail.fanCount,
  };
}

export function updateCpuCoolers(cpuCoolers: CpuCoolerListItem[]) {
  return api.put("/catalog/cpu-cooler/bulk", { cpuCoolers });
}

export function updateCpuCooler(cooler: CpuCoolerListItem) {
  return api
    .put("/catalog/cpu-cooler", cooler)
    .then((response) => response.data);
}

export function updateCpuCoolerSockets(
  cpuCoolerId: string,
  sockets: CpuCoolerSocket[],
) {
  return api
    .put<CpuCoolerSocket[]>(`/catalog/cpu-cooler/${cpuCoolerId}/socket`, sockets)
    .then((response) => response.data);
}

export function createCpuCooler(
  cooler: CpuCoolerListItem & { sockets: CpuCoolerSocket[] },
) {
  return api
    .post<{ id: string }>("/catalog/cpu-cooler", cooler)
    .then((response) => response.data);
}
