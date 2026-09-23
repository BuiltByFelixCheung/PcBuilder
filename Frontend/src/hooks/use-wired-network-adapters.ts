import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getWiredNetworkAdapterById,
  listWiredNetworkAdapters,
  wiredNetworkAdapterKeys,
  type WiredNetworkAdapterListParams,
} from "@/api/catalog/wired-network-adapters";

export function useWiredNetworkAdapters(params: WiredNetworkAdapterListParams) {
  return useQuery({
    queryKey: wiredNetworkAdapterKeys.list(params),
    queryFn: () => listWiredNetworkAdapters(params),
    placeholderData: keepPreviousData,
  });
}

export function useWiredNetworkAdapter(id: string | undefined) {
  return useQuery({
    queryKey: wiredNetworkAdapterKeys.detail(id ?? ""),
    queryFn: () => getWiredNetworkAdapterById(id!),
    enabled: Boolean(id),
  });
}
