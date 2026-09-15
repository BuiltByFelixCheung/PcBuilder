import { useQuery } from "@tanstack/react-query";
import {
  listChipsets,
  listManufacturersByProductType,
  listSockets,
  masterDataKeys,
} from "@/api/master-data.ts";

export function useMotherboardFilterOptions() {
  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("motherboard"),
    queryFn: () => listManufacturersByProductType("motherboard"),
  });
  const sockets = useQuery({
    queryKey: masterDataKeys.sockets,
    queryFn: listSockets,
  });
  const chipsets = useQuery({
    queryKey: masterDataKeys.chipsets,
    queryFn: listChipsets,
  });

  return {
    manufacturers: manufacturers.data ?? [],
    sockets: sockets.data ?? [],
    chipsets: chipsets.data ?? [],
  };
}
