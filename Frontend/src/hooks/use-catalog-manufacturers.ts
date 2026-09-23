import { useQuery } from "@tanstack/react-query";
import {
  listManufacturersByProductType,
  listSockets,
  masterDataKeys,
  type ProductType,
} from "@/api/master-data.ts";

export function useCatalogManufacturers(productType: ProductType) {
  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType(productType),
    queryFn: () => listManufacturersByProductType(productType),
  });

  return manufacturers.data ?? [];
}

export function useCatalogSockets() {
  const sockets = useQuery({
    queryKey: masterDataKeys.sockets,
    queryFn: listSockets,
  });

  return sockets.data ?? [];
}
