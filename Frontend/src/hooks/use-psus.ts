import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getPsuById,
  listPsus,
  psuKeys,
  type PsuListParams,
} from "@/api/catalog/psus";

export function usePsus(params: PsuListParams) {
  return useQuery({
    queryKey: psuKeys.list(params),
    queryFn: () => listPsus(params),
    placeholderData: keepPreviousData,
  });
}

export function usePsu(id: string | undefined) {
  return useQuery({
    queryKey: psuKeys.detail(id ?? ""),
    queryFn: () => getPsuById(id!),
    enabled: Boolean(id),
  });
}
