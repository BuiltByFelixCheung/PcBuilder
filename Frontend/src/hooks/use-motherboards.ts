import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getMotherboardById,
  listMotherboards,
  motherboardKeys,
  type MotherboardListParams,
} from "@/api/catalog/motherboards";

export function useMotherboards(params: MotherboardListParams) {
  return useQuery({
    queryKey: motherboardKeys.list(params),
    queryFn: () => listMotherboards(params),
    placeholderData: keepPreviousData,
  });
}

export function useMotherboard(id: string | undefined) {
  return useQuery({
    queryKey: motherboardKeys.detail(id ?? ""),
    queryFn: () => getMotherboardById(id!),
    enabled: Boolean(id),
  });
}
