import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getWirelessNetworkAdapterById,
  listWirelessNetworkAdapters,
  wirelessNetworkAdapterKeys,
  type WirelessNetworkAdapterListParams,
} from "@/api/catalog/wireless-network-adapters";

export function useWirelessNetworkAdapters(
  params: WirelessNetworkAdapterListParams,
) {
  return useQuery({
    queryKey: wirelessNetworkAdapterKeys.list(params),
    queryFn: () => listWirelessNetworkAdapters(params),
    placeholderData: keepPreviousData,
  });
}

export function useWirelessNetworkAdapter(id: string | undefined) {
  return useQuery({
    queryKey: wirelessNetworkAdapterKeys.detail(id ?? ""),
    queryFn: () => getWirelessNetworkAdapterById(id!),
    enabled: Boolean(id),
  });
}
