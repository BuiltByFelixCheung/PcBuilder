import { useSearchParams } from "react-router-dom";
import type {
  OnChangeFn,
  RowData,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus";
import { ManagementActions } from "@/components/ManagementActions";
import { DataTable, type DataTableColumns } from "@/components/ui/data-table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

function pageItems(pageIndex: number, pageCount: number) {
  const current = pageIndex + 1;
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pageCount - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < pageCount - 1) pages.push("ellipsis");
  pages.push(pageCount);
  return pages;
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
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={pageIndex === 0}
              onClick={() => onPageChange(pageIndex - 1)}
            />
          </PaginationItem>
          {pageItems(pageIndex, pageCount).map((item, index) => (
            <PaginationItem key={item === "ellipsis" ? `ellipsis-${index}` : item}>
              {item === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={item === pageIndex + 1}
                  onClick={() => onPageChange(item - 1)}
                >
                  {item}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              disabled={pageIndex + 1 >= pageCount}
              onClick={() => onPageChange(pageIndex + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}
