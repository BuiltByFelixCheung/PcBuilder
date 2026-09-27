import type { ColumnHelper, RowData } from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { catalogNameCell } from "./CatalogNameCell";

type CatalogRow = { id: string; name: string; manufacturerName: string };

export function catalogLeadColumns<T extends CatalogRow & RowData>(
  columnHelper: ColumnHelper<typeof dataTableFeatures, T>,
  isAdmin: boolean,
  detailPath: (id: string) => string,
) {
  return [
    ...(isAdmin ? [createSelectionColumn(columnHelper)] : []),
    columnHelper.accessor((row) => row.name, {
      id: "name",
      header: "Name",
      cell: (info) =>
        catalogNameCell(detailPath(info.row.original.id), info.getValue()),
    }),
    columnHelper.accessor((row) => row.manufacturerName, {
      id: "manufacturerName",
      header: "Manufacturer",
    }),
  ];
}
