import { api } from "../client";
import {
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import type {
  M2FormFactor,
  M2Key,
  PcieGeneration,
  StorageFormFactor,
  StorageInterface,
  StorageMedia,
} from "../enums";

export type StorageDriveFilter = {
  manufacturerId?: string;
  name?: string;
  media?: StorageMedia;
  interface?: StorageInterface;
  formFactor?: StorageFormFactor;
  capacityGb?: RangeFilter;
  pcieGeneration?: PcieGeneration;
  rpm?: RangeFilter;
  motherboardId?: string;
  chassisId?: string;
};

export type StorageDriveListParams = PagedRequest & {
  filter: StorageDriveFilter;
};

export type StorageDrive = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  media: StorageMedia;
  interface: StorageInterface;
  formFactor: StorageFormFactor;
  capacityGb: number;
  pcieGeneration?: PcieGeneration | null;
  rpm?: number | null;
  isM2: boolean;
  moduleKey?: M2Key | null;
  m2FormFactor?: M2FormFactor | null;
};

export const storageDriveKeys = {
  all: ["storage-drives"] as const,
  lists: () => [...storageDriveKeys.all, "list"] as const,
  list: (params: StorageDriveListParams) =>
    [...storageDriveKeys.lists(), params] as const,
  details: () => [...storageDriveKeys.all, "detail"] as const,
  detail: (id: string) => [...storageDriveKeys.details(), id] as const,
};

export function isStorageDriveFilterActive(
  filter: StorageDriveFilter,
): boolean {
  return Boolean(
    filter.name?.trim() ||
    filter.manufacturerId ||
    filter.media ||
    filter.interface ||
    filter.formFactor ||
    hasCompleteRange(filter.capacityGb) ||
    filter.pcieGeneration ||
    hasCompleteRange(filter.rpm) ||
    filter.motherboardId ||
    filter.chassisId,
  );
}

export function listStorageDrives(params: StorageDriveListParams) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: params.sortBy ?? "name",
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isStorageDriveFilterActive(params.filter)) {
    return api
      .get<PagedResult<StorageDrive>>("/catalog/storage-drive", {
        params: paging,
      })
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<StorageDrive>>("/catalog/storage-drive/query", {
      ...paging,
      filter: toStorageDriveFilterBody(params.filter),
    })
    .then((response) => response.data);
}

export function getStorageDriveById(id: string) {
  return api
    .get<StorageDrive>(`/catalog/storage-drive/${id}`)
    .then((response) => response.data);
}

function toStorageDriveFilterBody(
  filter: StorageDriveFilter,
): StorageDriveFilter {
  return {
    name: filter.name?.trim() || undefined,
    manufacturerId: filter.manufacturerId,
    media: filter.media,
    interface: filter.interface,
    formFactor: filter.formFactor,
    capacityGb: hasCompleteRange(filter.capacityGb)
      ? filter.capacityGb
      : undefined,
    pcieGeneration: filter.pcieGeneration,
    rpm: hasCompleteRange(filter.rpm) ? filter.rpm : undefined,
    motherboardId: filter.motherboardId,
    chassisId: filter.chassisId,
  };
}
