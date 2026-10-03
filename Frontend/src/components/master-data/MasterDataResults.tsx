import type {
  OnChangeFn,
  RowData,
  RowSelectionState,
} from "@tanstack/react-table";
import { parseApiError } from "@/api/errors.ts";
import { ManagementActions } from "@/components/ManagementActions";
import { PageStatus } from "@/components/PageStatus";
import { DataTable, type DataTableColumns } from "@/components/ui/data-table";

type MasterDataResultsProps<TData extends RowData> = {
  isInitialLoading: boolean;
  isError: boolean;
  error: unknown;
  items: TData[];
  filtering: boolean;
  loadingMessage: string;
  emptyFilteredMessage: string;
  emptyMessage: string;
  columns: DataTableColumns<TData>;
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  onDeleteSelected: () => void;
  deleting?: boolean;
  deleteError?: string | null;
  onEditSelected?: () => void;
  onImport: () => void;
  newItemTo: string;
  newItemLabel: string;
  showImport?: boolean;
  keepTableWhenEmpty?: boolean;
};

function selectionActive(rowSelection: RowSelectionState) {
  return Object.values(rowSelection).some(Boolean);
}

export function MasterDataResults<TData extends RowData>({
  isInitialLoading,
  isError,
  error,
  items,
  filtering,
  loadingMessage,
  emptyFilteredMessage,
  emptyMessage,
  columns,
  rowSelection,
  onRowSelectionChange,
  onDeleteSelected,
  deleting = false,
  deleteError = null,
  onEditSelected,
  onImport,
  newItemTo,
  newItemLabel,
  showImport = true,
  keepTableWhenEmpty = false,
}: Readonly<MasterDataResultsProps<TData>>) {
  if (isInitialLoading) {
    return <PageStatus>{loadingMessage}</PageStatus>;
  }
  if (isError) {
    return <PageStatus>{parseApiError(error).message}</PageStatus>;
  }

  const hasSelection = selectionActive(rowSelection);
  const emptyStatus =
    items.length === 0 ? (
      <PageStatus>{filtering ? emptyFilteredMessage : emptyMessage}</PageStatus>
    ) : null;

  return (
    <>
      {deleteError ? (
        <p className="form-error" role="alert">
          {deleteError}
        </p>
      ) : null}
      <ManagementActions
        hasSelection={hasSelection}
        deleting={deleting}
        onEditSelected={onEditSelected}
        onDeleteSelected={onDeleteSelected}
        onImport={onImport}
        showImport={showImport}
        newItemLabel={newItemLabel}
        newItemTo={newItemTo}
      />
      {keepTableWhenEmpty ? (
        <>
          {emptyStatus}
          <DataTable
            data={items}
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={onRowSelectionChange}
          />
        </>
      ) : (
        (emptyStatus ?? (
          <DataTable
            data={items}
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={onRowSelectionChange}
          />
        ))
      )}
    </>
  );
}
