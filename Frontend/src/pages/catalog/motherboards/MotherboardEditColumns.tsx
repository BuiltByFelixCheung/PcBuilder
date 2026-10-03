import {
  enumSelectBulkColumn,
  idSelectBulkColumn,
  integerColumn,
  nameBulkColumn,
  optionalNumberColumn,
  switchBulkColumn,
} from "@/components/BulkEditColumns";
import type { BulkEditColumn } from "@/components/BulkEditDialog";
import {
  checkboxField,
  enumSelectField,
  idSelectField,
  integerField,
  nameField,
  optionalNumberField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import type { MotherboardListItem } from "@/api/catalog/motherboards";
import {
  DDR_GENERATIONS,
  MB_FORM_FACTORS,
  RAM_FORM_FACTORS,
} from "@/api/enums";

export function MotherboardEditColumns(
  manufacturers: { id: string; name: string }[],
  sockets: { id: string; name: string }[],
  chipsets: { id: string; name: string }[],
): BulkEditColumn<MotherboardListItem>[] {
  const counted = (
    header: string,
    field:
      | "ramSlots"
      | "maxMemoryGb"
      | "maxDimmSizeGb"
      | "sataPorts"
      | "fanConnectors"
      | "epsConnectors",
  ) =>
    integerColumn<MotherboardListItem>(header, field, {
      type: "number",
      min: 0,
    });

  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    idSelectBulkColumn("Socket", "socketId", sockets),
    idSelectBulkColumn("Chipset", "chipsetId", chipsets),
    counted("RAM slots", "ramSlots"),
    counted("Max memory (GB)", "maxMemoryGb"),
    counted("Max memory per slot (GB)", "maxDimmSizeGb"),
    counted("SATA ports", "sataPorts"),
    counted("Fan connectors", "fanConnectors"),
    counted("EPS connectors", "epsConnectors"),
    optionalNumberColumn("Width (mm)", "widthMm"),
    optionalNumberColumn("Height (mm)", "heightMm"),
    enumSelectBulkColumn("DDR Generation", "ddrGeneration", DDR_GENERATIONS, {
      label: (generation) => generation.replace("Ddr", "DDR"),
    }),
    enumSelectBulkColumn("RAM form factor", "ramFormFactor", RAM_FORM_FACTORS),
    enumSelectBulkColumn("Form factor", "formFactor", MB_FORM_FACTORS),
    switchBulkColumn("Wi-Fi Enabled?", "wifiEnabled", "Yes", "No"),
    switchBulkColumn("Bluetooth Enabled?", "bluetoothEnabled", "Yes", "No"),
  ];
}

export function MotherboardFields(
  manufacturers: { id: string; name: string }[],
  sockets: { id: string; name: string }[],
  chipsets: { id: string; name: string }[],
): CatalogField<MotherboardListItem>[] {
  const counted = (
    label: string,
    field:
      | "ramSlots"
      | "maxMemoryGb"
      | "maxDimmSizeGb"
      | "sataPorts"
      | "fanConnectors"
      | "epsConnectors",
  ) =>
    integerField<MotherboardListItem>(label, field, {
      type: "number",
      min: 0,
    });

  return [
    nameField(),
    idSelectField("Manufacturer", "manufacturerId", manufacturers),
    idSelectField("Socket", "socketId", sockets),
    idSelectField("Chipset", "chipsetId", chipsets),
    counted("RAM slots", "ramSlots"),
    counted("Max memory (GB)", "maxMemoryGb"),
    counted("Max memory per slot (GB)", "maxDimmSizeGb"),
    counted("SATA ports", "sataPorts"),
    counted("Fan connectors", "fanConnectors"),
    counted("EPS connectors", "epsConnectors"),
    optionalNumberField("Width (mm)", "widthMm"),
    optionalNumberField("Height (mm)", "heightMm"),
    enumSelectField("DDR Generation", "ddrGeneration", DDR_GENERATIONS, {
      label: (generation) => generation.replace("Ddr", "DDR"),
    }),
    enumSelectField("RAM form factor", "ramFormFactor", RAM_FORM_FACTORS),
    enumSelectField("Form factor", "formFactor", MB_FORM_FACTORS),
    checkboxField("Wi-Fi Enabled?", "wifiEnabled"),
    checkboxField("Bluetooth Enabled?", "bluetoothEnabled"),
  ];
}
