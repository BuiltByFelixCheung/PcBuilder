import { useQuery } from "@tanstack/react-query";
import { listGpus, listGpuSeries, masterDataKeys } from "@/api/master-data.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";

export function useGraphicsCardFilterOptions() {
  const manufacturers = useCatalogManufacturers("graphicscard");
  const gpus = useQuery({
    queryKey: masterDataKeys.gpus,
    queryFn: listGpus,
  });
  const gpuSeries = useQuery({
    queryKey: masterDataKeys.gpuSeries,
    queryFn: listGpuSeries,
  });
  const gpuManufacturers = useCatalogManufacturers("gpu");
  return {
    manufacturers,
    gpus: gpus.data ?? [],
    gpuSeries: gpuSeries.data ?? [],
    gpuManufacturers,
  };
}
