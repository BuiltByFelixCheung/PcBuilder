import { useQuery } from "@tanstack/react-query";
import {
  listProductPictures,
  productPictureKeys,
  type ProductType,
} from "@/api/catalog/pictures";

export function useProductPictures(productType: ProductType, productId: string) {
  return useQuery({
    queryKey: productPictureKeys.list(productType, productId),
    queryFn: () => listProductPictures(productType, productId),
    enabled: Boolean(productId),
  });
}
