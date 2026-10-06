import { useSearchParams } from "react-router-dom";
import type {
  OnChangeFn,
  RowData,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { parseApiError } from "@/api/errors.ts";
import { ListPagination } from "@/components/ListPagination";
import { PageStatus } from "@/components/PageStatus";
import { ManagementActions } from "@/components/ManagementActions";
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
  newItemTo,
  onNewItem,
  columns,
  rowSelection,
  onRowSelectionChange,
  onDeleteSelected,
  deleting = false,
  deleteError = null,
  onImport,
  onEditSelected,
  pageIndex,
  pageCount,
  onPageChange,
}: Readonly<
  CatalogResultsBase<TData> & {
    isAdmin: boolean;
    onDeleteSelected: () => void;
    onEditSelected?: () => void;
    deleting?: boolean;
    deleteError?: string | null;
    onImport: () => void;
    newItemLabel: string;
    newItemTo?: string;
    onNewItem?: () => void;
    pageIndex: number;
    pageCount: number;
    onPageChange: (pageIndex: number) => void;
  }
>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get("sort")?.trim() || "name";
  const sortDescending = searchParams.get("dir") === "desc";
  const sorting: SortingState = [{ id: sortBy, desc: sortDescending }];

  function onSortingChange(updater: Parameters<OnChangeFn<SortingState>>[0]) {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const sort = next[0];
    const updated = new URLSearchParams(searchParams);
    if (!sort || (sort.id === "name" && !sort.desc)) {
      updated.delete("sort");
      updated.delete("dir");
    } else {
      updated.set("sort", sort.id);
      if (sort.desc) updated.set("dir", "desc");
      else updated.delete("dir");
    }
    updated.delete("page");
    setSearchParams(updated);
  }

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
      <ManagementActions
        hasSelection={hasSelection}
        deleting={deleting}
        onEditSelected={onEditSelected}
        onDeleteSelected={onDeleteSelected}
        onImport={onImport}
        newItemLabel={newItemLabel}
        newItemTo={newItemTo}
        onNewItem={onNewItem}
      />
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
        manualSorting
        sorting={sorting}
        onSortingChange={onSortingChange}
      />
      <ListPagination
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
    </>
  );
}
