import { api } from "../client";
import {
  hasCompleteRange,
  type PagedRequest,
  type PagedResult,
  type RangeFilter,
} from "../paging";
import type { PcieGeneration, PsuCableType } from "../enums";

export type GraphicsCardFilter = {
  manufacturerId?: string;
  name?: string;
  gpuId?: string;
  videoMemoryGb?: number;
  pcieSlotsUsed?: number;
  pcieGeneration?: PcieGeneration;
  isLowProfile?: boolean;
  lengthMm?: RangeFilter;
  widthMm?: RangeFilter;
  heightMm?: RangeFilter;
  powerConsumptionWatts?: RangeFilter;
  chassisId?: string;
  motherboardId?: string;
};

export type GraphicsCardListParams = PagedRequest & {
  filter: GraphicsCardFilter;
};

export type GraphicsCardListItem = {
  id: string;
  name: string;
  manufacturerId: string;
  manufacturerName: string;
  gpuId: string;
  gpuName: string;
  videoMemoryGb: number;
  pcieSlotsUsed: number;
  pcieGeneration: PcieGeneration;
  isLowProfile: boolean;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  powerConsumptionWatts: number;
  powerConnectorType: PsuCableType;
  powerConnectorCount: number;
};

export type GraphicsCardDetail = GraphicsCardListItem & {
  gpuManufacturerId: string;
  gpuManufacturerName: string;
  gpuSeriesId: string;
  gpuSeriesName: string;
};

export const graphicsCardKeys = {
  all: ["graphicscards"] as const,
  lists: () => [...graphicsCardKeys.all, "list"] as const,
  list: (params: GraphicsCardListParams) =>
    [...graphicsCardKeys.lists(), params] as const,
  details: () => [...graphicsCardKeys.all, "detail"] as const,
  detail: (id: string) => [...graphicsCardKeys.details(), id] as const,
};

export function isGraphicsCardFilterActive(
  filter: GraphicsCardFilter,
): boolean {
  return Boolean(
    filter.name?.trim() ||
    filter.manufacturerId ||
    filter.gpuId ||
    filter.videoMemoryGb ||
    filter.pcieSlotsUsed ||
    filter.pcieGeneration ||
    filter.isLowProfile != null ||
    hasCompleteRange(filter.lengthMm) ||
    hasCompleteRange(filter.widthMm) ||
    hasCompleteRange(filter.heightMm) ||
    hasCompleteRange(filter.powerConsumptionWatts) ||
    filter.chassisId ||
    filter.motherboardId,
  );
}

export function listGraphicsCards(params: GraphicsCardListParams) {
  const paging = {
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sortBy: params.sortBy ?? "name",
    sortDirection: params.sortDirection ?? "asc",
  };

  if (!isGraphicsCardFilterActive(params.filter)) {
    return api
      .get<
        PagedResult<GraphicsCardListItem>
      >("/catalog/graphics-card", { params: paging })
      .then((response) => response.data);
  }

  return api
    .post<PagedResult<GraphicsCardListItem>>("/catalog/graphics-card/query", {
      ...paging,
      filter: toGraphicsCardFilterBody(params.filter),
    })
    .then((response) => response.data);
}

export function getGraphicsCardById(id: string) {
  return api
    .get<GraphicsCardDetail>(`/catalog/graphics-card/${id}`)
    .then((response) => response.data);
}

function toGraphicsCardFilterBody(
  filter: GraphicsCardFilter,
): GraphicsCardFilter {
  return {
    name: filter.name?.trim() || undefined,
    manufacturerId: filter.manufacturerId,
    gpuId: filter.gpuId,
    videoMemoryGb: filter.videoMemoryGb,
    pcieSlotsUsed: filter.pcieSlotsUsed,
    pcieGeneration: filter.pcieGeneration,
    isLowProfile: filter.isLowProfile,
    lengthMm: hasCompleteRange(filter.lengthMm) ? filter.lengthMm : undefined,
    widthMm: hasCompleteRange(filter.widthMm) ? filter.widthMm : undefined,
    heightMm: hasCompleteRange(filter.heightMm) ? filter.heightMm : undefined,
    powerConsumptionWatts: hasCompleteRange(filter.powerConsumptionWatts)
      ? filter.powerConsumptionWatts
      : undefined,
    chassisId: filter.chassisId,
    motherboardId: filter.motherboardId,
  };
}
