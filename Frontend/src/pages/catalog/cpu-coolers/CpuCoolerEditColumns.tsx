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

export function CpuCoolerEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<CpuCoolerListItem>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    enumSelectBulkColumn("Type", "type", CPU_COOLER_TYPES),
    optionalNumberColumn("Length (mm)", "coolerLengthMm"),
    optionalNumberColumn("Width (mm)", "coolerWidthMm"),
    optionalNumberColumn("Height (mm)", "coolerHeightMm"),
    optionalNumberColumn("Max RAM height (mm)", "maxRamHeightMm"),
    enumSelectBulkColumn("Radiator class", "radiatorClass", RADIATOR_CLASSES, {
      empty: "null",
      emptyLabel: "N/A",
      label: formatRadiatorClass,
    }),
    optionalNumberColumn("Radiator length (mm)", "radiatorLengthMm"),
    optionalNumberColumn("Radiator width (mm)", "radiatorWidthMm"),
    optionalNumberColumn("Radiator height (mm)", "radiatorHeightMm"),
    optionalNumberColumn("Water block length (mm)", "waterBlockLengthMm"),
    optionalNumberColumn("Water block width (mm)", "waterBlockWidthMm"),
    optionalNumberColumn("Water block height (mm)", "waterBlockHeightMm"),
    optionalNumberColumn("Fan thickness (mm)", "fanThicknessMm"),
    optionalNumberColumn("Fan width (mm)", "fanWidthMm"),
    optionalNumberColumn("Fan height (mm)", "fanHeightMm"),
    integerColumn("Fan count", "fanCount", {
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
    idSelectField("Manufacturer", "manufacturerId", manufacturers),
    enumSelectField("Type", "type", CPU_COOLER_TYPES),
  ];
}

export function AirCoolerFields(): CatalogField<CpuCoolerListItem>[] {
  return [
    optionalNumberField("Length (mm)", "coolerLengthMm"),
    optionalNumberField("Width (mm)", "coolerWidthMm"),
    optionalNumberField("Height (mm)", "coolerHeightMm"),
    optionalNumberField("Max RAM height (mm)", "maxRamHeightMm"),
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
    enumSelectField("Radiator class", "radiatorClass", RADIATOR_CLASSES, {
      empty: "null",
      emptyLabel: "N/A",
      label: formatRadiatorClass,
    }),
    optionalNumberField("Radiator length (mm)", "radiatorLengthMm"),
    optionalNumberField("Radiator width (mm)", "radiatorWidthMm"),
    optionalNumberField("Radiator height (mm)", "radiatorHeightMm"),
  ];
}

export function WaterBlockFields(): CatalogField<CpuCoolerListItem>[] {
  return [
    optionalNumberField("Water block length (mm)", "waterBlockLengthMm"),
    optionalNumberField("Water block width (mm)", "waterBlockWidthMm"),
    optionalNumberField("Water block height (mm)", "waterBlockHeightMm"),
  ];
}

export function FansFields(): CatalogField<CpuCoolerListItem>[] {
  return [
    optionalNumberField("Fan thickness (mm)", "fanThicknessMm"),
    optionalNumberField("Fan width (mm)", "fanWidthMm"),
    optionalNumberField("Fan height (mm)", "fanHeightMm"),
    integerField("Fan count", "fanCount", {
      type: "number",
      min: 0,
      fallback: null,
    }),
  ];
}