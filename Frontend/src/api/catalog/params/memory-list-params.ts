import type { MemoryFilter, MemoryListParams } from "../memories";
import { hasCompleteRange } from "../../paging";
import { toInteger, emptyToUndefined, parseRange } from "../../helper";
import type { DdrGeneration, RamRank, RamFormFactor } from "../../enums";
import { catalogPagingFromSearch } from "./list-search";

export const emptyMemoryFilter: MemoryFilter = {
  name: undefined,
};

export function memoryListParamsFromSearch(
  search: URLSearchParams,
): MemoryListParams {
  return {
    ...catalogPagingFromSearch(search),
    filter: filterFromSearch(search),
  };
}

export function memoryListSearchFromParams(
  params: MemoryListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;

  if (params.pageIndex > 0) search.set("page", String(params.pageIndex));
  if (filter.name?.trim()) search.set("name", filter.name.trim());
  if (filter.manufacturerId)
    search.set("manufacturerId", filter.manufacturerId);
  if (filter.color) search.set("color", filter.color);
  if (filter.ddrGeneration)
    search.set("ddrGeneration", filter.ddrGeneration.toString());
  if (filter.ramFormFactor) search.set("ramFormFactor", filter.ramFormFactor);
  if (filter.ramRank) search.set("ramRank", filter.ramRank.toString());
  if (filter.memorySizePerStickGb)
    search.set("memorySizePerStickGb", String(filter.memorySizePerStickGb));
  if (filter.totalMemorySizeGb)
    search.set("totalMemorySizeGb", String(filter.totalMemorySizeGb));
  if (filter.modulesCount)
    search.set("modulesCount", String(filter.modulesCount));
  if (filter.maxMemorySpeedMts)
    search.set("maxMemorySpeedMts", String(filter.maxMemorySpeedMts));
  if (hasCompleteRange(filter.heightMm)) {
    search.set("heightMmMin", String(filter.heightMm!.min));
    search.set("heightMmMax", String(filter.heightMm!.max));
  }
  if (filter.cpuId) search.set("cpuId", filter.cpuId);
  if (filter.motherboardId) search.set("motherboardId", filter.motherboardId);

  return search;
}

function filterFromSearch(search: URLSearchParams): MemoryFilter {
  return {
    name: emptyToUndefined(search.get("name")),
    manufacturerId: emptyToUndefined(search.get("manufacturerId")),
    color: emptyToUndefined(search.get("color")),
    ddrGeneration: search.get("ddrGeneration") as DdrGeneration,
    ramFormFactor: search.get("ramFormFactor") as RamFormFactor,
    ramRank: search.get("ramRank") as RamRank,
    memorySizePerStickGb: toInteger(search.get("memorySizePerStickGb")),
    totalMemorySizeGb: toInteger(search.get("totalMemorySizeGb")),
    modulesCount: toInteger(search.get("modulesCount")),
    maxMemorySpeedMts: toInteger(search.get("maxMemorySpeedMts")),
    heightMm: parseRange(search.get("heightMmMin"), search.get("heightMmMax")),
    cpuId: emptyToUndefined(search.get("cpuId")),
    motherboardId: emptyToUndefined(search.get("motherboardId")),
  };
}
