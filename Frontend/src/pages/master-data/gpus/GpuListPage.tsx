import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteGpus,
  listGpus,
  masterDataKeys,
  type GpuOption,
  importGpus,
} from "@/api/master-data";
import { GpuFormDialog } from "@/components/master-data/GpuFormDialog";
import {
  closeMasterDataEditor,
  gpuEditPath,
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

const EMPTY_ITEMS: GpuOption[] = [];
const columnHelper = createColumnHelper<typeof dataTableFeatures, GpuOption>();
const columns = columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <Link to={gpuEditPath(info.row.original.id)}>{info.getValue()}</Link>
    ),
  }),
  columnHelper.accessor("manufacturerName", {
    header: "Manufacturer",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("gpuSeriesName", {
    header: "Series",
    cell: (info) => info.getValue(),
  }),
]);

type GpuFilter = {
  name?: string;
  manufacturerId?: string;
  gpuSeriesId?: string;
};

const emptyGpuFilter: GpuFilter = {};

function isGpuFilterActive(filter: GpuFilter) {
  return Object.values(filter).some(Boolean);
}

export function GpuListPage() {
  const query = useQuery({
    queryKey: masterDataKeys.gpus,
    queryFn: listGpus,
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<GpuFilter>(emptyGpuFilter);
  const [applied, setApplied] = useState<GpuFilter>(emptyGpuFilter);
  const filtering = isGpuFilterActive(applied);
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
  const series = useMemo(
    () =>
      uniqueById(
        items.map((item) => ({
          id: item.gpuSeriesId,
          name: item.gpuSeriesName,
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
      if (applied.gpuSeriesId && item.gpuSeriesId !== applied.gpuSeriesId)
        return false;
      return true;
    });
  }, [applied, items]);
  const bulkDelete = useBulkDelete({
    items: visibleItems,
    rowSelection,
    setRowSelection,
    queryKey: masterDataKeys.gpus,
    singular: "GPU",
    plural: "GPUs",
    deleteByIds: (ids) => deleteGpus({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: masterDataKeys.gpus,
    importFile: importGpus,
  });

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptyGpuFilter);
    setApplied(emptyGpuFilter);
  }

  return (
    <section className="catalog-page">
      <h1>GPUs</h1>
      <p className="catalog-lead">
        Browse the master data, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <NameField
              id="gpu-name"
              name="name"
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
            />
            <Field>
              <FieldLabel htmlFor="gpu-manufacturer">Manufacturer</FieldLabel>
              <select
                id="gpu-manufacturer"
                name="manufacturerId"
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
            <Field>
              <FieldLabel htmlFor="gpu-series">Series</FieldLabel>
              <select
                id="gpu-series"
                name="gpuSeriesId"
                className={formSelectClassName}
                value={draft.gpuSeriesId ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, gpuSeriesId: event.target.value })
                }
              >
                <option value="">Any</option>
                {series.map((item) => (
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
            loadingMessage="Loading GPUs…"
            emptyFilteredMessage="No GPUs match these filters."
            emptyMessage="No GPUs found."
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onImport={excelImport.openImport}
            newItemTo={gpuEditPath(newMasterDataEditValue)}
            newItemLabel="New GPU"
            keepTableWhenEmpty
          />
        </div>
        {editingId ? (
          <GpuFormDialog
            key={editingId}
            editingId={editingId}
            gpus={items}
            gpusSettled={query.isSuccess || query.isError}
            onClose={() => closeMasterDataEditor(searchParams, setSearchParams)}
          />
        ) : null}
      </div>
      {excelImport.importDialog}
    </section>
  );
}
