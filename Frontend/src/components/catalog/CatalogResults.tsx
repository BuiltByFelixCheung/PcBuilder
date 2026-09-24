import type {
  OnChangeFn,
  RowData,
  RowSelectionState,
} from "@tanstack/react-table";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumns } from "@/components/ui/data-table";

type CatalogResultsBase<TData extends RowData> = {
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
};

function selectionActive(rowSelection: RowSelectionState) {
  return Object.values(rowSelection).some(Boolean);
}

export function CatalogPagedResults<TData extends RowData>({
  isInitialLoading,
  isError,
  error,
  items,
  filtering,
  loadingMessage,
  emptyFilteredMessage,
  emptyMessage,
  isAdmin,
  newItemLabel,
  columns,
  rowSelection,
  onRowSelectionChange,
  onDeleteSelected,
  deleting = false,
  deleteError = null,
  onImport,
  pageIndex,
  pageCount,
  totalCount,
  countLabel,
  onPageChange,
}: Readonly<
  CatalogResultsBase<TData> & {
    isAdmin: boolean;
    onDeleteSelected: () => void;
    deleting?: boolean;
    deleteError?: string | null;
    onImport: () => void;
    newItemLabel: string;
    pageIndex: number;
    pageCount: number;
    totalCount: number;
    countLabel: string;
    onPageChange: (pageIndex: number) => void;
  }
>) {
  if (isInitialLoading) {
    return <PageStatus>{loadingMessage}</PageStatus>;
  }
  if (isError) {
    return <PageStatus>{parseApiError(error).message}</PageStatus>;
  }
  const hasSelection = selectionActive(rowSelection);
  const adminActions = isAdmin ? (
    <>
      {deleteError ? (
        <p className="form-error" role="alert">
          {deleteError}
        </p>
      ) : null}
      <div className="catalog-results-actions">
        <Button type="button" disabled={!hasSelection}>
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
        <Button type="button">{newItemLabel}</Button>
        <Button type="button" onClick={onImport}>
          Import
        </Button>
      </div>
    </>
  ) : null;

  if (items.length === 0) {
    return (
      <>
        {adminActions}
        <PageStatus>
          {filtering ? emptyFilteredMessage : emptyMessage}
        </PageStatus>
      </>
    );
  }

  return (
    <>
      {adminActions}
      <DataTable
        data={items}
        columns={columns}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
      />
      <div className="catalog-pagination">
        <p>
          Page {pageIndex + 1} of {pageCount} ({totalCount} {countLabel})
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pageIndex === 0}
            onClick={() => onPageChange(pageIndex - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pageIndex + 1 >= pageCount}
            onClick={() => onPageChange(pageIndex + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}
