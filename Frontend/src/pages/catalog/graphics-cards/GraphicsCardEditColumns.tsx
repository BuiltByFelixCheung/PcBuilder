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
import type { GraphicsCardListItem } from "@/api/catalog/graphics-cards";
import { PCIE_GENERATIONS, PSU_CABLE_TYPES } from "@/api/enums";
import { enumText, ui } from "@/i18n/translate-enum";

export function GraphicsCardEditColumns(
  manufacturers: { id: string; name: string }[],
  gpus: { id: string; name: string }[],
): BulkEditColumn<GraphicsCardListItem>[] {
  const counted = (
    header: string,
    field:
      | "videoMemoryGb"
      | "pcieSlotsUsed"
      | "powerConsumptionWatts"
      | "powerConnectorCount",
  ) =>
    integerColumn<GraphicsCardListItem>(header, field, {
      type: "number",
      min: 0,
    });

  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
    idSelectBulkColumn(ui.label("gpu"), "gpuId", gpus),
    counted(ui.label("videoMemory"), "videoMemoryGb"),
    counted(ui.label("pcieSlotsUsed"), "pcieSlotsUsed"),
    enumSelectBulkColumn(
      ui.label("pcieGeneration"),
      "pcieGeneration",
      PCIE_GENERATIONS,
      {
        label: enumText.pcieGeneration,
      },
    ),
    switchBulkColumn(ui.label("lowProfile"), "isLowProfile", ui.label("yes"), ui.label("no")),
    optionalNumberColumn(ui.label("lengthMm"), "lengthMm"),
    optionalNumberColumn(ui.label("widthMm"), "widthMm"),
    optionalNumberColumn(ui.label("heightMm"), "heightMm"),
    counted(ui.label("powerConsumptionW"), "powerConsumptionWatts"),
    enumSelectBulkColumn(
      ui.label("powerConnectorType"),
      "powerConnectorType",
      PSU_CABLE_TYPES,
      { label: enumText.psuCableType },
    ),
    counted(ui.label("powerConnectorCount"), "powerConnectorCount"),
  ];
}

export function GraphicsCardFields(
  manufacturers: { id: string; name: string }[],
  gpus: { id: string; name: string }[],
): CatalogField<GraphicsCardListItem>[] {
  const counted = (
    label: string,
    field:
      | "videoMemoryGb"
      | "pcieSlotsUsed"
      | "powerConsumptionWatts"
      | "powerConnectorCount",
  ) =>
    integerField<GraphicsCardListItem>(label, field, {
      type: "number",
      min: 0,
    });

  return [
    nameField(),
    idSelectField(ui.label("manufacturer"), "manufacturerId", manufacturers),
    idSelectField(ui.label("gpu"), "gpuId", gpus),
    counted(ui.label("videoMemory"), "videoMemoryGb"),
    counted(ui.label("pcieSlotsUsed"), "pcieSlotsUsed"),
    enumSelectField(ui.label("pcieGeneration"), "pcieGeneration", PCIE_GENERATIONS, {
      label: enumText.pcieGeneration,
    }),
    checkboxField(ui.label("isLowProfile"), "isLowProfile"),
    optionalNumberField(ui.label("lengthMm"), "lengthMm"),
    optionalNumberField(ui.label("widthMm"), "widthMm"),
    optionalNumberField(ui.label("heightMm"), "heightMm"),
    counted(ui.label("powerConsumptionW"), "powerConsumptionWatts"),
    enumSelectField(
      ui.label("powerConnectorType"),
      "powerConnectorType",
      PSU_CABLE_TYPES,
      { label: enumText.psuCableType },
    ),
    counted(ui.label("powerConnectorCount"), "powerConnectorCount"),
  ];
}
