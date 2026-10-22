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
import { enumText, ui } from "@/i18n/translate-enum";

export function WiredNetworkAdapterEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<WiredNetworkAdapter>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
    enumSelectBulkColumn(ui.label("interface"), "hostInterface", WIRED_HOST_INTERFACES, {
      label: enumText.ethernetInterface,
    }),
    numberBulkColumn(ui.label("maxSpeedMbps"), "maxSpeedMbps", {
      parse: toInteger,
      fallback: 0,
    }),
    enumSelectBulkColumn(ui.label("usbVersion"), "usbVersion", USB_VERSIONS, {
      empty: "null",
      label: enumText.usbVersion,
    }),
    enumSelectBulkColumn(ui.label("usbType"), "usbType", USB_TYPES, {
      empty: "keep",
      label: enumText.usbType,
    }),
    enumSelectBulkColumn(ui.label("pcieSlot"), "pcieSlotType", PCIE_SLOT_TYPES, {
      empty: "keep",
    }),
  ];
}

export function WiredNetworkAdapterFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<WiredNetworkAdapter>[] {
  return [
    nameField(),
    idSelectField(ui.label("manufacturer"), "manufacturerId", manufacturers),
    enumSelectField(ui.label("interface"), "hostInterface", WIRED_HOST_INTERFACES, {
      label: enumText.ethernetInterface,
    }),
    numberField(ui.label("maxSpeedMbps"), "maxSpeedMbps", {
      parse: toInteger,
      fallback: 0,
    }),
    enumSelectField(ui.label("usbVersion"), "usbVersion", USB_VERSIONS, {
      empty: "null",
      label: enumText.usbVersion,
    }),
    enumSelectField(ui.label("usbType"), "usbType", USB_TYPES, {
      empty: "keep",
      label: enumText.usbType,
    }),
    enumSelectField(ui.label("pcieSlot"), "pcieSlotType", PCIE_SLOT_TYPES, {
      empty: "keep",
    }),
  ];
}
