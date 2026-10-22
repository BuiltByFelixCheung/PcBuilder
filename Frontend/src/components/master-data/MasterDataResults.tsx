import type {
  OnChangeFn,
  RowData,
  RowSelectionState,
} from "@tanstack/react-table";
import { parseApiError } from "@/api/errors.ts";
import { ManagementActions } from "@/components/ManagementActions";
import { PageStatus } from "@/components/PageStatus";
import { DataTable, type DataTableColumns } from "@/components/ui/data-table";
import { ui } from "@/i18n/translate-enum";

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

type MasterDataListQuery = {
  isPending: boolean;
  data?: unknown;
  isError: boolean;
  error: unknown;
};

type MasterDataBulkDelete = {
  onDeleteSelected: () => void | Promise<void>;
  isDeleting: boolean;
  deleteError: string | null;
};

export function MasterDataListResults<TData extends RowData>({
  entity,
  empty = "noneFound",
  query,
  items,
  filtering,
  columns,
  rowSelection,
  onRowSelectionChange,
  bulkDelete,
  onEditSelected,
  onImport,
  newItemTo,
  newItemLabel,
  keepTableWhenEmpty = false,
}: Readonly<{
  entity: string;
  empty?: "noneFound" | "noneYet";
  query: MasterDataListQuery;
  items: TData[];
  filtering: boolean;
  columns: DataTableColumns<TData>;
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  bulkDelete: MasterDataBulkDelete;
  onEditSelected?: () => void;
  onImport: () => void;
  newItemTo: string;
  newItemLabel: string;
  keepTableWhenEmpty?: boolean;
}>) {
  return (
    <div className="catalog-results">
      <MasterDataResults
        isInitialLoading={query.isPending && !query.data}
        isError={query.isError}
        error={query.error}
        items={items}
        filtering={filtering}
        loadingMessage={ui.empty("loading", { entity: ui.entity(entity) })}
        emptyFilteredMessage={ui.empty("noMatchFilters", {
          entity: ui.entity(entity),
        })}
        emptyMessage={ui.empty(empty, { entity: ui.entity(entity) })}
        columns={columns}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
        onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
        deleting={bulkDelete.isDeleting}
        deleteError={bulkDelete.deleteError}
        onEditSelected={onEditSelected}
        onImport={onImport}
        newItemTo={newItemTo}
        newItemLabel={newItemLabel}
        keepTableWhenEmpty={keepTableWhenEmpty}
      />
    </div>
  );
}
