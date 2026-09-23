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
  pageIndex,
  pageCount,
  totalCount,
  countLabel,
  onPageChange,
}: Readonly<
  CatalogResultsBase<TData> & {
    isAdmin: boolean;
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
  if (items.length === 0) {
    return (
      <PageStatus>{filtering ? emptyFilteredMessage : emptyMessage}</PageStatus>
    );
  }

  const hasSelection = selectionActive(rowSelection);

  return (
    <>
      {isAdmin && (
        <div className="catalog-results-actions">
          <Button disabled={!hasSelection}>Edit Selected</Button>
          <Button disabled={!hasSelection}>Delete Selected</Button>
          <Button>{newItemLabel}</Button>
          <Button>Import</Button>
        </div>
      )}
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
  newItemTo,
  newItemLabel,
  showImport = true,
  keepTableWhenEmpty = false,
}: Readonly<
  CatalogResultsBase<TData> & {
    newItemTo: string;
    newItemLabel: string;
    showImport?: boolean;
    keepTableWhenEmpty?: boolean;
  }
>) {
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
      <div className="catalog-results-actions">
        <Button disabled={!hasSelection}>Edit Selected</Button>
        <Button disabled={!hasSelection}>Delete Selected</Button>
        <Button asChild>
          <Link
            style={{ textDecoration: "none", color: "black" }}
            to={newItemTo}
          >
            {newItemLabel}
          </Link>
        </Button>
        {showImport ? <Button>Import</Button> : null}
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
