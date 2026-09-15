import type { MotherboardFilter, MotherboardListParams } from "../motherboards";
import { hasCompleteRange } from "../../paging";
import { toInteger, emptyToUndefined, parseRange } from "../../helper";
import type { DdrGeneration, MbFormFactor, RamFormFactor } from "../../enums";

const PAGE_SIZE = 10;

export const emptyMotherboardFilter: MotherboardFilter = {
  name: "",
};

export function motherboardListParamsFromSearch(
  search: URLSearchParams,
): MotherboardListParams {
  return {
    pageIndex: Math.max(0, toInteger(search.get("page")) ?? 0),
    pageSize: PAGE_SIZE,
    sortBy: "name",
    sortDirection: "asc",
    filter: filterFromSearch(search),
  };
}

export function motherboardListSearchFromParams(
  params: MotherboardListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;

  if (params.pageIndex > 0) search.set("page", String(params.pageIndex));
  if (filter.name?.trim()) search.set("name", filter.name.trim());
  if (filter.manufacturerId)
    search.set("manufacturerId", filter.manufacturerId);
  if (filter.socketId) search.set("socketId", filter.socketId);
  if (filter.chipsetId) search.set("chipsetId", filter.chipsetId);
  if (filter.ramSlots) search.set("ramSlots", String(filter.ramSlots));
  if (filter.maxMemoryGb) search.set("maxMemoryGb", String(filter.maxMemoryGb));
  if (filter.maxDimmSizeGb)
    search.set("maxDimmSizeGb", String(filter.maxDimmSizeGb));
  if (filter.sataPorts) search.set("sataPorts", String(filter.sataPorts));
  if (filter.fanConnectors)
    search.set("fanConnectors", String(filter.fanConnectors));
  if (filter.epsConnectors)
    search.set("epsConnectors", String(filter.epsConnectors));
  if (hasCompleteRange(filter.widthMm)) {
    search.set("widthMmMin", String(filter.widthMm!.min));
    search.set("widthMmMax", String(filter.widthMm!.max));
  }
  if (hasCompleteRange(filter.heightMm)) {
    search.set("heightMmMin", String(filter.heightMm!.min));
    search.set("heightMmMax", String(filter.heightMm!.max));
  }
  if (filter.ddrGeneration) search.set("ddrGeneration", filter.ddrGeneration);
  if (filter.ramFormFactor) search.set("ramFormFactor", filter.ramFormFactor);
  if (filter.formFactor) search.set("formFactor", filter.formFactor);
  if (filter.wifiEnabled != null)
    search.set("wifiEnabled", String(filter.wifiEnabled));
  if (filter.bluetoothEnabled != null)
    search.set("bluetoothEnabled", String(filter.bluetoothEnabled));

  return search;
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
  };
}

function parseOptionalBoolean(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}
