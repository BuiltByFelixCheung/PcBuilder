import { api } from "../client";
import {
  catalogApiSortField,
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import type {
  MbFormFactor,
  FanMountLocation,
  FanDiameterMm,
  DriveBayFormFactor,
  PcieSlotOrientation,
  RadiatorMountLocation,
  PsuFormFactor,
  RadiatorClass,
} from "../enums";

export type ChassisFilter = {
  manufacturerId?: string;
  name?: string;
  lengthMm?: RangeFilter;
  widthMm?: RangeFilter;
  heightMm?: RangeFilter;
  motherboardMaxWidthMm?: RangeFilter;
  motherboardMaxHeightMm?: RangeFilter;
  maxCpuCoolerHeightMm?: RangeFilter;
  maxGraphicsCardLengthMm?: RangeFilter;
  maxPsuLengthMm?: RangeFilter;
  maxSupportedMbFormFactor?: MbFormFactor;
};

export type ChassisListParams = PagedRequest & {
  filter: ChassisFilter;
};

export type ChassisListItem = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  motherboardMaxWidthMm: number;
  motherboardMaxHeightMm: number;
  maxCpuCoolerHeightMm: number;
  maxGraphicsCardLengthMm: number;
  maxPsuLengthMm: number;
};

export type ChassisDetail = ChassisListItem & {
  fanMounts: ChassisFanMount[];
  driveBays: ChassisDriveBay[];
  pcieSlots: ChassisPcieSlot[];
  radiators: ChassisRadiator[];
  psuFormFactors: PsuFormFactor[];
  mbFormFactors: MbFormFactor[];
};

export type ChassisFanMount = {
  location: FanMountLocation;
  singleDiameterOnly: boolean;
  options: ChassisFanMountOption[];
};

export type ChassisFanMountOption = {
  diameter: FanDiameterMm;
  slotCount: number;
};

export type ChassisDriveBay = {
  formFactors: DriveBayFormFactor[];
  slotCount: number;
};

export type ChassisPcieSlot = {
  lowProfileSlots: boolean;
  slotCount: number;
  orientation: PcieSlotOrientation;
};

export type ChassisRadiator = {
  length: RadiatorClass;
  location: RadiatorMountLocation;
  radiatorCount: number;
};

export const chassisKeys = {
  all: ["chassis"] as const,
  lists: () => [...chassisKeys.all, "list"] as const,
  list: (params: ChassisListParams) =>
    [...chassisKeys.lists(), params] as const,
  details: () => [...chassisKeys.all, "detail"] as const,
  detail: (id: string) => [...chassisKeys.details(), id] as const,
};

export function isChassisFilterActive(filter: ChassisFilter): boolean {
  return Boolean(
    filter.name?.trim() ||
    filter.manufacturerId ||
    hasCompleteRange(filter.lengthMm) ||
    hasCompleteRange(filter.widthMm) ||
    hasCompleteRange(filter.heightMm) ||
    hasCompleteRange(filter.motherboardMaxWidthMm) ||
    hasCompleteRange(filter.motherboardMaxHeightMm) ||
    hasCompleteRange(filter.maxCpuCoolerHeightMm) ||
    hasCompleteRange(filter.maxGraphicsCardLengthMm) ||
    hasCompleteRange(filter.maxPsuLengthMm) ||
    Boolean(filter.maxSupportedMbFormFactor),
  );
}

export function listChassis(params: ChassisListParams) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: catalogApiSortField(params.sortBy),
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isChassisFilterActive(params.filter)) {
    return api
      .get<PagedResult<ChassisListItem>>("/catalog/chassis", { params: paging })
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<ChassisListItem>>("/catalog/chassis/query", {
      ...paging,
      filter: toChassisFilterBody(params.filter),
    })
    .then((response) => response.data);
}

export function getChassisById(id: string) {
  return api
    .get<ChassisDetail>(`/catalog/chassis/${id}`)
    .then((response) => response.data);
}

