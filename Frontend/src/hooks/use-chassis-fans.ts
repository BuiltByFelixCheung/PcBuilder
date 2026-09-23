import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  chassisFanKeys,
  getChassisFanById,
  listChassisFans,
  type ChassisFanListParams,
} from "@/api/catalog/chassis-fans";

export function useChassisFans(params: ChassisFanListParams) {
  return useQuery({
    queryKey: chassisFanKeys.list(params),
    queryFn: () => listChassisFans(params),
    placeholderData: keepPreviousData,
  });
}

export function useChassisFan(id: string | undefined) {
  return useQuery({
    queryKey: chassisFanKeys.detail(id ?? ""),
    queryFn: () => getChassisFanById(id!),
    enabled: Boolean(id),
  });
}
