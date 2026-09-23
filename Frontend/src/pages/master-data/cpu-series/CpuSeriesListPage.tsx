import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  listCpuSeries,
  masterDataKeys,
  type CpuSeriesOption,
} from "@/api/master-data";
import { CpuSeriesFormDialog } from "@/pages/master-data/cpu-series/CpuSeriesFormDialog";
import {
  cpuSeriesEditPath,
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

const EMPTY_ITEMS: CpuSeriesOption[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  CpuSeriesOption
>();
const columns = columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <Link to={cpuSeriesEditPath(info.row.original.id)}>
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
  columnHelper.accessor("socketName", { header: "Socket" }),
]);

type CpuSeriesFilter = {
  name?: string;
  manufacturerId?: string;
  socketId?: string;
};

const emptyCpuSeriesFilter: CpuSeriesFilter = {};

function isCpuSeriesFilterActive(filter: CpuSeriesFilter) {
  return Boolean(filter.name || filter.manufacturerId || filter.socketId);
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function CpuSeriesListPage() {
  const query = useQuery({
    queryKey: masterDataKeys.cpuSeries,
    queryFn: listCpuSeries,
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<CpuSeriesFilter>(emptyCpuSeriesFilter);
  const [applied, setApplied] = useState<CpuSeriesFilter>(emptyCpuSeriesFilter);
  const filtering = isCpuSeriesFilterActive(applied);
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
  const sockets = useMemo(
    () =>
      uniqueById(
        items.map((item) => ({
          id: item.socketId,
          name: item.socketName,
          manufacturerId: item.manufacturerId,
        })),
      ),
    [items],
  );
  const socketOptions = draft.manufacturerId
    ? sockets.filter((item) => item.manufacturerId === draft.manufacturerId)
    : sockets;
  const visibleItems = useMemo(() => {
    const name = applied.name?.trim().toLowerCase();
    return items.filter((item) => {
      if (name && !item.name.toLowerCase().includes(name)) return false;
      if (
        applied.manufacturerId &&
        item.manufacturerId !== applied.manufacturerId
      )
        return false;
      if (applied.socketId && item.socketId !== applied.socketId) return false;
      return true;
    });
  }, [applied, items]);

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptyCpuSeriesFilter);
    setApplied(emptyCpuSeriesFilter);
  }

  function closeEditor() {
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next);
  }

  return (
    <section className="catalog-page">
      <h1>CPU Series</h1>
      <p className="catalog-lead">
        Browse the master data, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <Field>
              <FieldLabel htmlFor="cpu-series-name">Name</FieldLabel>
              <Input
                id="cpu-series-name"
                value={draft.name ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cpu-series-manufacturer">
                Manufacturer
              </FieldLabel>
              <select
                id="cpu-series-manufacturer"
                className={catalogSelectClassName}
                value={draft.manufacturerId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    manufacturerId: event.target.value,
                  }))
                }
              >
                <option value="">Any</option>
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="cpu-series-socket">Socket</FieldLabel>
              <select
                id="cpu-series-socket"
                className={catalogSelectClassName}
                value={draft.socketId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    socketId: event.target.value,
                  }))
                }
              >
                <option value="">Any</option>
                {socketOptions.map((socket) => (
                  <option key={socket.id} value={socket.id}>
                    {socket.name}
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
        <CpuSeriesFormDialog
          key={editingId}
          editingId={editingId}
          cpuSeries={items}
          cpuSeriesSettled={query.isSuccess || query.isError}
          onClose={closeEditor}
        />
      ) : null}
    </section>
  );

  function renderCatalog(): ReactNode {
    if (query.isPending && !query.data) {
      return <PageStatus>Loading CPU Series…</PageStatus>;
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
              to={cpuSeriesEditPath(newMasterDataEditValue)}
            >
              New CPU Series
            </Link>
          </Button>
          <Button>Import</Button>
        </div>
        {visibleItems.length === 0 ? (
          <PageStatus>
            {filtering
              ? "No CPU Series match these filters."
              : "No CPU Series yet."}
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
