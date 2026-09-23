import { api } from "../client";
import {
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import type {
  PcieSlotType,
  UsbType,
  UsbVersion,
  WiredHostInterface,
} from "../enums";

export type WiredNetworkAdapterFilter = {
  manufacturerId?: string;
  name?: string;
  hostInterface?: WiredHostInterface;
  maxSpeedMbps?: RangeFilter;
  usbVersion?: UsbVersion;
  usbType?: UsbType;
  pcieSlotType?: PcieSlotType;
  motherboardId?: string;
};

export type WiredNetworkAdapterListParams = PagedRequest & {
  filter: WiredNetworkAdapterFilter;
};

export type WiredNetworkAdapter = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  hostInterface: WiredHostInterface;
  maxSpeedMbps: number;
  usbVersion?: UsbVersion | null;
  usbType?: UsbType | null;
  pcieSlotType?: PcieSlotType | null;
};

export const wiredNetworkAdapterKeys = {
  all: ["wired-network-adapters"] as const,
  lists: () => [...wiredNetworkAdapterKeys.all, "list"] as const,
  list: (params: WiredNetworkAdapterListParams) =>
    [...wiredNetworkAdapterKeys.lists(), params] as const,
  details: () => [...wiredNetworkAdapterKeys.all, "detail"] as const,
  detail: (id: string) => [...wiredNetworkAdapterKeys.details(), id] as const,
};

export function isWiredNetworkAdapterFilterActive(
  filter: WiredNetworkAdapterFilter,
): boolean {
  return Boolean(
    filter.name?.trim() ||
      filter.manufacturerId ||
      filter.hostInterface ||
      hasCompleteRange(filter.maxSpeedMbps) ||
      filter.usbVersion ||
      filter.usbType ||
      filter.pcieSlotType ||
      filter.motherboardId,
  );
}

export function listWiredNetworkAdapters(params: WiredNetworkAdapterListParams) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: params.sortBy ?? "name",
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isWiredNetworkAdapterFilterActive(params.filter)) {
    return api
      .get<PagedResult<WiredNetworkAdapter>>("/catalog/wired-network-adapter", {
        params: paging,
      })
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<WiredNetworkAdapter>>("/catalog/wired-network-adapter/query", {
      ...paging,
      filter: {
        name: params.filter.name?.trim() || undefined,
        manufacturerId: params.filter.manufacturerId,
        hostInterface: params.filter.hostInterface,
        maxSpeedMbps: hasCompleteRange(params.filter.maxSpeedMbps)
          ? params.filter.maxSpeedMbps
          : undefined,
        usbVersion: params.filter.usbVersion,
        usbType: params.filter.usbType,
        pcieSlotType: params.filter.pcieSlotType,
        motherboardId: params.filter.motherboardId,
      },
    })
    .then((response) => response.data);
}

export function getWiredNetworkAdapterById(id: string) {
  return api
    .get<WiredNetworkAdapter>(`/catalog/wired-network-adapter/${id}`)
    .then((response) => response.data);
}
