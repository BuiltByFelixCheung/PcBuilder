import { type ColumnHelper, type RowData } from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { Checkbox } from "./checkbox";

type Selectable = { id: string };

export function createSelectionColumn<TData extends Selectable & RowData>(
  columnHelper: ColumnHelper<typeof dataTableFeatures, TData>,
) {
  return columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all rows"
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
      />
    ),
  });
}
