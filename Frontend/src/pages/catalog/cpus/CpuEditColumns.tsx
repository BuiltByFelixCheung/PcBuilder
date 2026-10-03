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
    "Manufacturer",
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
    idSelectBulkColumn("Series", "seriesId", (row) =>
      series.filter((item) => item.manufacturerId === row.manufacturerId),
    ),
    idSelectBulkColumn("Socket", "socketId", (row) =>
      sockets.filter((item) => item.manufacturerId === row.manufacturerId),
    ),
    counted("Max memory (GB)", "maxMemoryGb"),
    switchBulkColumn("Integrated graphics", "integratedGraphics", "Yes", "No"),
    switchBulkColumn("Included stock cooler", "includedStockCooler", "Yes", "No"),
    counted("Thermal design power (W)", "thermalDesignPower"),
    counted("Power consumption (W)", "powerConsumptionWatts"),
  ];
}

function manufacturerField(
  manufacturers: { id: string; name: string }[],
  series: readonly OwnedOption[],
  sockets: readonly OwnedOption[],
): CatalogField<CpuListItem> {
  const field = idSelectField<CpuListItem>(
    "Manufacturer",
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
    idSelectField("Series", "seriesId", (item) =>
      series.filter((option) => option.manufacturerId === item.manufacturerId),
    ),
    idSelectField("Socket", "socketId", (item) =>
      sockets.filter((option) => option.manufacturerId === item.manufacturerId),
    ),
    counted("Max memory (GB)", "maxMemoryGb"),
    checkboxField("Integrated graphics", "integratedGraphics"),
    checkboxField("Included stock cooler", "includedStockCooler"),
    counted("Thermal design power (W)", "thermalDesignPower"),
    counted("Power consumption (W)", "powerConsumptionWatts"),
  ];
}
