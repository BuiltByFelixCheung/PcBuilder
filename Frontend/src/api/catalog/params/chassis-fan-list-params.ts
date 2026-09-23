import type { ChassisFanFilter, ChassisFanListParams } from "../chassis-fans";
import { emptyToUndefined, setSearchValue, toInteger } from "../../helper";
import type { FanDiameterMm } from "../../enums";
import { catalogPagingFromSearch, setPageSearch } from "./list-search";

export const emptyChassisFanFilter: ChassisFanFilter = {
  name: "",
};

export function chassisFanListParamsFromSearch(
  search: URLSearchParams,
): ChassisFanListParams {
  return {
    ...catalogPagingFromSearch(search),
    filter: {
      name: search.get("name") ?? "",
      manufacturerId: emptyToUndefined(search.get("manufacturerId")),
      diameterMm: emptyToUndefined(search.get("diameterMm")) as
        | FanDiameterMm
        | undefined,
      fansCountPerPack: toInteger(search.get("fansCountPerPack")),
      chassisId: emptyToUndefined(search.get("chassisId")),
    },
  };
}

export function chassisFanListSearchFromParams(
  params: ChassisFanListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;
  setPageSearch(search, params.pageIndex);
  setSearchValue(search, "name", filter.name?.trim());
  setSearchValue(search, "manufacturerId", filter.manufacturerId);
  setSearchValue(search, "diameterMm", filter.diameterMm);
  setSearchValue(search, "fansCountPerPack", filter.fansCountPerPack);
  setSearchValue(search, "chassisId", filter.chassisId);
  return search;
}
