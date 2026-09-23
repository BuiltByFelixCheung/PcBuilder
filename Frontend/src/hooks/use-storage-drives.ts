import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getStorageDriveById,
  listStorageDrives,
  storageDriveKeys,
  type StorageDriveListParams,
} from "@/api/catalog/storage-drives";

export function useStorageDrives(params: StorageDriveListParams) {
  return useQuery({
    queryKey: storageDriveKeys.list(params),
    queryFn: () => listStorageDrives(params),
    placeholderData: keepPreviousData,
  });
}

export function useStorageDrive(id: string | undefined) {
  return useQuery({
    queryKey: storageDriveKeys.detail(id ?? ""),
    queryFn: () => getStorageDriveById(id!),
    enabled: Boolean(id),
  });
}
