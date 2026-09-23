import type { PsuFilter, PsuListParams } from "../psus";
import {
  emptyToUndefined,
  parseRange,
  setSearchValue,
} from "../../helper";
import type { PsuFormFactor, PsuModularity } from "../../enums";
import {
  catalogPagingFromSearch,
  setPageSearch,
  setSearchRange,
} from "./list-search";

export const emptyPsuFilter: PsuFilter = {
  name: "",
};

export function psuListParamsFromSearch(search: URLSearchParams): PsuListParams {
  return {
    ...catalogPagingFromSearch(search),
    filter: {
      name: search.get("name") ?? "",
      manufacturerId: emptyToUndefined(search.get("manufacturerId")),
      wattage: parseRange(search.get("wattageMin"), search.get("wattageMax")),
      modularity: emptyToUndefined(search.get("modularity")) as
        | PsuModularity
        | undefined,
      formFactor: emptyToUndefined(search.get("formFactor")) as
        | PsuFormFactor
        | undefined,
      lengthMm: parseRange(search.get("lengthMmMin"), search.get("lengthMmMax")),
      widthMm: parseRange(search.get("widthMmMin"), search.get("widthMmMax")),
      heightMm: parseRange(search.get("heightMmMin"), search.get("heightMmMax")),
      chassisId: emptyToUndefined(search.get("chassisId")),
      motherboardId: emptyToUndefined(search.get("motherboardId")),
      graphicsCardId: emptyToUndefined(search.get("graphicsCardId")),
      cpuId: emptyToUndefined(search.get("cpuId")),
    },
  };
}

export function psuListSearchFromParams(params: PsuListParams): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;
  setPageSearch(search, params.pageIndex);
  setSearchValue(search, "name", filter.name?.trim());
  setSearchValue(search, "manufacturerId", filter.manufacturerId);
  setSearchRange(search, filter.wattage, "wattageMin", "wattageMax");
  setSearchValue(search, "modularity", filter.modularity);
  setSearchValue(search, "formFactor", filter.formFactor);
  setSearchRange(search, filter.lengthMm, "lengthMmMin", "lengthMmMax");
  setSearchRange(search, filter.widthMm, "widthMmMin", "widthMmMax");
  setSearchRange(search, filter.heightMm, "heightMmMin", "heightMmMax");
  setSearchValue(search, "chassisId", filter.chassisId);
  setSearchValue(search, "motherboardId", filter.motherboardId);
  setSearchValue(search, "graphicsCardId", filter.graphicsCardId);
  setSearchValue(search, "cpuId", filter.cpuId);
  return search;
}
