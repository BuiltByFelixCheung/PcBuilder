import { api } from "../client";
import {
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import type {
  BluetoothVersion,
  M2FormFactor,
  M2Key,
  PcieSlotType,
  UsbType,
  UsbVersion,
  WifiStandard,
  WirelessHostInterface,
} from "../enums";

export type WirelessNetworkAdapterFilter = {
  manufacturerId?: string;
  name?: string;
  wifiStandard?: WifiStandard;
  bluetoothVersion?: BluetoothVersion;
  hostInterface?: WirelessHostInterface;
  maxSpeedMbps?: RangeFilter;
  maxSpeedMbps5G?: RangeFilter;
  maxSpeedMbps6G?: RangeFilter;
  pcieSlotType?: PcieSlotType;
  key?: M2Key;
  m2FormFactor?: M2FormFactor;
  usbVersion?: UsbVersion;
  usbType?: UsbType;
  motherboardId?: string;
};

export type WirelessNetworkAdapterListParams = PagedRequest & {
  filter: WirelessNetworkAdapterFilter;
};

export type WirelessNetworkAdapter = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  wifiStandard: WifiStandard;
  bluetoothVersion?: BluetoothVersion | null;
  hostInterface: WirelessHostInterface;
  maxSpeedMbps: number;
  maxSpeedMbps5G?: number | null;
  maxSpeedMbps6G?: number | null;
  pcieSlotType?: PcieSlotType | null;
  key?: M2Key | null;
  m2FormFactor?: M2FormFactor | null;
  usbVersion?: UsbVersion | null;
  usbType?: UsbType | null;
};

export const wirelessNetworkAdapterKeys = {
  all: ["wireless-network-adapters"] as const,
  lists: () => [...wirelessNetworkAdapterKeys.all, "list"] as const,
  list: (params: WirelessNetworkAdapterListParams) =>
    [...wirelessNetworkAdapterKeys.lists(), params] as const,
  details: () => [...wirelessNetworkAdapterKeys.all, "detail"] as const,
  detail: (id: string) =>
    [...wirelessNetworkAdapterKeys.details(), id] as const,
};

export function isWirelessNetworkAdapterFilterActive(
  filter: WirelessNetworkAdapterFilter,
): boolean {
  return Boolean(
    filter.name?.trim() ||
    filter.manufacturerId ||
    filter.wifiStandard ||
    filter.bluetoothVersion ||
    filter.hostInterface ||
    hasCompleteRange(filter.maxSpeedMbps) ||
    hasCompleteRange(filter.maxSpeedMbps5G) ||
    hasCompleteRange(filter.maxSpeedMbps6G) ||
    filter.pcieSlotType ||
    filter.key ||
    filter.m2FormFactor ||
    filter.usbVersion ||
    filter.usbType ||
    filter.motherboardId,
  );
}

export function listWirelessNetworkAdapters(
  params: WirelessNetworkAdapterListParams,
) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: params.sortBy ?? "name",
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isWirelessNetworkAdapterFilterActive(params.filter)) {
    return api
      .get<PagedResult<WirelessNetworkAdapter>>(
        "/catalog/wireless-network-adapter",
        { params: paging },
      )
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<WirelessNetworkAdapter>>(
      "/catalog/wireless-network-adapter/query",
      {
        ...paging,
        filter: {
          name: params.filter.name?.trim() || undefined,
          manufacturerId: params.filter.manufacturerId,
          wifiStandard: params.filter.wifiStandard,
          bluetoothVersion: params.filter.bluetoothVersion,
          hostInterface: params.filter.hostInterface,
          maxSpeedMbps: hasCompleteRange(params.filter.maxSpeedMbps)
            ? params.filter.maxSpeedMbps
            : undefined,
          maxSpeedMbps5G: hasCompleteRange(params.filter.maxSpeedMbps5G)
            ? params.filter.maxSpeedMbps5G
            : undefined,
          maxSpeedMbps6G: hasCompleteRange(params.filter.maxSpeedMbps6G)
            ? params.filter.maxSpeedMbps6G
            : undefined,
          pcieSlotType: params.filter.pcieSlotType,
          key: params.filter.key,
          m2FormFactor: params.filter.m2FormFactor,
          usbVersion: params.filter.usbVersion,
          usbType: params.filter.usbType,
          motherboardId: params.filter.motherboardId,
        },
      },
    )
    .then((response) => response.data);
}

export function getWirelessNetworkAdapterById(id: string) {
  return api
    .get<WirelessNetworkAdapter>(`/catalog/wireless-network-adapter/${id}`)
    .then((response) => response.data);
}
