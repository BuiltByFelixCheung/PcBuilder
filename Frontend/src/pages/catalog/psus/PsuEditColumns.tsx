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

export function PsuEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<PsuListItem>[] {
  const millimeters = (
    header: string,
    field: "lengthMm" | "widthMm" | "heightMm",
  ) => optionalNumberColumn<PsuListItem>(header, field);

  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers, "Any"),
    integerColumn("Wattage", "wattage", { type: "number", min: 0 }),
    enumSelectBulkColumn("Modularity", "modularity", PSU_MODULARITIES),
    enumSelectBulkColumn("Form factor", "formFactor", PSU_FORM_FACTORS),
    millimeters("Length (mm)", "lengthMm"),
    millimeters("Width (mm)", "widthMm"),
    millimeters("Height (mm)", "heightMm"),
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
    idSelectField("Manufacturer", "manufacturerId", manufacturers, "Any"),
    integerField("Wattage", "wattage", { type: "number", min: 0 }),
    enumSelectField("Modularity", "modularity", PSU_MODULARITIES),
    enumSelectField("Form factor", "formFactor", PSU_FORM_FACTORS),
    millimeters("Length (mm)", "lengthMm"),
    millimeters("Width (mm)", "widthMm"),
    millimeters("Height (mm)", "heightMm"),
  ];
}
