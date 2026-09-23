import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isCpuFilterActive,
  type CpuFilter,
  type CpuListItem,
} from "@/api/catalog/cpus";
import { PageStatus } from "@/components/PageStatus.tsx";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type CellContext,
  type RowSelectionState,
} from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useAuth } from "@/auth/useAuth";
import { useCpuFilterOptions } from "@/hooks/use-cpu-filter-options.ts";
import { useCpus } from "@/hooks/use-cpus.ts";
import {
  cpuListParamsFromSearch,
  cpuListSearchFromParams,
  emptyCpuFilter,
} from "@/api/catalog/params/cpu-list-params";
import { toOptionalNumber } from "@/api/helper";
import { usePcBuild } from "@/builds";

const EMPTY_ITEMS: CpuListItem[] = [];
const columnHelper = createColumnHelper<typeof dataTableFeatures, CpuListItem>();
const selectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CpuListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => cpuListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<CpuFilter>(() => params.filter);
  const { manufacturers, sockets, series } = useCpuFilterOptions();
  const query = useCpus(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...(isAdmin ? [createSelectionColumn(columnHelper)] : []),
        columnHelper.accessor("name", {
          header: "Name",
          cell: nameCell,
        }),
        columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
        columnHelper.accessor("seriesName", { header: "Series" }),
        columnHelper.accessor("socketName", { header: "Socket" }),
        columnHelper.accessor("thermalDesignPower", {
          header: "TDP",
          cell: (info) => `${info.getValue()} W`,
        }),
        columnHelper.accessor("powerConsumptionWatts", {
          header: "Power",
          cell: (info) => `${info.getValue()} W`,
        }),
        columnHelper.accessor("maxMemoryGb", {
          header: "Max RAM",
          cell: (info) => `${info.getValue()} GB`,
        }),
        columnHelper.accessor("integratedGraphics", {
          header: "iGPU",
          cell: (info) => (info.getValue() ? "Yes" : "No"),
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isCpuFilterActive(params.filter);
  const socketOptions = draft.manufacturerId
    ? sockets.filter((item) => item.manufacturerId === draft.manufacturerId)
    : sockets;
  const seriesOptions = series.filter((item) => {
    if (draft.manufacturerId && item.manufacturerId !== draft.manufacturerId)
      return false;
    if (draft.socketId && item.socketId !== draft.socketId) return false;
    return true;
  });
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(
    () => Boolean(params.filter.motherboardId),
  );

  function applyCompatibleFilter(checked: boolean) {
    const motherboardId = checked
      ? currentBuild.motherboardId
      : undefined;
    setShowOnlyCompatible(checked);
    setDraft((current) => ({ ...current, motherboardId }));
    setSearchParams(
      cpuListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: { ...params.filter, motherboardId },
      }),
    );
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      cpuListSearchFromParams({ ...params, pageIndex: 0, filter: draft }),
    );
  }

  function clearFilters() {
    setShowOnlyCompatible(false);
    setDraft(emptyCpuFilter);
    setSearchParams(
      cpuListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyCpuFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      cpuListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>CPUs</h1>
      <p className="catalog-lead">
        Browse the catalog, then apply filters when you need a narrower set.
      </p>

      <div className="catalog-layout">
      <form className="catalog-filters" onSubmit={applyFilters}>
        <FieldGroup className="catalog-filter-grid">
          <Field orientation="horizontal">
            <input
              id="show-only-compatible"
              type="checkbox"
              className="size-4 shrink-0"
              checked={showOnlyCompatible}
              onChange={(event) => applyCompatibleFilter(event.target.checked)}
            />
            <FieldLabel htmlFor="show-only-compatible">
              Show only compatible
            </FieldLabel>
          </Field>
          <Field>
            <FieldLabel htmlFor="cpu-name">Name</FieldLabel>
            <Input
              id="cpu-name"
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
            <FieldLabel htmlFor="cpu-manufacturer">Manufacturer</FieldLabel>
            <select
              id="cpu-manufacturer"
              className={selectClassName}
              value={draft.manufacturerId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  manufacturerId: event.target.value || undefined,
                  socketId: undefined,
                  seriesId: undefined,
                }))
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
            <FieldLabel htmlFor="cpu-socket">Socket</FieldLabel>
            <select
              id="cpu-socket"
              className={selectClassName}
              value={draft.socketId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  socketId: event.target.value || undefined,
                  seriesId: undefined,
                }))
              }
            >
              <option value="">Any</option>
              {socketOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="cpu-series">Series</FieldLabel>
            <select
              id="cpu-series"
              className={selectClassName}
              value={draft.seriesId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  seriesId: event.target.value || undefined,
                }))
              }
            >
              <option value="">Any</option>
              {seriesOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="cpu-tdp-min">TDP (W)</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="cpu-tdp-min"
                type="number"
                min={0}
                placeholder="Min"
                value={draft.thermalDesignPower?.min ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    thermalDesignPower: {
                      min: toOptionalNumber(event.target.value),
                      max: current.thermalDesignPower?.max ?? null,
                    },
                  }))
                }
              />
              <Input
                id="cpu-tdp-max"
                type="number"
                min={0}
                placeholder="Max"
                aria-label="TDP max"
                value={draft.thermalDesignPower?.max ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    thermalDesignPower: {
                      min: current.thermalDesignPower?.min ?? null,
                      max: toOptionalNumber(event.target.value),
                    },
                  }))
                }
              />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="cpu-power-min">Power (W)</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="cpu-power-min"
                type="number"
                min={0}
                placeholder="Min"
                value={draft.powerConsumptionWatts?.min ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    powerConsumptionWatts: {
                      min: toOptionalNumber(event.target.value),
                      max: current.powerConsumptionWatts?.max ?? null,
                    },
                  }))
                }
              />
              <Input
                id="cpu-power-max"
                type="number"
                min={0}
                placeholder="Max"
                aria-label="Power max"
                value={draft.powerConsumptionWatts?.max ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    powerConsumptionWatts: {
                      min: current.powerConsumptionWatts?.min ?? null,
                      max: toOptionalNumber(event.target.value),
                    },
                  }))
                }
              />
            </div>
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
    </section>
  );

  function renderCatalog(): ReactNode {
    if (query.isPending && !query.data) {
      return <PageStatus>Loading CPUs…</PageStatus>;
    }

    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }

    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No CPUs match these filters."
            : "No CPUs in the catalog yet."}
        </PageStatus>
      );
    }

    return (
      <>
        {isAdmin && (
          <div className="catalog-results-actions">
            <Button disabled={!Object.values(rowSelection).some(Boolean)}>
              Edit Selected
            </Button>
            <Button disabled={!Object.values(rowSelection).some(Boolean)}>
              Delete Selected
            </Button>
            <Button>New CPU</Button>
            <Button>Import</Button>
          </div>
        )}
        <DataTable
          data={items}
          columns={columns}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
        <div className="catalog-pagination">
          <p>
            Page {pageIndex + 1} of {pageCount} ({totalCount} CPUs)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pageIndex === 0}
              onClick={() => goToPage(pageIndex - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pageIndex + 1 >= pageCount}
              onClick={() => goToPage(pageIndex + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </>
    );
  }
}

function nameCell(
  info: CellContext<typeof dataTableFeatures, CpuListItem, string>,
) {
  return (
    <Link to={`/catalog/cpus/${info.row.original.id}`}>
      {info.getValue()}
    </Link>
  );
}
