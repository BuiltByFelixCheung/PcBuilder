import { type ProductType } from "../api/master-data";
import type { PcBuildDetail, PcBuildDraft } from "@/api/builds";

export type PcBuildWorkspace = PcBuildDraft & {
  sourceId: string | null;
  name: string;
  description: string;
  isPublic: boolean;
};

export type PcBuildContextValue = PcBuildWorkspace & {
  addToBuild: (
    productType: CatalogProductType,
    partId: string,
    quantity?: number,
  ) => void;
  removeFromBuild: (
    productType: CatalogProductType,
    partId: string,
    quantity?: number,
  ) => void;
  setQuantity: (
    productType: CatalogProductType,
    partId: string,
    quantity: number,
  ) => void;
  resetBuild: () => void;
  applyDetail: (detail: PcBuildDetail) => void;
};

export function builderHref(sourceId: string | null | undefined): string {
  return sourceId ? `/build/${sourceId}/edit` : "/build/current";
}

export function builderViewHref(id: string): string {
  return `/build/${id}`;
}

export type CatalogProductType = Exclude<
  ProductType,
  "chipset" | "socket" | "cpuseries" | "gpu" | "gpuseries"
>;

const MULTI_BUILD_PRODUCT_TYPES = new Set<CatalogProductType>([
  "chassisfan",
  "storagedrive",
  "wirednetworkadapter",
  "wirelessnetworkadapter",
]);

export function allowsBuildQuantity(productType: CatalogProductType): boolean {
  return MULTI_BUILD_PRODUCT_TYPES.has(productType);
}
