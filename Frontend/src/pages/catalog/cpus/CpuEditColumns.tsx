import {
  idSelectBulkColumn,
  integerColumn,
  nameBulkColumn,
  switchBulkColumn,
} from "@/components/BulkEditColumns";
import type { BulkEditColumn } from "@/components/BulkEditDialog";
import {
  checkboxField,
  idSelectField,
  integerField,
  nameField,
  type CatalogField,
} from "@/components/catalog/CatalogFields";
import type { CpuListItem } from "@/api/catalog/cpus";
import { ui } from "@/i18n/translate-enum";

type CountedField =
  "maxMemoryGb" | "thermalDesignPower" | "powerConsumptionWatts";

type OwnedOption = { id: string; name: string; manufacturerId: string };

function belongsToManufacturer(
  options: readonly OwnedOption[],
  id: string,
  manufacturerId: string,
) {
  return options.some(
    (option) => option.id === id && option.manufacturerId === manufacturerId,
  );
}

function manufacturerBulkColumn(
  manufacturers: { id: string; name: string }[],
  series: readonly OwnedOption[],
  sockets: readonly OwnedOption[],
): BulkEditColumn<CpuListItem> {
  const column = idSelectBulkColumn<CpuListItem>(
    ui.label("manufacturer"),
    "manufacturerId",
    manufacturers,
  );
  return {
    header: column.header,
    cell: (row, update) =>
      column.cell(row, (next) => {
        const manufacturerId = next.manufacturerId;
        update({
          ...next,
          seriesId: belongsToManufacturer(series, row.seriesId, manufacturerId)
            ? row.seriesId
            : "",
          socketId: belongsToManufacturer(sockets, row.socketId, manufacturerId)
            ? row.socketId
            : "",
        });
      }),
  };
}

export function CpuEditColumns(
  manufacturers: { id: string; name: string }[],
  series: OwnedOption[],
  sockets: OwnedOption[],
): BulkEditColumn<CpuListItem>[] {
  const counted = (header: string, field: CountedField) =>
    integerColumn<CpuListItem>(header, field, { type: "number", min: 0 });

  return [
    nameBulkColumn(),
    manufacturerBulkColumn(manufacturers, series, sockets),
    idSelectBulkColumn(ui.label("series"), "seriesId", (row) =>
      series.filter((item) => item.manufacturerId === row.manufacturerId),
    ),
    idSelectBulkColumn(ui.label("socket"), "socketId", (row) =>
      sockets.filter((item) => item.manufacturerId === row.manufacturerId),
    ),
    counted(ui.label("maxMemoryGb"), "maxMemoryGb"),
    switchBulkColumn(ui.label("integratedGraphics"), "integratedGraphics", ui.label("yes"), ui.label("no")),
    switchBulkColumn(ui.label("includedStockCooler"), "includedStockCooler", ui.label("yes"), ui.label("no")),
    counted(ui.label("thermalDesignPowerW"), "thermalDesignPower"),
    counted(ui.label("powerConsumptionW"), "powerConsumptionWatts"),
  ];
}

function manufacturerField(
  manufacturers: { id: string; name: string }[],
  series: readonly OwnedOption[],
  sockets: readonly OwnedOption[],
): CatalogField<CpuListItem> {
  const field = idSelectField<CpuListItem>(
    ui.label("manufacturer"),
    "manufacturerId",
    manufacturers,
  );
  return {
    ...field,
    control: (item, update) =>
      field.control(item, (next) => {
        const manufacturerId = next.manufacturerId;
        update({
          ...next,
          seriesId: belongsToManufacturer(series, item.seriesId, manufacturerId)
            ? item.seriesId
            : "",
          socketId: belongsToManufacturer(sockets, item.socketId, manufacturerId)
            ? item.socketId
            : "",
        });
      }),
  };
}

export function CpuFields(
  manufacturers: { id: string; name: string }[],
  series: OwnedOption[],
  sockets: OwnedOption[],
): CatalogField<CpuListItem>[] {
  const counted = (label: string, field: CountedField) =>
    integerField<CpuListItem>(label, field, { type: "number", min: 0 });

  return [
    nameField(),
    manufacturerField(manufacturers, series, sockets),
    idSelectField(ui.label("series"), "seriesId", (item) =>
      series.filter((option) => option.manufacturerId === item.manufacturerId),
    ),
    idSelectField(ui.label("socket"), "socketId", (item) =>
      sockets.filter((option) => option.manufacturerId === item.manufacturerId),
    ),
    counted(ui.label("maxMemoryGb"), "maxMemoryGb"),
    checkboxField(ui.label("integratedGraphics"), "integratedGraphics"),
    checkboxField(ui.label("includedStockCooler"), "includedStockCooler"),
    counted(ui.label("thermalDesignPowerW"), "thermalDesignPower"),
    counted(ui.label("powerConsumptionW"), "powerConsumptionWatts"),
  ];
}
