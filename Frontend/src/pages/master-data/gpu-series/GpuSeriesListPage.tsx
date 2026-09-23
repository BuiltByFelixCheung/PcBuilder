import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
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
import { PageStatus } from "@/components/PageStatus";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery } from "@tanstack/react-query";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";

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
            <Field>
              <FieldLabel htmlFor="gpu-series-name">Name</FieldLabel>
              <Input
                id="gpu-series-name"
                name="name"
                value={draft.name ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </Field>
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
          <div className="catalog-filter-actions">
            <Button type="submit">Apply filters</Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </form>
        <div className="catalog-results">{renderCatalog()}</div>
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

  function renderCatalog(): ReactNode {
    if (query.isPending && !query.data) {
      return <PageStatus>Loading GPU Series…</PageStatus>;
    }

    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }

    const hasSelection = Object.values(rowSelection).some(Boolean);

    return (
      <>
        <div className="catalog-results-actions">
          <Button disabled={!hasSelection}>Edit Selected</Button>
          <Button disabled={!hasSelection}>Delete Selected</Button>
          <Button asChild>
            <Link
              style={{ textDecoration: "none", color: "black" }}
              to={gpuSeriesEditPath(newMasterDataEditValue)}
            >
              New GPU Series
            </Link>
          </Button>
          <Button>Import</Button>
        </div>
        {visibleItems.length === 0 ? (
          <PageStatus>
            {filtering
              ? "No GPU Series match these filters."
              : "No GPU Series found."}
          </PageStatus>
        ) : (
          <DataTable
            data={visibleItems}
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        )}
      </>
    );
  }
}
