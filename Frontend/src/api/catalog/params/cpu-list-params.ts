import type { CpuFilter, CpuListParams } from "@/api/catalog/cpus";
import { emptyToUndefined, parseRange } from "../../helper";
import {
  catalogPagingFromSearch,
  setCatalogSortSearch,
  setSearchRange,
} from "./list-search";

export const emptyCpuFilter: CpuFilter = {
  name: "",
};

export function cpuListParamsFromSearch(
  search: URLSearchParams,
): CpuListParams {
  return {
    ...catalogPagingFromSearch(search),
    filter: filterFromSearch(search),
  };
}

export function cpuListSearchFromParams(
  params: CpuListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;
  setCatalogSortSearch(search, params);

  if (params.pageIndex > 0) search.set("page", String(params.pageIndex));
  if (filter.name?.trim()) search.set("name", filter.name.trim());
  if (filter.manufacturerId)
    search.set("manufacturerId", filter.manufacturerId);
  if (filter.socketId) search.set("socketId", filter.socketId);
  if (filter.seriesId) search.set("seriesId", filter.seriesId);
  if (filter.motherboardId) search.set("motherboardId", filter.motherboardId);
  setSearchRange(search, filter.thermalDesignPower, "tdpMin", "tdpMax");
  setSearchRange(search, filter.powerConsumptionWatts, "powerMin", "powerMax");

  return search;
}

function filterFromSearch(search: URLSearchParams): CpuFilter {
  return {
    name: search.get("name") ?? "",
    manufacturerId: emptyToUndefined(search.get("manufacturerId")),
    socketId: emptyToUndefined(search.get("socketId")),
    seriesId: emptyToUndefined(search.get("seriesId")),
    motherboardId: emptyToUndefined(search.get("motherboardId")),
    thermalDesignPower: parseRange(search.get("tdpMin"), search.get("tdpMax")),
    powerConsumptionWatts: parseRange(
      search.get("powerMin"),
      search.get("powerMax"),
    ),
  };
}
