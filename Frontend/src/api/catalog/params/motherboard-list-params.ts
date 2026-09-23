import type { MotherboardFilter, MotherboardListParams } from "../motherboards";
import { hasCompleteRange, type RangeFilter } from "../../paging";
import { toInteger, emptyToUndefined, parseRange } from "../../helper";
import type { DdrGeneration, MbFormFactor, RamFormFactor } from "../../enums";
import { catalogPagingFromSearch } from "./list-search";

export const emptyMotherboardFilter: MotherboardFilter = {
  name: "",
};

export function motherboardListParamsFromSearch(
  search: URLSearchParams,
): MotherboardListParams {
  return {
    ...catalogPagingFromSearch(search),
    filter: filterFromSearch(search),
  };
}

export function motherboardListSearchFromParams(
  params: MotherboardListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;

  setSearchValue(search, "page", params.pageIndex > 0 ? params.pageIndex : undefined);
  setSearchValue(search, "name", filter.name?.trim());
  setSearchValue(search, "manufacturerId", filter.manufacturerId);
  setSearchValue(search, "socketId", filter.socketId);
  setSearchValue(search, "chipsetId", filter.chipsetId);
  setSearchValue(search, "ramSlots", filter.ramSlots);
  setSearchValue(search, "maxMemoryGb", filter.maxMemoryGb);
  setSearchValue(search, "maxDimmSizeGb", filter.maxDimmSizeGb);
  setSearchValue(search, "sataPorts", filter.sataPorts);
  setSearchValue(search, "fanConnectors", filter.fanConnectors);
  setSearchValue(search, "epsConnectors", filter.epsConnectors);
  setSearchRange(search, filter.widthMm, "widthMmMin", "widthMmMax");
  setSearchRange(search, filter.heightMm, "heightMmMin", "heightMmMax");
  setSearchValue(search, "ddrGeneration", filter.ddrGeneration);
  setSearchValue(search, "ramFormFactor", filter.ramFormFactor);
  setSearchValue(search, "formFactor", filter.formFactor);
  setSearchFlag(search, "wifiEnabled", filter.wifiEnabled);
  setSearchFlag(search, "bluetoothEnabled", filter.bluetoothEnabled);
  setSearchValue(search, "chassisId", filter.chassisId);

  return search;
}

function setSearchValue(
  search: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (!value) return;
  search.set(key, String(value));
}

function setSearchFlag(
  search: URLSearchParams,
  key: string,
  value: boolean | undefined,
) {
  if (value == null) return;
  search.set(key, String(value));
}

function setSearchRange(
  search: URLSearchParams,
  range: RangeFilter | undefined,
  minKey: string,
  maxKey: string,
) {
  if (!hasCompleteRange(range)) return;
  search.set(minKey, String(range.min));
  search.set(maxKey, String(range.max));
}

function filterFromSearch(search: URLSearchParams): MotherboardFilter {
  return {
    name: search.get("name") ?? "",
    manufacturerId: emptyToUndefined(search.get("manufacturerId")),
    socketId: emptyToUndefined(search.get("socketId")),
    chipsetId: emptyToUndefined(search.get("chipsetId")),
    ramSlots: toInteger(search.get("ramSlots")),
    maxMemoryGb: toInteger(search.get("maxMemoryGb")),
    maxDimmSizeGb: toInteger(search.get("maxDimmSizeGb")),
    sataPorts: toInteger(search.get("sataPorts")),
    fanConnectors: toInteger(search.get("fanConnectors")),
    epsConnectors: toInteger(search.get("epsConnectors")),
    widthMm: parseRange(search.get("widthMmMin"), search.get("widthMmMax")),
    heightMm: parseRange(search.get("heightMmMin"), search.get("heightMmMax")),
    ddrGeneration: emptyToUndefined(search.get("ddrGeneration")) as
      | DdrGeneration
      | undefined,
    ramFormFactor: emptyToUndefined(search.get("ramFormFactor")) as
      | RamFormFactor
      | undefined,
    formFactor: emptyToUndefined(search.get("formFactor")) as
      | MbFormFactor
      | undefined,
    wifiEnabled: parseOptionalBoolean(search.get("wifiEnabled")),
    bluetoothEnabled: parseOptionalBoolean(search.get("bluetoothEnabled")),
    chassisId: emptyToUndefined(search.get("chassisId")),
  };
}

function parseOptionalBoolean(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}
