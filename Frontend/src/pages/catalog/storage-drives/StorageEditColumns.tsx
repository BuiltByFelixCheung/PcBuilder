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

export function StorageEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<StorageDrive>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    enumSelectBulkColumn("Media", "media", STORAGE_MEDIAS),
    enumSelectBulkColumn("Interface", "interface", STORAGE_INTERFACES),
    enumSelectBulkColumn("Form factor", "formFactor", STORAGE_FORM_FACTORS),
    integerColumn("Capacity (GB)", "capacityGb", { type: "number", min: 0 }),
    enumSelectBulkColumn(
      "PCIe generation",
      "pcieGeneration",
      PCIE_GENERATIONS,
      {
        empty: "null",
        label: (generation) => generation.replace("Gen", "PCIe "),
      },
    ),
    integerColumn("RPM", "rpm", { type: "number", fallback: undefined }),
  ];
}

export function StorageFields(
  manufacturers: { id: string; name: string }[],
): CatalogField<StorageDrive>[] {
  return [
    nameField(),
    idSelectField("Manufacturer", "manufacturerId", manufacturers),
    enumSelectField("Media", "media", STORAGE_MEDIAS),
    enumSelectField("Interface", "interface", STORAGE_INTERFACES),
    enumSelectField("Form factor", "formFactor", STORAGE_FORM_FACTORS),
    integerField("Capacity (GB)", "capacityGb", { type: "number", min: 0 }),
    enumSelectField("PCIe generation", "pcieGeneration", PCIE_GENERATIONS, {
      empty: "null",
      label: (generation) => generation.replace("Gen", "PCIe "),
    }),
    integerField("RPM", "rpm", { type: "number", fallback: undefined }),
  ];
}
