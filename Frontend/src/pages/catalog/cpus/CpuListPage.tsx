import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  isCpuFilterActive,
  type CpuFilter,
  type CpuListItem,
} from "@/api/catalog/cpus";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type CellContext,
  type RowSelectionState,
} from "@tanstack/react-table";
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
import { usePcBuild } from "@/builds";
import { CatalogPagedResults } from "@/pages/catalog/catalog-results";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogCompatibleCheckbox,
  CatalogIdSelectField,
  CatalogRangeField,
} from "@/pages/catalog/catalog-filter-fields";

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
          <CatalogCompatibleCheckbox
            checked={showOnlyCompatible}
            onCheckedChange={applyCompatibleFilter}
          />
          <CatalogNameField
            id="cpu-name"
            value={draft.name}
            onChange={(name) =>
              setDraft((current) => ({ ...current, name }))
            }
          />
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
          <CatalogIdSelectField
            id="cpu-series"
            label="Series"
            value={draft.seriesId}
            options={seriesOptions}
            onChange={(value) =>
              setDraft((current) => ({ ...current, seriesId: value || undefined }))
            }
          />
          <CatalogRangeField
            id="cpu-tdp"
            label="TDP (W)"
            maxAriaLabel="TDP max"
            range={draft.thermalDesignPower}
            onChange={(thermalDesignPower) =>
              setDraft((current) => ({ ...current, thermalDesignPower }))
            }
          />
          <CatalogRangeField
            id="cpu-power"
            label="Power (W)"
            maxAriaLabel="Power max"
            range={draft.powerConsumptionWatts}
            onChange={(powerConsumptionWatts) =>
              setDraft((current) => ({ ...current, powerConsumptionWatts }))
            }
          />
        </FieldGroup>
        <CatalogFilterActions onClear={clearFilters} />
      </form>

      <div className="catalog-results">
        <CatalogPagedResults
          isInitialLoading={query.isPending && !query.data}
          isError={query.isError}
          error={query.error}
          items={items}
          filtering={filtering}
          loadingMessage="Loading CPUs…"
          emptyFilteredMessage="No CPUs match these filters."
          emptyMessage="No CPUs in the catalog yet."
          isAdmin={isAdmin}
          newItemLabel="New CPU"
          columns={columns}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          pageIndex={pageIndex}
          pageCount={pageCount}
          totalCount={totalCount}
          countLabel="CPUs"
          onPageChange={goToPage}
        />
      </div>
      </div>
    </section>
  );

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
