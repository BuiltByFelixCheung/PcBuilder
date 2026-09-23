import type { CpuCoolerFilter, CpuCoolerListParams } from "../cpu-coolers";
import {
  emptyToUndefined,
  parseRange,
  setSearchValue,
} from "../../helper";
import type { CpuCoolerType, RadiatorLength } from "../../enums";
import {
  catalogPagingFromSearch,
  setPageSearch,
  setSearchRange,
} from "./list-search";

export const emptyCpuCoolerFilter: CpuCoolerFilter = {
  name: "",
};

export function cpuCoolerListParamsFromSearch(
  search: URLSearchParams,
): CpuCoolerListParams {
  return {
    ...catalogPagingFromSearch(search),
    filter: {
      name: search.get("name") ?? "",
      manufacturerId: emptyToUndefined(search.get("manufacturerId")),
      type: emptyToUndefined(search.get("type")) as CpuCoolerType | undefined,
      maxTdp: parseRange(search.get("maxTdpMin"), search.get("maxTdpMax")),
      coolerHeightMm: parseRange(
        search.get("coolerHeightMmMin"),
        search.get("coolerHeightMmMax"),
      ),
      maxRamHeightMm: parseRange(
        search.get("maxRamHeightMmMin"),
        search.get("maxRamHeightMmMax"),
      ),
      radiatorLength: emptyToUndefined(search.get("radiatorLength")) as
        | RadiatorLength
        | undefined,
      socketId: emptyToUndefined(search.get("socketId")),
      cpuId: emptyToUndefined(search.get("cpuId")),
      chassisId: emptyToUndefined(search.get("chassisId")),
      ramId: emptyToUndefined(search.get("ramId")),
      motherboardId: emptyToUndefined(search.get("motherboardId")),
    },
  };
}

export function cpuCoolerListSearchFromParams(
  params: CpuCoolerListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;
  setPageSearch(search, params.pageIndex);
  setSearchValue(search, "name", filter.name?.trim());
  setSearchValue(search, "manufacturerId", filter.manufacturerId);
  setSearchValue(search, "type", filter.type);
  setSearchRange(search, filter.maxTdp, "maxTdpMin", "maxTdpMax");
  setSearchRange(
    search,
    filter.coolerHeightMm,
    "coolerHeightMmMin",
    "coolerHeightMmMax",
  );
  setSearchRange(
    search,
    filter.maxRamHeightMm,
    "maxRamHeightMmMin",
    "maxRamHeightMmMax",
  );
  setSearchValue(search, "radiatorLength", filter.radiatorLength);
  setSearchValue(search, "socketId", filter.socketId);
  setSearchValue(search, "cpuId", filter.cpuId);
  setSearchValue(search, "chassisId", filter.chassisId);
  setSearchValue(search, "ramId", filter.ramId);
  setSearchValue(search, "motherboardId", filter.motherboardId);
  return search;
}
