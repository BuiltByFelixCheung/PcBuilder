import { useQuery } from "@tanstack/react-query";
import {
  listGpus,
  listGpuSeries,
  listManufacturersByProductType,
  masterDataKeys,
} from "@/api/master-data.ts";

export function useGraphicsCardFilterOptions() {
  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("graphicscard"),
    queryFn: () => listManufacturersByProductType("graphicscard"),
  });
  const gpus = useQuery({
    queryKey: masterDataKeys.gpus,
    queryFn: listGpus,
  });
  const gpuSeries = useQuery({
    queryKey: masterDataKeys.gpuSeries,
    queryFn: listGpuSeries,
  });
  const gpuManufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("gpu"),
    queryFn: () => listManufacturersByProductType("gpu"),
  });
  return {
    manufacturers: manufacturers.data ?? [],
    gpus: gpus.data ?? [],
    gpuSeries: gpuSeries.data ?? [],
    gpuManufacturers: gpuManufacturers.data ?? [],
  };
}
