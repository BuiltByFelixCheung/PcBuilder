import {
  enumSelectBulkColumn,
  idSelectBulkColumn,
  nameBulkColumn,
  numberBulkColumn,
} from "@/components/BulkEditColumns";
import type { BulkEditColumn } from "@/components/BulkEditDialog";
import {
  enumSelectField,
  idSelectField,
  nameField,
  numberField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import type { WiredNetworkAdapter } from "@/api/catalog/wired-network-adapters";
import { toInteger } from "@/api/helper";
import {
  PCIE_SLOT_TYPES,
  USB_TYPES,
  USB_VERSIONS,
  WIRED_HOST_INTERFACES,
} from "@/api/enums";

export function WiredNetworkAdapterEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<WiredNetworkAdapter>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    enumSelectBulkColumn("Interface", "hostInterface", WIRED_HOST_INTERFACES),
    numberBulkColumn("Max speed (Mbps)", "maxSpeedMbps", {
      parse: toInteger,
      fallback: 0,
    }),
    enumSelectBulkColumn("USB version", "usbVersion", USB_VERSIONS, {
      empty: "null",
    }),
    enumSelectBulkColumn("USB type", "usbType", USB_TYPES, { empty: "keep" }),
    enumSelectBulkColumn("PCIe slot", "pcieSlotType", PCIE_SLOT_TYPES, {
      empty: "keep",
    }),
  ];
}

export function WiredNetworkAdapterFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<WiredNetworkAdapter>[] {
  return [
    nameField(),
    idSelectField("Manufacturer", "manufacturerId", manufacturers),
    enumSelectField("Interface", "hostInterface", WIRED_HOST_INTERFACES),
    numberField("Max speed (Mbps)", "maxSpeedMbps", {
      parse: toInteger,
      fallback: 0,
    }),
    enumSelectField("USB version", "usbVersion", USB_VERSIONS, {
      empty: "null",
    }),
    enumSelectField("USB type", "usbType", USB_TYPES, { empty: "keep" }),
    enumSelectField("PCIe slot", "pcieSlotType", PCIE_SLOT_TYPES, {
      empty: "keep",
    }),
  ];
}
