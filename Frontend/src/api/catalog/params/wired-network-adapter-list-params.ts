import type {
  WiredNetworkAdapterFilter,
  WiredNetworkAdapterListParams,
} from "../wired-network-adapters";
import {
  emptyToUndefined,
  parseRange,
  setSearchValue,
} from "../../helper";
import type {
  PcieSlotType,
  UsbType,
  UsbVersion,
  WiredHostInterface,
} from "../../enums";
import {
  catalogPagingFromSearch,
  setPageSearch,
  setSearchRange,
} from "./list-search";

export const emptyWiredNetworkAdapterFilter: WiredNetworkAdapterFilter = {
  name: "",
};

export function wiredNetworkAdapterListParamsFromSearch(
  search: URLSearchParams,
): WiredNetworkAdapterListParams {
  return {
    ...catalogPagingFromSearch(search),
    filter: {
      name: search.get("name") ?? "",
      manufacturerId: emptyToUndefined(search.get("manufacturerId")),
      hostInterface: emptyToUndefined(search.get("hostInterface")) as
        | WiredHostInterface
        | undefined,
      maxSpeedMbps: parseRange(
        search.get("maxSpeedMbpsMin"),
        search.get("maxSpeedMbpsMax"),
      ),
      usbVersion: emptyToUndefined(search.get("usbVersion")) as
        | UsbVersion
        | undefined,
      usbType: emptyToUndefined(search.get("usbType")) as UsbType | undefined,
      pcieSlotType: emptyToUndefined(search.get("pcieSlotType")) as
        | PcieSlotType
        | undefined,
      motherboardId: emptyToUndefined(search.get("motherboardId")),
    },
  };
}

export function wiredNetworkAdapterListSearchFromParams(
  params: WiredNetworkAdapterListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;
  setPageSearch(search, params.pageIndex);
  setSearchValue(search, "name", filter.name?.trim());
  setSearchValue(search, "manufacturerId", filter.manufacturerId);
  setSearchValue(search, "hostInterface", filter.hostInterface);
  setSearchRange(
    search,
    filter.maxSpeedMbps,
    "maxSpeedMbpsMin",
    "maxSpeedMbpsMax",
  );
  setSearchValue(search, "usbVersion", filter.usbVersion);
  setSearchValue(search, "usbType", filter.usbType);
  setSearchValue(search, "pcieSlotType", filter.pcieSlotType);
  setSearchValue(search, "motherboardId", filter.motherboardId);
  return search;
}
