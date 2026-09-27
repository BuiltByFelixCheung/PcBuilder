import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteManufacturers,
  updateManufacturers,
  listManufacturers,
  masterDataKeys,
  type NamedMasterData,
  importManufacturers,
} from "@/api/master-data";
import { ManufacturerFormDialog } from "@/components/master-data/ManufacturerFormDialog";
import {
  closeMasterDataEditor,
  manufacturerEditPath,
  newMasterDataEditValue,
} from "@/lib/master-data-edit";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MasterDataResults } from "@/components/master-data/MasterDataResults";
import { FilterActions } from "@/components/filters/ListFilters";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useExcelImport } from "@/hooks/use-excel-import";
import { BulkEditDialog, type BulkEditColumn } from "@/components/BulkEditDialog";

const EMPTY_ITEMS: NamedMasterData[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  NamedMasterData
>();
const columns = columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <Link to={manufacturerEditPath(info.row.original.id)}>
        {info.getValue()}
      </Link>
    ),
  }),
]);

function manufacturerEditColumns(): BulkEditColumn<NamedMasterData>[] {
  return [
    {
      header: "Name",
      cell: (row, update) =>
        <Input
          aria-label={`Name for ${row.name}`}
          value={row.name}
          onChange={(event) => update({ ...row, name: event.target.value })}
        />
      ,
    },
  ];
}

type ManufacturerFilter = {
  name?: string;
};

const emptyManufacturerFilter: ManufacturerFilter = {};

function isManufacturerFilterActive(filter: ManufacturerFilter) {
  return Object.values(filter).some(Boolean);
}

export function ManufacturerListPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: masterDataKeys.manufacturers,
    queryFn: listManufacturers,
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<ManufacturerFilter>(
    emptyManufacturerFilter,
  );
  const [applied, setApplied] = useState<ManufacturerFilter>(
    emptyManufacturerFilter,
  );
  const filtering = isManufacturerFilterActive(applied);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editRows, setEditRows] = useState<NamedMasterData[] | null>(null);
  const visibleItems = useMemo(() => {
    const name = applied.name?.trim().toLowerCase();
    return items.filter((item) => {
      if (name && !item.name.toLowerCase().includes(name)) return false;
      return true;
    });
  }, [applied, items]);
  const bulkDelete = useBulkDelete({
    items: visibleItems,
    rowSelection,
    setRowSelection,
    queryKey: masterDataKeys.manufacturers,
    singular: "manufacturer",
    plural: "manufacturers",
    deleteByIds: (ids) => deleteManufacturers({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: masterDataKeys.manufacturers,
    importFile: importManufacturers,
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
    setDraft(emptyManufacturerFilter);
    setApplied(emptyManufacturerFilter);
  }

  return (
    <section className="catalog-page">
      <h1>Manufacturers</h1>
      <p className="catalog-lead">
        Browse the master data, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                id="manufacturer-name"
                name="name"
                value={draft.name ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
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
            loadingMessage="Loading Manufacturers…"
            emptyFilteredMessage="No Manufacturers match these filters."
            emptyMessage="No Manufacturers found."
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onEditSelected={startEditing}
            onImport={excelImport.openImport}
            newItemTo={manufacturerEditPath(newMasterDataEditValue)}
            newItemLabel="New Manufacturer"
            keepTableWhenEmpty
          />
        </div>
        {editRows ? (
          <BulkEditDialog
            title="Edit manufacturers"
            rows={editRows}
            columns={manufacturerEditColumns()}
            onClose={() => setEditRows(null)}
            onSave={async (rows) => {
              await updateManufacturers(rows);
              await queryClient.invalidateQueries({
                queryKey: masterDataKeys.manufacturers,
              });
              setRowSelection({});
            }}
          />
        ) : null}
        {editingId ? (
          <ManufacturerFormDialog
            key={editingId}
            editingId={editingId}
            manufacturers={items}
            manufacturersSettled={query.isSuccess || query.isError}
            onClose={() => closeMasterDataEditor(searchParams, setSearchParams)}
          />
        ) : null}
      </div>
      {excelImport.importDialog}
    </section>
  );
}