function toChassisFilterBody(filter: ChassisFilter): ChassisFilter {
  return {
    name: filter.name?.trim() || undefined,
    manufacturerId: filter.manufacturerId,
    lengthMm: hasCompleteRange(filter.lengthMm) ? filter.lengthMm : undefined,
    widthMm: hasCompleteRange(filter.widthMm) ? filter.widthMm : undefined,
    heightMm: hasCompleteRange(filter.heightMm) ? filter.heightMm : undefined,
    motherboardMaxWidthMm: hasCompleteRange(filter.motherboardMaxWidthMm)
      ? filter.motherboardMaxWidthMm
      : undefined,
    motherboardMaxHeightMm: hasCompleteRange(filter.motherboardMaxHeightMm)
      ? filter.motherboardMaxHeightMm
      : undefined,
    maxCpuCoolerHeightMm: hasCompleteRange(filter.maxCpuCoolerHeightMm)
      ? filter.maxCpuCoolerHeightMm
      : undefined,
    maxGraphicsCardLengthMm: hasCompleteRange(filter.maxGraphicsCardLengthMm)
      ? filter.maxGraphicsCardLengthMm
      : undefined,
    maxPsuLengthMm: hasCompleteRange(filter.maxPsuLengthMm)
      ? filter.maxPsuLengthMm
      : undefined,
    maxSupportedMbFormFactor: filter.maxSupportedMbFormFactor,
  };
}

const chassisChildKeys = [
  "fanMounts",
  "driveBays",
  "pcieSlots",
  "radiators",
  "psuFormFactors",
  "mbFormFactors",
] as const satisfies readonly (keyof ChassisDetail)[];

export function chassisListItem(detail: ChassisDetail): ChassisListItem {
  const item = { ...detail };
  for (const key of chassisChildKeys) delete item[key];
  return item;
}

export function updateChassis(item: ChassisListItem) {
  return api
    .put<ChassisDetail>("/catalog/chassis", item)
    .then((response) => response.data);
}

export function updateMultipleChassis(chassis: ChassisListItem[]) {
  return api.put("/catalog/chassis/bulk", { items: chassis });
}

export function updateChassisDriveBays(
  id: string,
  driveBays: ChassisDriveBay[],
) {
  return api
    .put<ChassisDriveBay[]>(`/catalog/chassis/${id}/drive-bay`, driveBays)
    .then((response) => response.data);
}

export function updateChassisRadiators(
  id: string,
  radiators: ChassisRadiator[],
) {
  return api
    .put<ChassisRadiator[]>(`/catalog/chassis/${id}/radiator`, radiators)
    .then((response) => response.data);
}

export function updateChassisFanMounts(
  id: string,
  fanMounts: ChassisFanMount[],
) {
  return api
    .put<ChassisFanMount[]>(`/catalog/chassis/${id}/fan-mount`, fanMounts)
    .then((response) => response.data);
}

export function updateChassisPcieSlots(id: string, pcieSlots: ChassisPcieSlot[]) {
  return api
    .put<ChassisPcieSlot[]>(`/catalog/chassis/${id}/pcie-slot`, pcieSlots)
    .then((response) => response.data);
}

export function updateChassisMbFormFactors(
  id: string,
  mbFormFactors: MbFormFactor[],
) {
  return api
    .put<MbFormFactor[]>(`/catalog/chassis/${id}/mb-form-factor`, mbFormFactors)
    .then((response) => response.data);
}

export function updateChassisPsuFormFactors(
  id: string,
  psuFormFactors: PsuFormFactor[],
) {
  return api
    .put<PsuFormFactor[]>(
      `/catalog/chassis/${id}/psu-form-factor`,
      psuFormFactors,
    )
    .then((response) => response.data);
}

export function createChassis(
  chassis: ChassisListItem & {
    fanMounts: ChassisFanMount[];
    driveBays: ChassisDriveBay[];
    pcieSlots: ChassisPcieSlot[];
    radiators: ChassisRadiator[];
    psuFormFactors: PsuFormFactor[];
    mbFormFactors: MbFormFactor[];
  },
) {
  return api
    .post<{ id: string }>("/catalog/chassis", chassis)
    .then((response) => response.data);
}
