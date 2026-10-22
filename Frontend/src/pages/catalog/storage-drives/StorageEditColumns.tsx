import {
  enumSelectBulkColumn,
  idSelectBulkColumn,
  integerColumn,
  nameBulkColumn,
} from "@/components/BulkEditColumns";
import type { BulkEditColumn } from "@/components/BulkEditDialog";
import {
  enumSelectField,
  idSelectField,
  integerField,
  nameField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import type { StorageDrive } from "@/api/catalog/storage-drives";
import {
  PCIE_GENERATIONS,
  STORAGE_FORM_FACTORS,
  STORAGE_INTERFACES,
  STORAGE_MEDIAS,
} from "@/api/enums";
import { enumText, ui } from "@/i18n/translate-enum";

export function StorageEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<StorageDrive>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
    enumSelectBulkColumn(ui.label("media"), "media", STORAGE_MEDIAS, {
      label: enumText.storageMedia,
    }),
    enumSelectBulkColumn(ui.label("interface"), "interface", STORAGE_INTERFACES, {
      label: enumText.storageInterface,
    }),
    enumSelectBulkColumn(ui.label("formFactor"), "formFactor", STORAGE_FORM_FACTORS, {
      label: enumText.storageFormFactor,
    }),
    integerColumn(ui.label("capacityGb"), "capacityGb", { type: "number", min: 0 }),
    enumSelectBulkColumn(
      ui.label("pcieGeneration"),
      "pcieGeneration",
      PCIE_GENERATIONS,
      {
        empty: "null",
        label: enumText.pcieGeneration,
      },
    ),
    integerColumn(ui.label("rpm"), "rpm", { type: "number", fallback: undefined }),
  ];
}

export function StorageFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<StorageDrive>[] {
  return [
    nameField(),
    idSelectField(ui.label("manufacturer"), "manufacturerId", manufacturers),
    enumSelectField(ui.label("media"), "media", STORAGE_MEDIAS, {
      label: enumText.storageMedia,
    }),
    enumSelectField(ui.label("interface"), "interface", STORAGE_INTERFACES, {
      label: enumText.storageInterface,
    }),
    enumSelectField(ui.label("formFactor"), "formFactor", STORAGE_FORM_FACTORS, {
      label: enumText.storageFormFactor,
    }),
    integerField(ui.label("capacityGb"), "capacityGb", { type: "number", min: 0 }),
    enumSelectField(ui.label("pcieGeneration"), "pcieGeneration", PCIE_GENERATIONS, {
      empty: "null",
      label: enumText.pcieGeneration,
    }),
    integerField(ui.label("rpm"), "rpm", { type: "number", fallback: undefined }),
  ];
}
