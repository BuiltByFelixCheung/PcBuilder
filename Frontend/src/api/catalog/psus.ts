import { api } from "../client";
import {
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import type { PsuCableType, PsuFormFactor, PsuModularity } from "../enums";

export type PsuFilter = {
  manufacturerId?: string;
  name?: string;
  wattage?: RangeFilter;
  modularity?: PsuModularity;
  formFactor?: PsuFormFactor;
  lengthMm?: RangeFilter;
  widthMm?: RangeFilter;
  heightMm?: RangeFilter;
  chassisId?: string;
  motherboardId?: string;
  graphicsCardId?: string;
  cpuId?: string;
};

export type PsuListParams = PagedRequest & {
  filter: PsuFilter;
};

export type PsuListItem = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  wattage: number;
  modularity: PsuModularity;
  formFactor: PsuFormFactor;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
};

export type PsuCable = {
  type: PsuCableType;
  cablesCount: number;
  connectorsCount: number;
};

export type PsuDetail = PsuListItem & {
  cables: PsuCable[];
};

export const psuKeys = {
  all: ["psus"] as const,
  lists: () => [...psuKeys.all, "list"] as const,
  list: (params: PsuListParams) => [...psuKeys.lists(), params] as const,
  details: () => [...psuKeys.all, "detail"] as const,
  detail: (id: string) => [...psuKeys.details(), id] as const,
};

export function isPsuFilterActive(filter: PsuFilter): boolean {
  return Boolean(
    filter.name?.trim() ||
      filter.manufacturerId ||
      hasCompleteRange(filter.wattage) ||
      filter.modularity ||
      filter.formFactor ||
      hasCompleteRange(filter.lengthMm) ||
      hasCompleteRange(filter.widthMm) ||
      hasCompleteRange(filter.heightMm) ||
      filter.chassisId ||
      filter.motherboardId ||
      filter.graphicsCardId ||
      filter.cpuId,
  );
}

export function listPsus(params: PsuListParams) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: params.sortBy ?? "name",
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isPsuFilterActive(params.filter)) {
    return api
      .get<PagedResult<PsuListItem>>("/catalog/psu", { params: paging })
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<PsuListItem>>("/catalog/psu/query", {
      ...paging,
      filter: toPsuFilterBody(params.filter),
    })
    .then((response) => response.data);
}

export function getPsuById(id: string) {
  return api.get<PsuDetail>(`/catalog/psu/${id}`).then((response) => response.data);
}

function toPsuFilterBody(filter: PsuFilter): PsuFilter {
  return {
    name: filter.name?.trim() || undefined,
    manufacturerId: filter.manufacturerId,
    wattage: hasCompleteRange(filter.wattage) ? filter.wattage : undefined,
    modularity: filter.modularity,
    formFactor: filter.formFactor,
    lengthMm: hasCompleteRange(filter.lengthMm) ? filter.lengthMm : undefined,
    widthMm: hasCompleteRange(filter.widthMm) ? filter.widthMm : undefined,
    heightMm: hasCompleteRange(filter.heightMm) ? filter.heightMm : undefined,
    chassisId: filter.chassisId,
    motherboardId: filter.motherboardId,
    graphicsCardId: filter.graphicsCardId,
    cpuId: filter.cpuId,
  };
}
