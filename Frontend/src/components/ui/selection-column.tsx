import { type ColumnHelper, type RowData } from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { Checkbox } from "./checkbox";
import { ui } from "@/i18n/translate-enum";

type Selectable = { id: string };

export function createSelectionColumn<TData extends Selectable & RowData>(
  columnHelper: ColumnHelper<typeof dataTableFeatures, TData>,
) {
  return columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label={ui.action("selectAllRows")}
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={ui.action("selectRow")}
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
      />
    ),
  });
}
