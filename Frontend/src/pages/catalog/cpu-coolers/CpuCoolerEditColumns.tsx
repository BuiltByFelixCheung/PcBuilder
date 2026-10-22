import {
  enumSelectBulkColumn,
  idSelectBulkColumn,
  nameBulkColumn,
  integerColumn,
  optionalNumberColumn,
} from "@/components/BulkEditColumns";
import type { BulkEditColumn } from "@/components/BulkEditDialog";
import {
  enumSelectField,
  idSelectField,
  nameField,
  integerField,
  optionalNumberField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import type { CpuCoolerListItem } from "@/api/catalog/cpu-coolers";
import {
  CPU_COOLER_TYPES,
  RADIATOR_CLASSES,
  formatRadiatorClass,
} from "@/api/enums";
import { enumText, ui } from "@/i18n/translate-enum";

export function CpuCoolerEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<CpuCoolerListItem>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
    enumSelectBulkColumn(ui.label("type"), "type", CPU_COOLER_TYPES, {
      label: enumText.cpuCoolerType,
    }),
    optionalNumberColumn(ui.label("lengthMm"), "coolerLengthMm"),
    optionalNumberColumn(ui.label("widthMm"), "coolerWidthMm"),
    optionalNumberColumn(ui.label("heightMm"), "coolerHeightMm"),
    optionalNumberColumn(ui.label("maxRamHeightMm"), "maxRamHeightMm"),
    enumSelectBulkColumn(ui.label("radiatorClass"), "radiatorClass", RADIATOR_CLASSES, {
      empty: "null",
      emptyLabel: ui.label("na"),
      label: formatRadiatorClass,
    }),
    optionalNumberColumn(ui.label("radiatorLengthMm"), "radiatorLengthMm"),
    optionalNumberColumn(ui.label("radiatorWidthMm"), "radiatorWidthMm"),
    optionalNumberColumn(ui.label("radiatorHeightMm"), "radiatorHeightMm"),
    optionalNumberColumn(ui.label("waterBlockLengthMm"), "waterBlockLengthMm"),
    optionalNumberColumn(ui.label("waterBlockWidthMm"), "waterBlockWidthMm"),
    optionalNumberColumn(ui.label("waterBlockHeightMm"), "waterBlockHeightMm"),
    optionalNumberColumn(ui.label("fanThicknessMm"), "fanThicknessMm"),
    optionalNumberColumn(ui.label("fanWidthMm"), "fanWidthMm"),
    optionalNumberColumn(ui.label("fanHeightMm"), "fanHeightMm"),
    integerColumn(ui.label("fanCount"), "fanCount", {
      type: "number",
      min: 0,
      fallback: null,
    }),
  ];
}

export function CpuCoolerBasicFields(
  manufacturers: { id: string; name: string }[]
): CatalogField<CpuCoolerListItem>[] {
  return [
    nameField(),
    idSelectField(ui.label("manufacturer"), "manufacturerId", manufacturers),
    enumSelectField(ui.label("type"), "type", CPU_COOLER_TYPES, {
      label: enumText.cpuCoolerType,
    }),
  ];
}

export function AirCoolerFields(): CatalogField<CpuCoolerListItem>[] {
  return [
    optionalNumberField(ui.label("lengthMm"), "coolerLengthMm"),
    optionalNumberField(ui.label("widthMm"), "coolerWidthMm"),
    optionalNumberField(ui.label("heightMm"), "coolerHeightMm"),
    optionalNumberField(ui.label("maxRamHeightMm"), "maxRamHeightMm"),
  ];
}

export function CpuCoolerFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<CpuCoolerListItem>[] {
  return [
    ...CpuCoolerBasicFields(manufacturers),
    ...AirCoolerFields(),
    ...RadiatorFields(),
    ...WaterBlockFields(),
    ...FansFields(),
  ];
}

export function RadiatorFields(): CatalogField<CpuCoolerListItem>[] {
  return [
    enumSelectField(ui.label("radiatorClass"), "radiatorClass", RADIATOR_CLASSES, {
      empty: "null",
      emptyLabel: ui.label("na"),
      label: formatRadiatorClass,
    }),
    optionalNumberField(ui.label("radiatorLengthMm"), "radiatorLengthMm"),
    optionalNumberField(ui.label("radiatorWidthMm"), "radiatorWidthMm"),
    optionalNumberField(ui.label("radiatorHeightMm"), "radiatorHeightMm"),
  ];
}

export function WaterBlockFields(): CatalogField<CpuCoolerListItem>[] {
  return [
    optionalNumberField(ui.label("waterBlockLengthMm"), "waterBlockLengthMm"),
    optionalNumberField(ui.label("waterBlockWidthMm"), "waterBlockWidthMm"),
    optionalNumberField(ui.label("waterBlockHeightMm"), "waterBlockHeightMm"),
  ];
}

export function FansFields(): CatalogField<CpuCoolerListItem>[] {
  return [
    optionalNumberField(ui.label("fanThicknessMm"), "fanThicknessMm"),
    optionalNumberField(ui.label("fanWidthMm"), "fanWidthMm"),
    optionalNumberField(ui.label("fanHeightMm"), "fanHeightMm"),
    integerField(ui.label("fanCount"), "fanCount", {
      type: "number",
      min: 0,
      fallback: null,
    }),
  ];
}