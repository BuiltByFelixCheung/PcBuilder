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
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    idSelectBulkColumn("GPU", "gpuId", gpus),
    counted("Video Memory", "videoMemoryGb"),
    counted("Pcie Slots Used", "pcieSlotsUsed"),
    enumSelectBulkColumn(
      "Pcie Generation",
      "pcieGeneration",
      PCIE_GENERATIONS,
      {
        label: (generation) => generation.replace("Gen", "PCIe "),
      },
    ),
    switchBulkColumn("Low Profile", "isLowProfile", "Yes", "No"),
    optionalNumberColumn("Length (mm)", "lengthMm"),
    optionalNumberColumn("Width (mm)", "widthMm"),
    optionalNumberColumn("Height (mm)", "heightMm"),
    counted("Power Consumption (W)", "powerConsumptionWatts"),
    enumSelectBulkColumn(
      "Power Connector Type",
      "powerConnectorType",
      PSU_CABLE_TYPES,
    ),
    counted("Power Connector Count", "powerConnectorCount"),
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
    idSelectField("Manufacturer", "manufacturerId", manufacturers),
    idSelectField("GPU", "gpuId", gpus),
    counted("Video Memory", "videoMemoryGb"),
    counted("Pcie Slots Used", "pcieSlotsUsed"),
    enumSelectField("Pcie Generation", "pcieGeneration", PCIE_GENERATIONS, {
      label: (generation) => generation.replace("Gen", "PCIe "),
    }),
    checkboxField("Is Low Profile", "isLowProfile"),
    optionalNumberField("Length (mm)", "lengthMm"),
    optionalNumberField("Width (mm)", "widthMm"),
    optionalNumberField("Height (mm)", "heightMm"),
    counted("Power Consumption (W)", "powerConsumptionWatts"),
    enumSelectField(
      "Power Connector Type",
      "powerConnectorType",
      PSU_CABLE_TYPES,
    ),
    counted("Power Connector Count", "powerConnectorCount"),
  ];
}
