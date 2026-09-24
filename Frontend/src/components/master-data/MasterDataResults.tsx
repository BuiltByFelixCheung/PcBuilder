import type {
  OnChangeFn,
  RowData,
  RowSelectionState,
} from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus";
import { Button } from "@/components/ui/button";
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
      <div className="catalog-results-actions">
        <Button
          type="button"
          disabled={!hasSelection || !onEditSelected}
          onClick={onEditSelected}
        >
          Edit Selected
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!hasSelection || deleting}
          onClick={onDeleteSelected}
        >
          {deleting ? "Deleting…" : "Delete Selected"}
        </Button>
        <Button asChild>
          <Link
            style={{ textDecoration: "none", color: "black" }}
            to={newItemTo}
          >
            {newItemLabel}
          </Link>
        </Button>
        {showImport ? (
          <Button type="button" onClick={onImport}>
            Import
          </Button>
        ) : null}
      </div>
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
