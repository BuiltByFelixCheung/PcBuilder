import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isCpuCoolerFilterActive,
  type CpuCoolerFilter,
  type CpuCoolerListItem,
} from "@/api/catalog/cpu-coolers";
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
import {
  useCatalogManufacturers,
  useCatalogSockets,
} from "@/hooks/use-catalog-manufacturers.ts";
import { useCpuCoolers } from "@/hooks/use-cpu-coolers.ts";
import {
  cpuCoolerListParamsFromSearch,
  cpuCoolerListSearchFromParams,
  emptyCpuCoolerFilter,
} from "@/api/catalog/params/cpu-cooler-list-params";
import { toOptionalNumber } from "@/api/helper";
import {
  CPU_COOLER_TYPES,
  RADIATOR_LENGTHS,
  formatRadiatorLength,
  type CpuCoolerType,
  type RadiatorLength,
} from "@/api/enums";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";
import { usePcBuild } from "@/builds/usePcBuild";
import type { RangeFilter } from "@/api/paging";

const EMPTY_ITEMS: CpuCoolerListItem[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  CpuCoolerListItem
>();

export function CpuCoolerListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => cpuCoolerListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<CpuCoolerFilter>(() => params.filter);
  const manufacturers = useCatalogManufacturers("cpucooler");
  const sockets = useCatalogSockets();
  const query = useCpuCoolers(params);
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
        columnHelper.accessor("type", { header: "Type" }),
        columnHelper.accessor("maxTdp", {
          header: "Max TDP",
          cell: (info) => `${info.getValue()} W`,
        }),
        columnHelper.accessor("coolerHeightMm", {
          header: "Height",
          cell: (info) => {
            const value = info.getValue();
            return value != null ? `${value} mm` : "—";
          },
        }),
        columnHelper.accessor("maxRamHeightMm", {
          header: "Max RAM height",
          cell: (info) => {
            const value = info.getValue();
            return value != null ? `${value} mm` : "—";
          },
        }),
        columnHelper.accessor("radiatorLength", {
          header: "Radiator",
          cell: (info) => {
            const value = info.getValue();
            return value ? formatRadiatorLength(value) : "—";
          },
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isCpuCoolerFilterActive(params.filter);
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(
      params.filter.cpuId ||
        params.filter.chassisId ||
        params.filter.ramId ||
        params.filter.motherboardId,
    ),
  );

  function compatibilityIds(checked: boolean) {
    return {
      cpuId: checked ? currentBuild.cpuId : undefined,
      chassisId: checked ? currentBuild.chassisId : undefined,
      ramId: checked ? currentBuild.ramKitId : undefined,
      motherboardId: checked ? currentBuild.motherboardId : undefined,
    };
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      cpuCoolerListSearchFromParams({ ...params, pageIndex: 0, filter: draft }),
    );
  }

  function applyCompatibleFilter(checked: boolean) {
    const next = compatibilityIds(checked);
    setShowOnlyCompatible(checked);
    setDraft((current) => ({ ...current, ...next }));
    setSearchParams(
      cpuCoolerListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: { ...params.filter, ...next },
      }),
    );
  }

  function clearFilters() {
    setShowOnlyCompatible(false);
    setDraft(emptyCpuCoolerFilter);
    setSearchParams(
      cpuCoolerListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyCpuCoolerFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      cpuCoolerListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  function setRange(
    key: "maxTdp" | "coolerHeightMm" | "maxRamHeightMm",
    side: "min" | "max",
    value: number | null,
  ) {
    setDraft((current) => ({
      ...current,
      [key]: {
        min: side === "min" ? value : (current[key]?.min ?? null),
        max: side === "max" ? value : (current[key]?.max ?? null),
      } satisfies RangeFilter,
    }));
  }

  return (
    <section className="catalog-page">
      <h1>CPU Coolers</h1>
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
              <FieldLabel htmlFor="cooler-name">Name</FieldLabel>
              <Input
                id="cooler-name"
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
              <FieldLabel htmlFor="cooler-manufacturer">Manufacturer</FieldLabel>
              <select
                id="cooler-manufacturer"
                className={catalogSelectClassName}
                value={draft.manufacturerId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    manufacturerId: event.target.value || undefined,
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
              <FieldLabel htmlFor="cooler-type">Type</FieldLabel>
              <select
                id="cooler-type"
                className={catalogSelectClassName}
                value={draft.type ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    type: (event.target.value || undefined) as
                      | CpuCoolerType
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {CPU_COOLER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="cooler-socket">Socket</FieldLabel>
              <select
                id="cooler-socket"
                className={catalogSelectClassName}
                value={draft.socketId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    socketId: event.target.value || undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {sockets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="cooler-radiator">Radiator</FieldLabel>
              <select
                id="cooler-radiator"
                className={catalogSelectClassName}
                value={draft.radiatorLength ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    radiatorLength: (event.target.value || undefined) as
                      | RadiatorLength
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {RADIATOR_LENGTHS.map((length) => (
                  <option key={length} value={length}>
                    {formatRadiatorLength(length)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="cooler-tdp-min">Max TDP (W)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="cooler-tdp-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={draft.maxTdp?.min ?? ""}
                  onChange={(event) =>
                    setRange("maxTdp", "min", toOptionalNumber(event.target.value))
                  }
                />
                <Input
                  id="cooler-tdp-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Max TDP max"
                  value={draft.maxTdp?.max ?? ""}
                  onChange={(event) =>
                    setRange("maxTdp", "max", toOptionalNumber(event.target.value))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="cooler-height-min">Height (mm)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="cooler-height-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={draft.coolerHeightMm?.min ?? ""}
                  onChange={(event) =>
                    setRange(
                      "coolerHeightMm",
                      "min",
                      toOptionalNumber(event.target.value),
                    )
                  }
                />
                <Input
                  id="cooler-height-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Height max"
                  value={draft.coolerHeightMm?.max ?? ""}
                  onChange={(event) =>
                    setRange(
                      "coolerHeightMm",
                      "max",
                      toOptionalNumber(event.target.value),
                    )
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="cooler-ram-height-min">
                Max RAM height (mm)
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="cooler-ram-height-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={draft.maxRamHeightMm?.min ?? ""}
                  onChange={(event) =>
                    setRange(
                      "maxRamHeightMm",
                      "min",
                      toOptionalNumber(event.target.value),
                    )
                  }
                />
                <Input
                  id="cooler-ram-height-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Max RAM height max"
                  value={draft.maxRamHeightMm?.max ?? ""}
                  onChange={(event) =>
                    setRange(
                      "maxRamHeightMm",
                      "max",
                      toOptionalNumber(event.target.value),
                    )
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
      return <PageStatus>Loading CPU coolers…</PageStatus>;
    }
    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }
    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No CPU coolers match these filters."
            : "No CPU coolers in the catalog yet."}
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
            <Button>New CPU Cooler</Button>
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
            Page {pageIndex + 1} of {pageCount} ({totalCount} CPU coolers)
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
  info: CellContext<typeof dataTableFeatures, CpuCoolerListItem, string>,
) {
  return (
    <Link to={`/catalog/cpu-coolers/${info.row.original.id}`}>
      {info.getValue()}
    </Link>
  );
}
