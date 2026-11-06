import { api } from "../client";

export const productTypes = [
  "Chassis",
  "ChassisFan",
  "Chipset",
  "Cpu",
  "CpuCooler",
  "CpuSeries",
  "Gpu",
  "GpuSeries",
  "GraphicsCard",
  "Motherboard",
  "Psu",
  "Ram",
  "Socket",
  "StorageDrive",
  "WiredNetworkAdapter",
  "WirelessNetworkAdapter",
] as const;

export type ProductType = (typeof productTypes)[number];

export type ProductPicture = {
  id: string;
  productType: ProductType;
  productId: string;
};

export const productPictureKeys = {
  list: (productType: ProductType, productId: string) =>
    ["product-pictures", productType, productId] as const,
};

export function productPictureContentUrl(id: string) {
  return `/api/catalog/pictures/${id}/content`;
}

export async function listProductPictures(
  productType: ProductType,
  productId: string,
) {
  const { data } = await api.get<ProductPicture[]>("/catalog/pictures", {
    params: { productType, productId },
  });
  return data;
}

export async function uploadProductPicture(
  productType: ProductType,
  productId: string,
  file: File,
) {
  const body = new FormData();
  body.append("productType", productType);
  body.append("productId", productId);
  body.append("file", file);
  const { data } = await api.post<ProductPicture>("/catalog/pictures", body);
  return data;
}

export async function deleteProductPicture(id: string) {
  await api.delete(`/catalog/pictures/${id}`);
}
