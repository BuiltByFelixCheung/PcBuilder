import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  cpuCoolerKeys,
  getCpuCoolerById,
  listCpuCoolers,
  type CpuCoolerListParams,
} from "@/api/catalog/cpu-coolers";

export function useCpuCoolers(params: CpuCoolerListParams) {
  return useQuery({
    queryKey: cpuCoolerKeys.list(params),
    queryFn: () => listCpuCoolers(params),
    placeholderData: keepPreviousData,
  });
}

export function useCpuCooler(id: string | undefined) {
  return useQuery({
    queryKey: cpuCoolerKeys.detail(id ?? ""),
    queryFn: () => getCpuCoolerById(id!),
    enabled: Boolean(id),
  });
}
