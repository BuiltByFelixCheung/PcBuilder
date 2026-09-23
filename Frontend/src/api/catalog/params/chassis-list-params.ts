import type { ChassisFilter, ChassisListParams } from "../chassis";
import { hasCompleteRange } from "../../paging";
import { emptyToUndefined, parseRange } from "../../helper";
import { MB_FORM_FACTORS, type MbFormFactor } from "../../enums";
import { catalogPagingFromSearch } from "./list-search";

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
  if (hasCompleteRange(filter.motherboardMaxWidthMm)) {
    search.set(
      "motherboardMaxWidthMmMin",
      String(filter.motherboardMaxWidthMm!.min),
    );
    search.set(
      "motherboardMaxWidthMmMax",
      String(filter.motherboardMaxWidthMm!.max),
    );
  }
  if (hasCompleteRange(filter.motherboardMaxHeightMm)) {
    search.set(
      "motherboardMaxHeightMmMin",
      String(filter.motherboardMaxHeightMm!.min),
    );
    search.set(
      "motherboardMaxHeightMmMax",
      String(filter.motherboardMaxHeightMm!.max),
    );
  }
  if (hasCompleteRange(filter.maxCpuCoolerHeightMm)) {
    search.set(
      "maxCpuCoolerHeightMmMin",
      String(filter.maxCpuCoolerHeightMm!.min),
    );
    search.set(
      "maxCpuCoolerHeightMmMax",
      String(filter.maxCpuCoolerHeightMm!.max),
    );
  }
  if (hasCompleteRange(filter.maxGraphicsCardLengthMm)) {
    search.set(
      "maxGraphicsCardLengthMmMin",
      String(filter.maxGraphicsCardLengthMm!.min),
    );
    search.set(
      "maxGraphicsCardLengthMmMax",
      String(filter.maxGraphicsCardLengthMm!.max),
    );
  }
  if (hasCompleteRange(filter.maxPsuLengthMm)) {
    search.set("maxPsuLengthMmMin", String(filter.maxPsuLengthMm!.min));
    search.set("maxPsuLengthMmMax", String(filter.maxPsuLengthMm!.max));
  }
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
