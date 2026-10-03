import {
  idSelectBulkColumn,
  nameBulkColumn,
  optionalNumberColumn,
} from "@/components/BulkEditColumns";
import type { BulkEditColumn } from "@/components/BulkEditDialog";
import {
  idSelectField,
  nameField,
  optionalNumberField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import type { ChassisListItem } from "@/api/catalog/chassis";

export function ChassisEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<ChassisListItem>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    optionalNumberColumn("Length (mm)", "lengthMm"),
    optionalNumberColumn("Width (mm)", "widthMm"),
    optionalNumberColumn("Height (mm)", "heightMm"),
    optionalNumberColumn("Motherboard Max Width (mm)", "motherboardMaxWidthMm"),
    optionalNumberColumn(
      "Motherboard Max Height (mm)",
      "motherboardMaxHeightMm",
    ),
    optionalNumberColumn("Max CPU Cooler Height (mm)", "maxCpuCoolerHeightMm"),
    optionalNumberColumn(
      "Max Graphics Card Length (mm)",
      "maxGraphicsCardLengthMm",
    ),
    optionalNumberColumn("Max PSU Length (mm)", "maxPsuLengthMm"),
  ];
}

export function ChassisFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<ChassisListItem>[] {
  return [
    nameField(),
    idSelectField("Manufacturer", "manufacturerId", manufacturers),
    optionalNumberField("Length (mm)", "lengthMm"),
    optionalNumberField("Width (mm)", "widthMm"),
    optionalNumberField("Height (mm)", "heightMm"),
    optionalNumberField("Motherboard Max Width (mm)", "motherboardMaxWidthMm"),
    optionalNumberField(
      "Motherboard Max Height (mm)",
      "motherboardMaxHeightMm",
    ),
    optionalNumberField("Max CPU Cooler Height (mm)", "maxCpuCoolerHeightMm"),
    optionalNumberField(
      "Max Graphics Card Length (mm)",
      "maxGraphicsCardLengthMm",
    ),
    optionalNumberField("Max PSU Length (mm)", "maxPsuLengthMm"),
  ];
}
