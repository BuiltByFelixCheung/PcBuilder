import type { ChassisFilter, ChassisListParams } from "../chassis";
import { emptyToUndefined, parseRange } from "../../helper";
import { MB_FORM_FACTORS, type MbFormFactor } from "../../enums";
import { catalogPagingFromSearch, setSearchRange } from "./list-search";

export const emptyChassisFilter: ChassisFilter = {
  name: undefined,
};

export function chassisListParamsFromSearch(
  search: URLSearchParams,
): ChassisListParams {
  return {
    ...catalogPagingFromSearch(search),
    filter: filterFromSearch(search),
  };
}

export function chassisListSearchFromParams(
  params: ChassisListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;

  if (params.pageIndex > 0) search.set("page", String(params.pageIndex));
  if (filter.name?.trim()) search.set("name", filter.name.trim());
  if (filter.manufacturerId)
    search.set("manufacturerId", filter.manufacturerId);
  setSearchRange(search, filter.lengthMm, "lengthMmMin", "lengthMmMax");
  setSearchRange(search, filter.widthMm, "widthMmMin", "widthMmMax");
  setSearchRange(search, filter.heightMm, "heightMmMin", "heightMmMax");
  setSearchRange(
    search,
    filter.motherboardMaxWidthMm,
    "motherboardMaxWidthMmMin",
    "motherboardMaxWidthMmMax",
  );
  setSearchRange(
    search,
    filter.motherboardMaxHeightMm,
    "motherboardMaxHeightMmMin",
    "motherboardMaxHeightMmMax",
  );
  setSearchRange(
    search,
    filter.maxCpuCoolerHeightMm,
    "maxCpuCoolerHeightMmMin",
    "maxCpuCoolerHeightMmMax",
  );
  setSearchRange(
    search,
    filter.maxGraphicsCardLengthMm,
    "maxGraphicsCardLengthMmMin",
    "maxGraphicsCardLengthMmMax",
  );
  setSearchRange(
    search,
    filter.maxPsuLengthMm,
    "maxPsuLengthMmMin",
    "maxPsuLengthMmMax",
  );
  if (filter.maxSupportedMbFormFactor) {
    search.set("maxSupportedMbFormFactor", filter.maxSupportedMbFormFactor);
  }

  return search;
}

function filterFromSearch(search: URLSearchParams): ChassisFilter {
  return {
    name: emptyToUndefined(search.get("name")),
    manufacturerId: emptyToUndefined(search.get("manufacturerId")),
    lengthMm: parseRange(search.get("lengthMmMin"), search.get("lengthMmMax")),
    widthMm: parseRange(search.get("widthMmMin"), search.get("widthMmMax")),
    heightMm: parseRange(search.get("heightMmMin"), search.get("heightMmMax")),
    motherboardMaxWidthMm: parseRange(
      search.get("motherboardMaxWidthMmMin"),
      search.get("motherboardMaxWidthMmMax"),
    ),
    motherboardMaxHeightMm: parseRange(
      search.get("motherboardMaxHeightMmMin"),
      search.get("motherboardMaxHeightMmMax"),
    ),
    maxCpuCoolerHeightMm: parseRange(
      search.get("maxCpuCoolerHeightMmMin"),
      search.get("maxCpuCoolerHeightMmMax"),
    ),
    maxGraphicsCardLengthMm: parseRange(
      search.get("maxGraphicsCardLengthMmMin"),
      search.get("maxGraphicsCardLengthMmMax"),
    ),
    maxPsuLengthMm: parseRange(
      search.get("maxPsuLengthMmMin"),
      search.get("maxPsuLengthMmMax"),
    ),
    maxSupportedMbFormFactor: parseMbFormFactor(
      search.get("maxSupportedMbFormFactor"),
    ),
  };
}

function parseMbFormFactor(value: string | null): MbFormFactor | undefined {
  if (!value?.trim()) return undefined;
  return (MB_FORM_FACTORS as readonly string[]).includes(value)
    ? (value as MbFormFactor)
    : undefined;
}
