import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  listSockets,
  masterDataKeys,
  deleteSockets,
  updateSockets,
  type SocketOption,
  importSockets,
} from "@/api/master-data";
import {
  BulkEditDialog,
  type BulkEditColumn,
} from "@/components/BulkEditDialog";
import { SocketFormDialog } from "@/components/master-data/SocketFormDialog";
import {
  closeMasterDataEditor,
  newMasterDataEditValue,
  socketEditPath,
} from "@/lib/master-data-edit";
import { uniqueById } from "@/lib/unique-by-id";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useExcelImport } from "@/hooks/use-excel-import";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  FilterActions,
  formSelectClassName,
  NameField,
} from "@/components/filters/ListFilters";
import { MasterDataResults } from "@/components/master-data/MasterDataResults";

const EMPTY_ITEMS: SocketOption[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  SocketOption
>();
type SocketFilter = {
  name?: string;
  manufacturerId?: string;
};

const emptySocketFilter: SocketFilter = {};

function isSocketFilterActive(filter: SocketFilter) {
  return Boolean(filter.name || filter.manufacturerId);
}

const columns = columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <Link to={socketEditPath(info.row.original.id)}>{info.getValue()}</Link>
    ),
  }),
  columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
]);

function socketEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<SocketOption>[] {
  return [
    {
      header: "Name",
      cell: (row, update) => (
        <Input
          aria-label={`Name for ${row.name}`}
          value={row.name}
          onChange={(event) => update({ ...row, name: event.target.value })}
        />
      ),
    },
    {
      header: "Manufacturer",
      cell: (row, update) => (
        <select
          aria-label={`Manufacturer for ${row.name}`}
          className={formSelectClassName}
          value={row.manufacturerId}
          onChange={(event) =>
            update({ ...row, manufacturerId: event.target.value })
          }
        >
          {manufacturers.map((manufacturer) => (
            <option key={manufacturer.id} value={manufacturer.id}>
              {manufacturer.name}
            </option>
          ))}
        </select>
      ),
    },
  ];
}

export function SocketListPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: masterDataKeys.sockets,
    queryFn: () => listSockets(),
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<SocketFilter>(emptySocketFilter);
  const [applied, setApplied] = useState<SocketFilter>(emptySocketFilter);
  const filtering = isSocketFilterActive(applied);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editRows, setEditRows] = useState<SocketOption[] | null>(null);
  const manufacturers = useMemo(
    () =>
      uniqueById(
        items.map((item) => ({
          id: item.manufacturerId,
          name: item.manufacturerName,
        })),
      ),
    [items],
  );

  const visibleItems = useMemo(() => {
    const name = applied.name?.trim().toLowerCase();
    return items.filter((item) => {
      if (name && !item.name.toLowerCase().includes(name)) return false;
      if (
        applied.manufacturerId &&
        item.manufacturerId !== applied.manufacturerId
      )
        return false;
      return true;
    });
  }, [items, applied]);
  const bulkDelete = useBulkDelete({
    items: visibleItems,
    rowSelection,
    setRowSelection,
    queryKey: masterDataKeys.sockets,
    singular: "socket",
    plural: "sockets",
    deleteByIds: (ids) => deleteSockets({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: masterDataKeys.sockets,
    importFile: importSockets,
  });
  function startEditing() {
    const selected = visibleItems.filter((item) => rowSelection[item.id]);
    if (selected.length === 0) return;
    setEditRows(selected);
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptySocketFilter);
    setApplied(emptySocketFilter);
    setRowSelection({});
    setEditRows(null);
  }

  return (
    <section className="catalog-page">
      <h1>Sockets</h1>
      <p className="catalog-lead">
        Browse the master data, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <NameField
              id="socket-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <Field>
              <FieldLabel htmlFor="socket-manufacturer">
                Manufacturer
              </FieldLabel>
              <select
                id="socket-manufacturer"
                className={formSelectClassName}
                value={draft.manufacturerId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    manufacturerId: event.target.value || undefined,
                  }))
                }
              >
                <option value="">All</option>
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGroup>
          <FilterActions onClear={clearFilters} />
        </form>
        <div className="catalog-results">
          <MasterDataResults
            isInitialLoading={query.isPending && !query.data}
            isError={query.isError}
            error={query.error}
            items={visibleItems}
            filtering={filtering}
            loadingMessage="Loading sockets…"
            emptyFilteredMessage="No sockets match these filters."
            emptyMessage="No sockets yet."
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onEditSelected={startEditing}
            onImport={excelImport.openImport}
            newItemTo={socketEditPath(newMasterDataEditValue)}
            newItemLabel="New Socket"
          />
        </div>
      </div>
      {editRows ? (
        <BulkEditDialog
          title="Edit sockets"
          rows={editRows}
          columns={socketEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            const sockets = rows.map((row) => ({
              ...row,
              name: row.name.trim(),
              manufacturerName:
                manufacturers.find((item) => item.id === row.manufacturerId)
                  ?.name ?? row.manufacturerName,
            }));
            if (sockets.some((row) => row.name.length === 0)) {
              throw new Error("Name is required.");
            }
            if (sockets.some((row) => row.name.length > 200)) {
              throw new Error("Name must not exceed 200 characters.");
            }
            await updateSockets(sockets);
            await queryClient.invalidateQueries({
              queryKey: masterDataKeys.sockets,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {editingId ? (
        <SocketFormDialog
          key={editingId}
          editingId={editingId}
          sockets={items}
          socketsSettled={query.isSuccess || query.isError}
          onClose={() => closeMasterDataEditor(searchParams, setSearchParams)}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
