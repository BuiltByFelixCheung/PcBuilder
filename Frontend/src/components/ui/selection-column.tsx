import { type ColumnHelper, type RowData } from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";

type Selectable = { id: string };

export function createSelectionColumn<TData extends Selectable & RowData>(
  columnHelper: ColumnHelper<typeof dataTableFeatures, TData>,
) {
  return columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  });
}
