import { api } from "../client";
import {
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import type {
  DdrGeneration,
  MbFormFactor,
  M2FormFactor,
  M2Key,
  PcieGeneration,
  PcieSlotLane,
  PcieSlotType,
  RamFormFactor,
  UsbType,
  UsbVersion,
} from "../enums";

export type MotherboardFilter = {
  manufacturerId?: string;
  name?: string;
  socketId?: string;
  chipsetId?: string;
  ramSlots?: number;
  maxMemoryGb?: number;
  maxDimmSizeGb?: number;
  sataPorts?: number;
  fanConnectors?: number;
  epsConnectors?: number;
  widthMm?: RangeFilter;
  heightMm?: RangeFilter;
  ddrGeneration?: DdrGeneration;
  ramFormFactor?: RamFormFactor;
  formFactor?: MbFormFactor;
  wifiEnabled?: boolean;
  bluetoothEnabled?: boolean;
  chassisId?: string;
};

export type MotherboardListParams = PagedRequest & {
  filter: MotherboardFilter;
};

export type MotherboardListItem = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  socketId: string;
  socketName: string;
  chipsetId: string;
  chipsetName: string;
  ramSlots: number;
  maxMemoryGb: number;
  maxDimmSizeGb: number;
  sataPorts: number;
  fanConnectors: number;
  epsConnectors: number;
  widthMm: number;
  heightMm: number;
  ddrGeneration: DdrGeneration;
  ramFormFactor: RamFormFactor;
  formFactor: MbFormFactor;
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
};

export type MotherboardPcieSlot = {
  slotType: PcieSlotType;
  slotLanes: PcieSlotLane;
  generation: PcieGeneration;
  slotCount: number;
};

export type MotherboardM2Slot = {
  key: M2Key;
  pcieGeneration: PcieGeneration;
  slotCount: number;
  supportsSata: boolean;
  formFactors: M2FormFactor[];
};

export type MotherboardUsbPort = {
  usbVersion: UsbVersion;
  usbType: UsbType;
  portCount: number;
};

export type MotherboardDetail = MotherboardListItem & {
  pcieSlots: MotherboardPcieSlot[];
  m2Slots: MotherboardM2Slot[];
  usbPorts: MotherboardUsbPort[];
};

export const motherboardKeys = {
  all: ["motherboards"] as const,
  lists: () => [...motherboardKeys.all, "list"] as const,
  list: (params: MotherboardListParams) =>
    [...motherboardKeys.lists(), params] as const,
  details: () => [...motherboardKeys.all, "detail"] as const,
  detail: (id: string) => [...motherboardKeys.details(), id] as const,
};

export function isMotherboardFilterActive(filter: MotherboardFilter): boolean {
  return Boolean(
    filter.name?.trim() ||
    filter.manufacturerId ||
    filter.socketId ||
    filter.chipsetId ||
    filter.ramSlots ||
    filter.maxMemoryGb ||
    filter.maxDimmSizeGb ||
    filter.sataPorts ||
    filter.fanConnectors ||
    filter.epsConnectors ||
    hasCompleteRange(filter.widthMm) ||
    hasCompleteRange(filter.heightMm) ||
    filter.ddrGeneration ||
    filter.ramFormFactor ||
    filter.formFactor ||
    filter.wifiEnabled != null ||
    filter.bluetoothEnabled != null ||
    filter.chassisId,
  );
}

export function listMotherboards(params: MotherboardListParams) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: params.sortBy ?? "name",
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isMotherboardFilterActive(params.filter)) {
    return api
      .get<PagedResult<MotherboardListItem>>("/catalog/motherboard", {
        params: paging,
      })
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<MotherboardListItem>>("/catalog/motherboard/query", {
      ...paging,
      filter: toMotherboardFilterBody(params.filter),
    })
    .then((response) => response.data);
}

export function getMotherboardById(id: string) {
  return api
    .get<MotherboardDetail>(`/catalog/motherboard/${id}`)
    .then((response) => response.data);
}

function toMotherboardFilterBody(filter: MotherboardFilter): MotherboardFilter {
  return {
    name: filter.name?.trim() || undefined,
    manufacturerId: filter.manufacturerId,
    socketId: filter.socketId,
    chipsetId: filter.chipsetId,
    ramSlots: filter.ramSlots,
    maxMemoryGb: filter.maxMemoryGb,
    maxDimmSizeGb: filter.maxDimmSizeGb,
    sataPorts: filter.sataPorts,
    fanConnectors: filter.fanConnectors,
    epsConnectors: filter.epsConnectors,
    widthMm: hasCompleteRange(filter.widthMm) ? filter.widthMm : undefined,
    heightMm: hasCompleteRange(filter.heightMm) ? filter.heightMm : undefined,
    ddrGeneration: filter.ddrGeneration,
    ramFormFactor: filter.ramFormFactor,
    formFactor: filter.formFactor,
    wifiEnabled: filter.wifiEnabled,
    bluetoothEnabled: filter.bluetoothEnabled,
    chassisId: filter.chassisId,
  };
}
