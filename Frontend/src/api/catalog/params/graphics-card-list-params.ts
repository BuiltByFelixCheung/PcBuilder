import type {
  GraphicsCardFilter,
  GraphicsCardListParams,
} from "../graphics-cards";
import { hasCompleteRange } from "../../paging";
import {
  toInteger,
  emptyToUndefined,
  parseOptionalBoolean,
  parseRange,
  setSearchFlag,
} from "../../helper";
import type { PcieGeneration } from "../../enums";

const PAGE_SIZE = 10;

export const emptyGraphicsCardFilter: GraphicsCardFilter = {
  name: undefined,
};

export function graphicsCardListParamsFromSearch(
  search: URLSearchParams,
): GraphicsCardListParams {
  return {
    pageIndex: Math.max(0, toInteger(search.get("page")) ?? 0),
    pageSize: PAGE_SIZE,
    sortBy: "name",
    sortDirection: "asc",
    filter: filterFromSearch(search),
  };
}

export function graphicsCardListSearchFromParams(
  params: GraphicsCardListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;

  if (params.pageIndex > 0) search.set("page", String(params.pageIndex));
  if (filter.name?.trim()) search.set("name", filter.name.trim());
  if (filter.manufacturerId)
    search.set("manufacturerId", filter.manufacturerId);
  if (filter.gpuId) search.set("gpuId", filter.gpuId);
  if (filter.videoMemoryGb)
    search.set("videoMemoryGb", String(filter.videoMemoryGb));
  if (filter.pcieSlotsUsed)
    search.set("pcieSlotsUsed", String(filter.pcieSlotsUsed));
  if (filter.pcieGeneration)
    search.set("pcieGeneration", filter.pcieGeneration);
  setSearchFlag(search, "isLowProfile", filter.isLowProfile);
  if (hasCompleteRange(filter.lengthMm)) {
    search.set("lengthMmMin", String(filter.lengthMm!.min));
    search.set("lengthMmMax", String(filter.lengthMm!.max));
  }
  if (hasCompleteRange(filter.widthMm)) {
    search.set("widthMmMin", String(filter.widthMm!.min));
    search.set("widthMmMax", String(filter.widthMm!.max));
  }
  if (hasCompleteRange(filter.heightMm)) {
    search.set("heightMmMin", String(filter.heightMm!.min));
    search.set("heightMmMax", String(filter.heightMm!.max));
  }
  if (hasCompleteRange(filter.powerConsumptionWatts)) {
    search.set(
      "powerConsumptionWattsMin",
      String(filter.powerConsumptionWatts!.min),
    );
    search.set(
      "powerConsumptionWattsMax",
      String(filter.powerConsumptionWatts!.max),
    );
  }
  if (filter.chassisId) search.set("chassisId", filter.chassisId);
  if (filter.motherboardId) search.set("motherboardId", filter.motherboardId);

  return search;
}

function filterFromSearch(search: URLSearchParams): GraphicsCardFilter {
  return {
    name: emptyToUndefined(search.get("name")),
    manufacturerId: emptyToUndefined(search.get("manufacturerId")),
    gpuId: emptyToUndefined(search.get("gpuId")),
    videoMemoryGb: toInteger(search.get("videoMemoryGb")),
    pcieSlotsUsed: toInteger(search.get("pcieSlotsUsed")),
    pcieGeneration: emptyToUndefined(search.get("pcieGeneration")) as
      | PcieGeneration
      | undefined,
    isLowProfile: parseOptionalBoolean(search.get("isLowProfile")),
    lengthMm: parseRange(search.get("lengthMmMin"), search.get("lengthMmMax")),
    widthMm: parseRange(search.get("widthMmMin"), search.get("widthMmMax")),
    heightMm: parseRange(search.get("heightMmMin"), search.get("heightMmMax")),
    powerConsumptionWatts: parseRange(
      search.get("powerConsumptionWattsMin"),
      search.get("powerConsumptionWattsMax"),
    ),
    chassisId: emptyToUndefined(search.get("chassisId")),
    motherboardId: emptyToUndefined(search.get("motherboardId")),
  };
}
