import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteMultipleGpuSeries,
  listGpuSeries,
  masterDataKeys,
  type GpuSeriesOption,
  importGpuSeries,
} from "@/api/master-data";
import { GpuSeriesFormDialog } from "@/components/master-data/GpuSeriesFormDialog";
import {
  closeMasterDataEditor,
  gpuSeriesEditPath,
  newMasterDataEditValue,
} from "@/lib/master-data-edit";
import { uniqueById } from "@/lib/unique-by-id";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery } from "@tanstack/react-query";
import {
  FilterActions,
  formSelectClassName,
  NameField,
} from "@/components/filters/ListFilters";
import { MasterDataResults } from "@/components/master-data/MasterDataResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useExcelImport } from "@/hooks/use-excel-import";

const EMPTY_ITEMS: GpuSeriesOption[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  GpuSeriesOption
>();
const columns = columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <Link to={gpuSeriesEditPath(info.row.original.id)}>
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
]);

type GpuSeriesFilter = {
  name?: string;
  manufacturerId?: string;
};

const emptyGpuSeriesFilter: GpuSeriesFilter = {};

function isGpuSeriesFilterActive(filter: GpuSeriesFilter) {
  return Object.values(filter).some((value) => value !== undefined);
}

export function GpuSeriesListPage() {
  const query = useQuery({
    queryKey: masterDataKeys.gpuSeries,
    queryFn: listGpuSeries,
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<GpuSeriesFilter>(emptyGpuSeriesFilter);
  const [applied, setApplied] = useState<GpuSeriesFilter>(emptyGpuSeriesFilter);
  const filtering = isGpuSeriesFilterActive(applied);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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
  }, [applied, items]);
  const bulkDelete = useBulkDelete({
    items: visibleItems,
    rowSelection,
    setRowSelection,
    queryKey: masterDataKeys.gpuSeries,
    singular: "GPU series",
    plural: "GPU series",
    deleteByIds: (ids) => deleteMultipleGpuSeries({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: masterDataKeys.gpuSeries,
    importFile: importGpuSeries,
  });

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptyGpuSeriesFilter);
    setApplied(emptyGpuSeriesFilter);
  }

  return (
    <section className="catalog-page">
      <h1>GPU Series</h1>
      <p className="catalog-lead">
        Browse the master data, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <NameField
              id="gpu-series-name"
              name="name"
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
            />
            <Field>
              <FieldLabel htmlFor="gpu-series-manufacturer">
                Manufacturer
              </FieldLabel>
              <select
                id="gpu-series-manufacturer"
                className={formSelectClassName}
                value={draft.manufacturerId ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, manufacturerId: event.target.value })
                }
              >
                <option value="">Any</option>
                {manufacturers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
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
            loadingMessage="Loading GPU Series…"
            emptyFilteredMessage="No GPU Series match these filters."
            emptyMessage="No GPU Series found."
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onImport={excelImport.openImport}
            newItemTo={gpuSeriesEditPath(newMasterDataEditValue)}
            newItemLabel="New GPU Series"
          />
        </div>
      </div>
      {editingId ? (
        <GpuSeriesFormDialog
          key={editingId}
          editingId={editingId}
          gpuSeries={items}
          gpuSeriesSettled={query.isSuccess || query.isError}
          onClose={() => closeMasterDataEditor(searchParams, setSearchParams)}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
