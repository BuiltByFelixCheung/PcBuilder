import type {
  GraphicsCardFilter,
  GraphicsCardListParams,
} from "../graphics-cards";
import type { PcieGeneration } from "../../enums";
import {
  toInteger,
  emptyToUndefined,
  parseOptionalBoolean,
  parseRange,
  setSearchFlag,
} from "../../helper";
import { catalogPagingFromSearch, setSearchRange } from "./list-search";

export const emptyGraphicsCardFilter: GraphicsCardFilter = {
  name: undefined,
};

export function graphicsCardListParamsFromSearch(
  search: URLSearchParams,
): GraphicsCardListParams {
  return {
    ...catalogPagingFromSearch(search),
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
  setSearchRange(search, filter.lengthMm, "lengthMmMin", "lengthMmMax");
  setSearchRange(search, filter.widthMm, "widthMmMin", "widthMmMax");
  setSearchRange(search, filter.heightMm, "heightMmMin", "heightMmMax");
  setSearchRange(
    search,
    filter.powerConsumptionWatts,
    "powerConsumptionWattsMin",
    "powerConsumptionWattsMax",
  );
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
      PcieGeneration | undefined,
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
