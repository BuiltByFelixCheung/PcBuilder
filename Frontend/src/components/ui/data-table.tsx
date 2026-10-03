import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  flexRender,
  useTable,
  type ColumnHelper,
  type Header,
  type OnChangeFn,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function hasStringId(row: RowData): row is RowData & { id: string } {
  return (
    typeof row === "object" &&
    row !== null &&
    "id" in row &&
    typeof row.id === "string"
  );
}

type DataTableColumns<TData extends RowData> = ReturnType<
  ColumnHelper<typeof dataTableFeatures, TData>["columns"]
>;

export type { DataTableColumns };

type DataTableProps<TData extends RowData> = {
  data: TData[];
  columns: DataTableColumns<TData>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
};

function ariaSort(
  sorted: false | "asc" | "desc",
  canSort: boolean,
): "ascending" | "descending" | "none" | undefined {
  if (sorted === "asc") return "ascending";
  if (sorted === "desc") return "descending";
  if (canSort) return "none";
  return undefined;
}

function sortLabel(sorted: false | "asc" | "desc") {
  if (sorted === "asc") return <ArrowUp aria-hidden />;
  if (sorted === "desc") return <ArrowDown aria-hidden />;
  return <ArrowUpDown aria-hidden className="table-sort-idle" />;
}

function columnHeader<TData extends RowData>(
  header: Header<typeof dataTableFeatures, TData>,
) {
  if (header.isPlaceholder) return null;
  const label = flexRender(header.column.columnDef.header, header.getContext());
  if (!header.column.getCanSort()) return label;
  const sorted = header.column.getIsSorted();
  return (
    <button
      type="button"
      className="table-sort"
      onClick={header.column.getToggleSortingHandler()}
    >
      {label}
      {sortLabel(sorted)}
    </button>
  );
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  rowSelection,
  onRowSelectionChange,
  manualSorting = false,
  sorting,
  onSortingChange,
}: Readonly<DataTableProps<TData>>) {
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId: (row, index) => (hasStringId(row) ? row.id : String(index)),
    state: {
      ...(rowSelection !== undefined ? { rowSelection } : {}),
      ...(sorting !== undefined ? { sorting } : {}),
    },
    onRowSelectionChange,
    ...(onSortingChange ? { onSortingChange } : {}),
    enableRowSelection: rowSelection !== undefined,
    enableMultiSort: false,
    sortDescFirst: false,
    manualSorting,
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const sorted = header.column.getCanSort()
                ? header.column.getIsSorted()
                : false;
              return (
                <TableHead
                  key={header.id}
                  aria-sort={ariaSort(sorted, header.column.getCanSort())}
                >
                  {columnHeader(header)}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
