import { useQuery } from "@tanstack/react-query";
import {
  listChipsets,
  listSockets,
  masterDataKeys,
} from "@/api/master-data.ts";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";

export function useMotherboardFilterOptions() {
  const manufacturers = useCatalogManufacturers("motherboard");
  const sockets = useQuery({
    queryKey: masterDataKeys.sockets,
    queryFn: listSockets,
  });
  const chipsets = useQuery({
    queryKey: masterDataKeys.chipsets,
    queryFn: listChipsets,
  });

  return {
    manufacturers,
    sockets: sockets.data ?? [],
    chipsets: chipsets.data ?? [],
  };
}
