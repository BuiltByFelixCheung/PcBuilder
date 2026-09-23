import { api } from "../client";
import type { PagedRequest, PagedResult } from "../paging";
import type { FanDiameterMm } from "../enums";

export type ChassisFanFilter = {
  manufacturerId?: string;
  name?: string;
  diameterMm?: FanDiameterMm;
  fansCountPerPack?: number;
  chassisId?: string;
};

export type ChassisFanListParams = PagedRequest & {
  filter: ChassisFanFilter;
};

export type ChassisFan = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  diameterMm: FanDiameterMm;
  fansCountPerPack: number;
};

export const chassisFanKeys = {
  all: ["chassis-fans"] as const,
  lists: () => [...chassisFanKeys.all, "list"] as const,
  list: (params: ChassisFanListParams) =>
    [...chassisFanKeys.lists(), params] as const,
  details: () => [...chassisFanKeys.all, "detail"] as const,
  detail: (id: string) => [...chassisFanKeys.details(), id] as const,
};

export function isChassisFanFilterActive(filter: ChassisFanFilter): boolean {
  return Boolean(
    filter.name?.trim() ||
    filter.manufacturerId ||
    filter.diameterMm ||
    filter.fansCountPerPack ||
    filter.chassisId,
  );
}

export function listChassisFans(params: ChassisFanListParams) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: params.sortBy ?? "name",
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isChassisFanFilterActive(params.filter)) {
    return api
      .get<PagedResult<ChassisFan>>("/catalog/chassis-fan", { params: paging })
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<ChassisFan>>("/catalog/chassis-fan/query", {
      ...paging,
      filter: {
        name: params.filter.name?.trim() || undefined,
        manufacturerId: params.filter.manufacturerId,
        diameterMm: params.filter.diameterMm,
        fansCountPerPack: params.filter.fansCountPerPack,
        chassisId: params.filter.chassisId,
      },
    })
    .then((response) => response.data);
}

export function getChassisFanById(id: string) {
  return api
    .get<ChassisFan>(`/catalog/chassis-fan/${id}`)
    .then((response) => response.data);
}
