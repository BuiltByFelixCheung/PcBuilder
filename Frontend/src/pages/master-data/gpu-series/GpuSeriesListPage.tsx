import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  listGpuSeries,
  masterDataKeys,
  type GpuSeriesOption,
} from "@/api/master-data";
import { GpuSeriesFormDialog } from "@/pages/master-data/gpu-series/GpuSeriesFormDialog";
import {
  gpuSeriesEditPath,
  newMasterDataEditValue,
} from "@/pages/master-data/master-data-edit";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery } from "@tanstack/react-query";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";
import { MasterDataResults } from "@/pages/catalog/catalog-results";
import {
  CatalogFilterActions,
  CatalogNameField,
} from "@/pages/catalog/catalog-filter-fields";

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

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
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

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptyGpuSeriesFilter);
    setApplied(emptyGpuSeriesFilter);
  }

  function closeEditor() {
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next);
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
            <CatalogNameField
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
                className={catalogSelectClassName}
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
          <CatalogFilterActions onClear={clearFilters} />
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
          onClose={closeEditor}
        />
      ) : null}
    </section>
  );
}
