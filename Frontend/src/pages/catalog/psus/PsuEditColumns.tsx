import {
  enumSelectBulkColumn,
  idSelectBulkColumn,
  integerColumn,
  nameBulkColumn,
  optionalNumberColumn,
} from "@/components/BulkEditColumns";
import type { BulkEditColumn } from "@/components/BulkEditDialog";
import {
  enumSelectField,
  idSelectField,
  integerField,
  nameField,
  optionalNumberField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import type { PsuListItem } from "@/api/catalog/psus";
import { PSU_FORM_FACTORS, PSU_MODULARITIES } from "@/api/enums";
import { enumText, ui } from "@/i18n/translate-enum";

export function PsuEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<PsuListItem>[] {
  const millimeters = (
    header: string,
    field: "lengthMm" | "widthMm" | "heightMm",
  ) => optionalNumberColumn<PsuListItem>(header, field);

  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers, ui.label("any")),
    integerColumn(ui.label("wattage"), "wattage", { type: "number", min: 0 }),
    enumSelectBulkColumn(ui.label("modularity"), "modularity", PSU_MODULARITIES, {
      label: enumText.psuModularity,
    }),
    enumSelectBulkColumn(ui.label("formFactor"), "formFactor", PSU_FORM_FACTORS, {
      label: enumText.psuFormFactor,
    }),
    millimeters(ui.label("lengthMm"), "lengthMm"),
    millimeters(ui.label("widthMm"), "widthMm"),
    millimeters(ui.label("heightMm"), "heightMm"),
  ];
}

export function PsuFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<PsuListItem>[] {
  const millimeters = (
    label: string,
    field: "lengthMm" | "widthMm" | "heightMm",
  ) => optionalNumberField<PsuListItem>(label, field);

  return [
    nameField(),
    idSelectField(ui.label("manufacturer"), "manufacturerId", manufacturers, ui.label("any")),
    integerField(ui.label("wattage"), "wattage", { type: "number", min: 0 }),
    enumSelectField(ui.label("modularity"), "modularity", PSU_MODULARITIES, {
      label: enumText.psuModularity,
    }),
    enumSelectField(ui.label("formFactor"), "formFactor", PSU_FORM_FACTORS, {
      label: enumText.psuFormFactor,
    }),
    millimeters(ui.label("lengthMm"), "lengthMm"),
    millimeters(ui.label("widthMm"), "widthMm"),
    millimeters(ui.label("heightMm"), "heightMm"),
  ];
}
