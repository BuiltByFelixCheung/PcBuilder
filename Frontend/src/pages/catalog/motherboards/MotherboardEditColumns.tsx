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
import { enumText, ui } from "@/i18n/translate-enum";

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
      | "pwmFanHeaders"
      | "dcFanHeaders"
      | "epsConnectors",
  ) =>
    integerColumn<MotherboardListItem>(header, field, {
      type: "number",
      min: 0,
    });

  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
    idSelectBulkColumn(ui.label("socket"), "socketId", sockets),
    idSelectBulkColumn(ui.label("chipset"), "chipsetId", chipsets),
    counted(ui.label("ramSlots"), "ramSlots"),
    counted(ui.label("maxMemoryGb"), "maxMemoryGb"),
    counted(ui.label("maxMemoryPerSlotGb"), "maxDimmSizeGb"),
    counted(ui.label("sataPorts"), "sataPorts"),
    counted(ui.label("pwmFanHeaders"), "pwmFanHeaders"),
    counted(ui.label("dcFanHeaders"), "dcFanHeaders"),
    counted(ui.label("epsConnectors"), "epsConnectors"),
    optionalNumberColumn(ui.label("widthMm"), "widthMm"),
    optionalNumberColumn(ui.label("heightMm"), "heightMm"),
    enumSelectBulkColumn(
      ui.label("ddrGeneration"),
      "ddrGeneration",
      DDR_GENERATIONS,
      { label: enumText.ddrGeneration },
    ),
    enumSelectBulkColumn(
      ui.label("ramFormFactor"),
      "ramFormFactor",
      RAM_FORM_FACTORS,
      { label: enumText.ramFormFactor },
    ),
    enumSelectBulkColumn(ui.label("formFactor"), "formFactor", MB_FORM_FACTORS, {
      label: enumText.mbFormFactor,
    }),
    switchBulkColumn(ui.label("wifiEnabled"), "wifiEnabled", ui.label("yes"), ui.label("no")),
    switchBulkColumn(ui.label("bluetoothEnabled"), "bluetoothEnabled", ui.label("yes"), ui.label("no")),
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
      | "pwmFanHeaders"
      | "dcFanHeaders"
      | "epsConnectors",
  ) =>
    integerField<MotherboardListItem>(label, field, {
      type: "number",
      min: 0,
    });

  return [
    nameField(),
    idSelectField(ui.label("manufacturer"), "manufacturerId", manufacturers),
    idSelectField(ui.label("socket"), "socketId", sockets),
    idSelectField(ui.label("chipset"), "chipsetId", chipsets),
    counted(ui.label("ramSlots"), "ramSlots"),
    counted(ui.label("maxMemoryGb"), "maxMemoryGb"),
    counted(ui.label("maxMemoryPerSlotGb"), "maxDimmSizeGb"),
    counted(ui.label("sataPorts"), "sataPorts"),
    counted(ui.label("pwmFanHeaders"), "pwmFanHeaders"),
    counted(ui.label("dcFanHeaders"), "dcFanHeaders"),
    counted(ui.label("epsConnectors"), "epsConnectors"),
    optionalNumberField(ui.label("widthMm"), "widthMm"),
    optionalNumberField(ui.label("heightMm"), "heightMm"),
    enumSelectField(
      ui.label("ddrGeneration"),
      "ddrGeneration",
      DDR_GENERATIONS,
      { label: enumText.ddrGeneration },
    ),
    enumSelectField(
      ui.label("ramFormFactor"),
      "ramFormFactor",
      RAM_FORM_FACTORS,
      { label: enumText.ramFormFactor },
    ),
    enumSelectField(ui.label("formFactor"), "formFactor", MB_FORM_FACTORS, {
      label: enumText.mbFormFactor,
    }),
    checkboxField(ui.label("wifi"), "wifiEnabled"),
    checkboxField(ui.label("bluetooth"), "bluetoothEnabled"),
  ];
}
