import type {
  WirelessNetworkAdapterFilter,
  WirelessNetworkAdapterListParams,
} from "../wireless-network-adapters";
import { emptyToUndefined, parseRange, setSearchValue } from "../../helper";
import type {
  BluetoothVersion,
  M2FormFactor,
  M2Key,
  PcieSlotType,
  UsbType,
  UsbVersion,
  WifiStandard,
  WirelessHostInterface,
} from "../../enums";
import {
  catalogPagingFromSearch,
  setPageSearch,
  setSearchRange,
} from "./list-search";

export const emptyWirelessNetworkAdapterFilter: WirelessNetworkAdapterFilter = {
  name: "",
};

export function wirelessNetworkAdapterListParamsFromSearch(
  search: URLSearchParams,
): WirelessNetworkAdapterListParams {
  return {
    ...catalogPagingFromSearch(search),
    filter: {
      name: search.get("name") ?? "",
      manufacturerId: emptyToUndefined(search.get("manufacturerId")),
      wifiStandard: emptyToUndefined(search.get("wifiStandard")) as
        | WifiStandard
        | undefined,
      bluetoothVersion: emptyToUndefined(search.get("bluetoothVersion")) as
        | BluetoothVersion
        | undefined,
      hostInterface: emptyToUndefined(search.get("hostInterface")) as
        | WirelessHostInterface
        | undefined,
      maxSpeedMbps: parseRange(
        search.get("maxSpeedMbpsMin"),
        search.get("maxSpeedMbpsMax"),
      ),
      maxSpeedMbps5G: parseRange(
        search.get("maxSpeedMbps5GMin"),
        search.get("maxSpeedMbps5GMax"),
      ),
      maxSpeedMbps6G: parseRange(
        search.get("maxSpeedMbps6GMin"),
        search.get("maxSpeedMbps6GMax"),
      ),
      pcieSlotType: emptyToUndefined(search.get("pcieSlotType")) as
        | PcieSlotType
        | undefined,
      key: emptyToUndefined(search.get("key")) as M2Key | undefined,
      m2FormFactor: emptyToUndefined(search.get("m2FormFactor")) as
        | M2FormFactor
        | undefined,
      usbVersion: emptyToUndefined(search.get("usbVersion")) as
        | UsbVersion
        | undefined,
      usbType: emptyToUndefined(search.get("usbType")) as UsbType | undefined,
      motherboardId: emptyToUndefined(search.get("motherboardId")),
    },
  };
}

export function wirelessNetworkAdapterListSearchFromParams(
  params: WirelessNetworkAdapterListParams,
): URLSearchParams {
  const search = new URLSearchParams();
  const filter = params.filter;
  setPageSearch(search, params.pageIndex);
  setSearchValue(search, "name", filter.name?.trim());
  setSearchValue(search, "manufacturerId", filter.manufacturerId);
  setSearchValue(search, "wifiStandard", filter.wifiStandard);
  setSearchValue(search, "bluetoothVersion", filter.bluetoothVersion);
  setSearchValue(search, "hostInterface", filter.hostInterface);
  setSearchRange(
    search,
    filter.maxSpeedMbps,
    "maxSpeedMbpsMin",
    "maxSpeedMbpsMax",
  );
  setSearchRange(
    search,
    filter.maxSpeedMbps5G,
    "maxSpeedMbps5GMin",
    "maxSpeedMbps5GMax",
  );
  setSearchRange(
    search,
    filter.maxSpeedMbps6G,
    "maxSpeedMbps6GMin",
    "maxSpeedMbps6GMax",
  );
  setSearchValue(search, "pcieSlotType", filter.pcieSlotType);
  setSearchValue(search, "key", filter.key);
  setSearchValue(search, "m2FormFactor", filter.m2FormFactor);
  setSearchValue(search, "usbVersion", filter.usbVersion);
  setSearchValue(search, "usbType", filter.usbType);
  setSearchValue(search, "motherboardId", filter.motherboardId);
  return search;
}
