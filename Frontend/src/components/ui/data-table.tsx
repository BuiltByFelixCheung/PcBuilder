import {
  flexRender,
  useTable,
  type ColumnHelper,
  type OnChangeFn,
  type RowData,
  type RowSelectionState,
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

type DataTableProps<TData extends RowData> = {
  data: TData[];
  columns: DataTableColumns<TData>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
};

export function DataTable<TData extends RowData>({
  data,
  columns,
  rowSelection,
  onRowSelectionChange,
}: Readonly<DataTableProps<TData>>) {
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId: (row, index) => (hasStringId(row) ? row.id : String(index)),
    state: rowSelection !== undefined ? { rowSelection } : undefined,
    onRowSelectionChange,
    enableRowSelection: rowSelection !== undefined,
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
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
