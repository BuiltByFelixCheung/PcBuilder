import { useQuery } from "@tanstack/react-query";
import {
  listCpuSeries,
  listManufacturersByProductType,
  listSockets,
  masterDataKeys,
} from "@/api/master-data.ts";

export function useCpuFilterOptions() {
  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("cpu"),
    queryFn: () => listManufacturersByProductType("cpu"),
  });
  const sockets = useQuery({
    queryKey: masterDataKeys.sockets,
    queryFn: listSockets,
  });
  const series = useQuery({
    queryKey: masterDataKeys.cpuSeries,
    queryFn: listCpuSeries,
  });

  return {
    manufacturers: manufacturers.data ?? [],
    sockets: sockets.data ?? [],
    series: series.data ?? [],
  };
}
