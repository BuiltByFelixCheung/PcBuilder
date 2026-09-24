import { useQuery } from "@tanstack/react-query";
import {
  listCpuSeries,
  listSockets,
  masterDataKeys,
} from "@/api/master-data.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";

export function useCpuFilterOptions() {
  const manufacturers = useCatalogManufacturers("cpu");
  const sockets = useQuery({
    queryKey: masterDataKeys.sockets,
    queryFn: listSockets,
  });
  const series = useQuery({
    queryKey: masterDataKeys.cpuSeries,
    queryFn: listCpuSeries,
  });

  return {
    manufacturers,
    sockets: sockets.data ?? [],
    series: series.data ?? [],
  };
}
