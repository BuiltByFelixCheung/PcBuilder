import type {
  StorageDriveFilter,
  StorageDriveListParams,
} from "../storage-drives";
import { emptyToUndefined, parseRange, setSearchValue } from "../../helper";
import type {
  PcieGeneration,
  StorageFormFactor,
  StorageInterface,
  StorageMedia,
} from "../../enums";
import {
  catalogPagingFromSearch,
  setPageSearch,
  setSearchRange,
} from "./list-search";

export const emptyStorageDriveFilter: StorageDriveFilter = {
  name: "",
};

export function storageDriveListParamsFromSearch(
  search: URLSearchParams,
): StorageDriveListParams {
  return {
    ...catalogPagingFromSearch(search),
    filter: {
      name: search.get("name") ?? "",
      manufacturerId: emptyToUndefined(search.get("manufacturerId")),
      media: emptyToUndefined(search.get("media")) as StorageMedia | undefined,
      interface: emptyToUndefined(search.get("interface")) as
        StorageInterface | undefined,
      formFactor: emptyToUndefined(search.get("formFactor")) as
        StorageFormFactor | undefined,
      capacityGb: parseRange(
        search.get("capacityGbMin"),
        search.get("capacityGbMax"),
      ),
      pcieGeneration: emptyToUndefined(search.get("pcieGeneration")) as
        PcieGeneration | undefined,
      rpm: parseRange(search.get("rpmMin"), search.get("rpmMax")),
      motherboardId: emptyToUndefined(search.get("motherboardId")),
      chassisId: emptyToUndefined(search.get("chassisId")),
    },
  };
}

export function storageDriveListSearchFromParams(
  params: StorageDriveListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;
  setPageSearch(search, params.pageIndex);
  setSearchValue(search, "name", filter.name?.trim());
  setSearchValue(search, "manufacturerId", filter.manufacturerId);
  setSearchValue(search, "media", filter.media);
  setSearchValue(search, "interface", filter.interface);
  setSearchValue(search, "formFactor", filter.formFactor);
  setSearchRange(search, filter.capacityGb, "capacityGbMin", "capacityGbMax");
  setSearchValue(search, "pcieGeneration", filter.pcieGeneration);
  setSearchRange(search, filter.rpm, "rpmMin", "rpmMax");
  setSearchValue(search, "motherboardId", filter.motherboardId);
  setSearchValue(search, "chassisId", filter.chassisId);
  return search;
}
