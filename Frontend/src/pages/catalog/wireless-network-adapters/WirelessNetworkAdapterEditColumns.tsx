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
import type { WirelessNetworkAdapter } from "@/api/catalog/wireless-network-adapters";
import { toInteger } from "@/api/helper";
import {
  BLUETOOTH_VERSIONS,
  M2_FORM_FACTORS,
  M2_KEYS,
  PCIE_SLOT_TYPES,
  USB_TYPES,
  USB_VERSIONS,
  WIFI_STANDARDS,
  WIRELESS_HOST_INTERFACES,
} from "@/api/enums";
import { enumText, ui } from "@/i18n/translate-enum";

export function WirelessNetworkAdapterEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<WirelessNetworkAdapter>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
    enumSelectBulkColumn(ui.label("wifi"), "wifiStandard", WIFI_STANDARDS, {
      label: enumText.wifiStandard,
    }),
    enumSelectBulkColumn(
      ui.label("hostInterface"),
      "hostInterface",
      WIRELESS_HOST_INTERFACES,
      { label: enumText.wifiInterface },
    ),
    enumSelectBulkColumn(ui.label("bluetooth"), "bluetoothVersion", BLUETOOTH_VERSIONS, {
      empty: "null",
    }),
    numberBulkColumn(ui.label("maxSpeedMbps"), "maxSpeedMbps", {
      parse: toInteger,
      fallback: 0,
    }),
    numberBulkColumn(ui.label("maxSpeed5GhzMbps"), "maxSpeedMbps5G", {
      parse: toInteger,
      fallback: null,
    }),
    numberBulkColumn(ui.label("maxSpeed6GhzMbps"), "maxSpeedMbps6G", {
      parse: toInteger,
      fallback: null,
    }),
    enumSelectBulkColumn(ui.label("pcieSlot"), "pcieSlotType", PCIE_SLOT_TYPES, {
      empty: "keep",
    }),
    enumSelectBulkColumn(ui.label("m2Key"), "key", M2_KEYS, { empty: "keep" }),
    enumSelectBulkColumn(ui.label("m2FormFactor"), "m2FormFactor", M2_FORM_FACTORS, {
      empty: "keep",
      label: enumText.m2FormFactor,
    }),
    enumSelectBulkColumn(ui.label("usbVersion"), "usbVersion", USB_VERSIONS, {
      empty: "keep",
      label: enumText.usbVersion,
    }),
    enumSelectBulkColumn(ui.label("usbType"), "usbType", USB_TYPES, {
      empty: "keep",
      label: enumText.usbType,
    }),
  ];
}

export function WirelessNetworkAdapterFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<WirelessNetworkAdapter>[] {
  return [
    nameField(),
    idSelectField(ui.label("manufacturer"), "manufacturerId", manufacturers),
    enumSelectField(ui.label("wifi"), "wifiStandard", WIFI_STANDARDS, {
      label: enumText.wifiStandard,
    }),
    enumSelectField(
      ui.label("hostInterface"),
      "hostInterface",
      WIRELESS_HOST_INTERFACES,
      { label: enumText.wifiInterface },
    ),
    enumSelectField(ui.label("bluetooth"), "bluetoothVersion", BLUETOOTH_VERSIONS, {
      empty: "null",
    }),
    numberField(ui.label("maxSpeedMbps"), "maxSpeedMbps", {
      parse: toInteger,
      fallback: 0,
    }),
    numberField(ui.label("maxSpeed5GhzMbps"), "maxSpeedMbps5G", {
      parse: toInteger,
      fallback: null,
    }),
    numberField(ui.label("maxSpeed6GhzMbps"), "maxSpeedMbps6G", {
      parse: toInteger,
      fallback: null,
    }),
    enumSelectField(ui.label("pcieSlot"), "pcieSlotType", PCIE_SLOT_TYPES, {
      empty: "keep",
    }),
    enumSelectField(ui.label("m2Key"), "key", M2_KEYS, { empty: "keep" }),
    enumSelectField(ui.label("m2FormFactor"), "m2FormFactor", M2_FORM_FACTORS, {
      empty: "keep",
      label: enumText.m2FormFactor,
    }),
    enumSelectField(ui.label("usbVersion"), "usbVersion", USB_VERSIONS, {
      empty: "keep",
      label: enumText.usbVersion,
    }),
    enumSelectField(ui.label("usbType"), "usbType", USB_TYPES, {
      empty: "keep",
      label: enumText.usbType,
    }),
  ];
}
