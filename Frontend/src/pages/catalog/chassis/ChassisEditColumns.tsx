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
import { ui } from "@/i18n/translate-enum";

export function ChassisEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<ChassisListItem>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
    optionalNumberColumn(ui.label("lengthMm"), "lengthMm"),
    optionalNumberColumn(ui.label("widthMm"), "widthMm"),
    optionalNumberColumn(ui.label("heightMm"), "heightMm"),
    optionalNumberColumn(ui.label("motherboardMaxWidthMm"), "motherboardMaxWidthMm"),
    optionalNumberColumn(
      ui.label("motherboardMaxHeightMm"),
      "motherboardMaxHeightMm",
    ),
    optionalNumberColumn(ui.label("maxCpuCoolerHeightMm"), "maxCpuCoolerHeightMm"),
    optionalNumberColumn(
      ui.label("maxGraphicsCardLengthMm"),
      "maxGraphicsCardLengthMm",
    ),
    optionalNumberColumn(ui.label("maxPsuLengthMm"), "maxPsuLengthMm"),
  ];
}

export function ChassisFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<ChassisListItem>[] {
  return [
    nameField(),
    idSelectField(ui.label("manufacturer"), "manufacturerId", manufacturers),
    optionalNumberField(ui.label("lengthMm"), "lengthMm"),
    optionalNumberField(ui.label("widthMm"), "widthMm"),
    optionalNumberField(ui.label("heightMm"), "heightMm"),
    optionalNumberField(ui.label("motherboardMaxWidthMm"), "motherboardMaxWidthMm"),
    optionalNumberField(
      ui.label("motherboardMaxHeightMm"),
      "motherboardMaxHeightMm",
    ),
    optionalNumberField(ui.label("maxCpuCoolerHeightMm"), "maxCpuCoolerHeightMm"),
    optionalNumberField(
      ui.label("maxGraphicsCardLengthMm"),
      "maxGraphicsCardLengthMm",
    ),
    optionalNumberField(ui.label("maxPsuLengthMm"), "maxPsuLengthMm"),
  ];
}
