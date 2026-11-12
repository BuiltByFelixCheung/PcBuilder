import {
  enumSelectBulkColumn,
  idSelectBulkColumn,
  integerColumn,
  nameBulkColumn,
  optionalNumberColumn,
  switchBulkColumn,
} from "@/components/BulkEditColumns";
import type { BulkEditColumn } from "@/components/BulkEditDialog";
import { ChoiceSelect, emptyChoice } from "@/components/ChoiceSelect";
import {
  checkboxField,
  enumSelectField,
  idSelectField,
  integerField,
  nameField,
  optionalNumberField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import { Input } from "@/components/ui/input";
import { toInteger } from "@/api/helper";
import type { GraphicsCardListItem } from "@/api/catalog/graphics-cards";
import {
  GRAPHICS_CARD_POWER_CONNECTORS,
  PCIE_GENERATIONS,
  type PsuCableType,
} from "@/api/enums";
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
      | "powerConsumptionWatts",
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
    powerConnectorBulkColumn(),
    powerConnectorCountBulkColumn(),
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
      | "powerConsumptionWatts",
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
    powerConnectorField(),
    powerConnectorCountField(),
  ];
}

function powerConnectorField(): CatalogField<GraphicsCardListItem> {
  const label = ui.label("powerConnectorType");
  return {
    label,
    half: true,
    control: (item, update) => (
      <PowerConnectorSelect
        label={label}
        name={item.name}
        value={item.powerConnectorType}
        onChange={(next) => update(applyConnector(item, next))}
      />
    ),
  };
}

function powerConnectorCountField(): CatalogField<GraphicsCardListItem> {
  const label = ui.label("powerConnectorCount");
  return {
    label,
    half: true,
    control: (item, update) => (
      <PowerConnectorCountInput
        label={label}
        name={item.name}
        connectorType={item.powerConnectorType}
        count={item.powerConnectorCount}
        onChange={(count) => update({ ...item, powerConnectorCount: count })}
      />
    ),
  };
}

function powerConnectorBulkColumn(): BulkEditColumn<GraphicsCardListItem> {
  const header = ui.label("powerConnectorType");
  return {
    header,
    cell: (row, update) => (
      <PowerConnectorSelect
        label={header}
        name={row.name}
        value={row.powerConnectorType}
        onChange={(next) => update(applyConnector(row, next))}
      />
    ),
  };
}

function powerConnectorCountBulkColumn(): BulkEditColumn<GraphicsCardListItem> {
  const header = ui.label("powerConnectorCount");
  return {
    header,
    cell: (row, update) => (
      <PowerConnectorCountInput
        label={header}
        name={row.name}
        connectorType={row.powerConnectorType}
        count={row.powerConnectorCount}
        onChange={(count) => update({ ...row, powerConnectorCount: count })}
      />
    ),
  };
}

function applyConnector(
  item: GraphicsCardListItem,
  next: PsuCableType | "",
): GraphicsCardListItem {
  return {
    ...item,
    powerConnectorType: next as PsuCableType,
    powerConnectorCount: next === "None" ? 0 : item.powerConnectorCount,
  };
}

function PowerConnectorSelect({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (next: PsuCableType | "") => void;
}) {
  const known = GRAPHICS_CARD_POWER_CONNECTORS.some((entry) => entry === value);
  return (
    <ChoiceSelect
      label={label}
      ariaLabel={name ? ui.message("fieldFor", { field: label, name }) : label}
      value={known ? value : emptyChoice}
      showBlank={!known}
      options={GRAPHICS_CARD_POWER_CONNECTORS.map((entry) => ({
        value: entry,
        label: enumText.psuCableType(entry),
      }))}
      onValueChange={(next) => {
        if (next === emptyChoice) {
          onChange("");
          return;
        }
        onChange(next as PsuCableType);
      }}
    />
  );
}

function PowerConnectorCountInput({
  label,
  name,
  connectorType,
  count,
  onChange,
}: {
  label: string;
  name: string;
  connectorType: string;
  count: number;
  onChange: (count: number) => void;
}) {
  const slotPowered = connectorType === "None";
  return (
    <Input
      aria-label={name ? ui.message("fieldFor", { field: label, name }) : label}
      type="number"
      min={slotPowered ? 0 : 1}
      disabled={slotPowered}
      value={slotPowered ? "0" : String(count)}
      onChange={(event) => onChange(toInteger(event.target.value) ?? 0)}
    />
  );
}
