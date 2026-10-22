import type { ColumnHelper, RowData } from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { catalogNameCell } from "./CatalogNameCell";
import { ui } from "@/i18n/translate-enum";

type CatalogRow = { id: string; name: string; manufacturerName: string };

export function unitColumn<T extends RowData>(
  columnHelper: ColumnHelper<typeof dataTableFeatures, T>,
  id: Extract<keyof T, string>,
  header: string,
  unit: string,
) {
  return columnHelper.accessor((row) => row[id] as string | number, {
    id,
    header,
    cell: (info) => `${info.getValue()} ${unit}`,
  });
}

export function yesNoColumn<T extends RowData>(
  columnHelper: ColumnHelper<typeof dataTableFeatures, T>,
  id: Extract<keyof T, string>,
  header: string,
) {
  return columnHelper.accessor((row) => Boolean(row[id]), {
    id,
    header,
    cell: (info) => (info.getValue() ? ui.label("yes") : ui.label("no")),
  });
}

export function catalogLeadColumns<T extends CatalogRow & RowData>(
  columnHelper: ColumnHelper<typeof dataTableFeatures, T>,
  isAdmin: boolean,
  detailPath: (id: string) => string,
) {
  return [
    ...(isAdmin ? [createSelectionColumn(columnHelper)] : []),
    columnHelper.accessor((row) => row.name, {
      id: "name",
      header: ui.header("name"),
      cell: (info) =>
        catalogNameCell(detailPath(info.row.original.id), info.getValue()),
    }),
    columnHelper.accessor((row) => row.manufacturerName, {
      id: "manufacturerName",
      header: ui.header("manufacturer"),
    }),
  ];
}
