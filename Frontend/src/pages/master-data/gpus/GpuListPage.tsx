import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  listGpus,
  masterDataKeys,
  type GpuOption,
} from "@/api/master-data";
import { GpuFormDialog } from "@/pages/master-data/gpus/GpuFormDialog";
import {
  gpuEditPath,
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

const EMPTY_ITEMS: GpuOption[] = [];
const columnHelper = createColumnHelper<typeof dataTableFeatures, GpuOption>();
const columns = columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <Link to={gpuEditPath(info.row.original.id)}>
        {info.getValue()}
      </Link>
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

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
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
      if (
        applied.gpuSeriesId &&
        item.gpuSeriesId !== applied.gpuSeriesId
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
    setDraft(emptyGpuFilter);
    setApplied(emptyGpuFilter);
  }

  function closeEditor() {
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next);
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
            <Field>
              <FieldLabel htmlFor="gpu-name">Name</FieldLabel>
              <Input
                id="gpu-name"
                name="name"
                value={draft.name ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="gpu-manufacturer">Manufacturer</FieldLabel>
              <select
                id="gpu-manufacturer"
                name="manufacturerId"
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
            <Field>
              <FieldLabel htmlFor="gpu-series">Series</FieldLabel>
              <select
                id="gpu-series"
                name="gpuSeriesId"
                className={catalogSelectClassName}
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
          <div className="catalog-filter-actions">
            <Button type="submit">Apply filters</Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </form>
        <div className="catalog-results">{renderCatalog()}</div>
        {editingId ? (
          <GpuFormDialog
            key={editingId}
            editingId={editingId}
            gpus={items}
            gpusSettled={query.isSuccess || query.isError}
            onClose={closeEditor}
          />
        ) : null}
      </div>
    </section>
  );

  function renderCatalog(): ReactNode {
    if (query.isPending && !query.data) {
      return <PageStatus>Loading GPUs…</PageStatus>;
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
              to={gpuEditPath(newMasterDataEditValue)}
            >
              New GPU
            </Link>
          </Button>
          <Button>Import</Button>
        </div>
        {visibleItems.length === 0 ? (
          <PageStatus>
            {filtering
              ? "No GPUs match these filters."
              : "No GPUs found."}
          </PageStatus>
        ) : null}
        <DataTable
          data={visibleItems}
          columns={columns}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      </>
    );
  }
}