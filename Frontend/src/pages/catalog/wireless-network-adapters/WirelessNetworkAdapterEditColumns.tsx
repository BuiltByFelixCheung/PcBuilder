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

export function WirelessNetworkAdapterEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<WirelessNetworkAdapter>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    enumSelectBulkColumn("Wi-Fi", "wifiStandard", WIFI_STANDARDS),
    enumSelectBulkColumn(
      "Host interface",
      "hostInterface",
      WIRELESS_HOST_INTERFACES,
    ),
    enumSelectBulkColumn("Bluetooth", "bluetoothVersion", BLUETOOTH_VERSIONS, {
      empty: "null",
    }),
    numberBulkColumn("Max speed (Mbps)", "maxSpeedMbps", {
      parse: toInteger,
      fallback: 0,
    }),
    numberBulkColumn("5 GHz max speed (Mbps)", "maxSpeedMbps5G", {
      parse: toInteger,
      fallback: null,
    }),
    numberBulkColumn("6 GHz max speed (Mbps)", "maxSpeedMbps6G", {
      parse: toInteger,
      fallback: null,
    }),
    enumSelectBulkColumn("PCIe slot", "pcieSlotType", PCIE_SLOT_TYPES, {
      empty: "keep",
    }),
    enumSelectBulkColumn("M.2 key", "key", M2_KEYS, { empty: "keep" }),
    enumSelectBulkColumn("M.2 form factor", "m2FormFactor", M2_FORM_FACTORS, {
      empty: "keep",
    }),
    enumSelectBulkColumn("USB version", "usbVersion", USB_VERSIONS, {
      empty: "keep",
    }),
    enumSelectBulkColumn("USB type", "usbType", USB_TYPES, { empty: "keep" }),
  ];
}

export function WirelessNetworkAdapterFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<WirelessNetworkAdapter>[] {
  return [
    nameField(),
    idSelectField("Manufacturer", "manufacturerId", manufacturers),
    enumSelectField("Wi-Fi", "wifiStandard", WIFI_STANDARDS),
    enumSelectField(
      "Host interface",
      "hostInterface",
      WIRELESS_HOST_INTERFACES,
    ),
    enumSelectField("Bluetooth", "bluetoothVersion", BLUETOOTH_VERSIONS, {
      empty: "null",
    }),
    numberField("Max speed (Mbps)", "maxSpeedMbps", {
      parse: toInteger,
      fallback: 0,
    }),
    numberField("5 GHz max speed (Mbps)", "maxSpeedMbps5G", {
      parse: toInteger,
      fallback: null,
    }),
    numberField("6 GHz max speed (Mbps)", "maxSpeedMbps6G", {
      parse: toInteger,
      fallback: null,
    }),
    enumSelectField("PCIe slot", "pcieSlotType", PCIE_SLOT_TYPES, {
      empty: "keep",
    }),
    enumSelectField("M.2 key", "key", M2_KEYS, { empty: "keep" }),
    enumSelectField("M.2 form factor", "m2FormFactor", M2_FORM_FACTORS, {
      empty: "keep",
    }),
    enumSelectField("USB version", "usbVersion", USB_VERSIONS, {
      empty: "keep",
    }),
    enumSelectField("USB type", "usbType", USB_TYPES, { empty: "keep" }),
  ];
}
