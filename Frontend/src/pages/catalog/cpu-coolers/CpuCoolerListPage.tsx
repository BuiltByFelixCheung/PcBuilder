import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteCpuCoolers } from "@/api/catalog/bulk-delete";
import {
  cpuCoolerKeys,
  isCpuCoolerFilterActive,
  type CpuCoolerFilter,
  type CpuCoolerListItem,
} from "@/api/catalog/cpu-coolers";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useAuth } from "@/auth/use-auth";
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
} from "@/api/enums";
import { usePcBuild } from "@/builds/use-pc-build";
import type { RangeFilter } from "@/api/paging";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importCpuCoolers } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import { catalogNameCell } from "@/components/catalog/CatalogNameCell";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogCompatibleCheckbox,
  CatalogEnumField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";

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
          cell: (info) =>
            catalogNameCell(
              `/catalog/cpu-coolers/${info.row.original.id}`,
              info.getValue(),
            ),
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
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: cpuCoolerKeys.all,
    singular: "CPU cooler",
    plural: "CPU coolers",
    deleteByIds: deleteCpuCoolers,
  });
  const excelImport = useExcelImport({
    queryKey: cpuCoolerKeys.all,
    importFile: importCpuCoolers,
  });
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
            <CatalogCompatibleCheckbox
              checked={showOnlyCompatible}
              onCheckedChange={applyCompatibleFilter}
            />
            <CatalogNameField
              id="cooler-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="cooler-manufacturer"
              label="Manufacturer"
              value={draft.manufacturerId}
              options={manufacturers}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  manufacturerId: value || undefined,
                }))
              }
            />
            <CatalogEnumField
              id="cooler-type"
              label="Type"
              value={draft.type}
              options={CPU_COOLER_TYPES}
              onChange={(type) => setDraft((current) => ({ ...current, type }))}
            />
            <CatalogIdSelectField
              id="cooler-socket"
              label="Socket"
              value={draft.socketId}
              options={sockets}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  socketId: value || undefined,
                }))
              }
            />
            <CatalogEnumField
              id="cooler-radiator"
              label="Radiator"
              value={draft.radiatorLength}
              options={RADIATOR_LENGTHS}
              formatOption={formatRadiatorLength}
              onChange={(radiatorLength) =>
                setDraft((current) => ({ ...current, radiatorLength }))
              }
            />
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
                    setRange(
                      "maxTdp",
                      "min",
                      toOptionalNumber(event.target.value),
                    )
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
                    setRange(
                      "maxTdp",
                      "max",
                      toOptionalNumber(event.target.value),
                    )
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
          <CatalogFilterActions onClear={clearFilters} />
        </form>
        <div className="catalog-results">
          <CatalogPagedResults
            isInitialLoading={query.isPending && !query.data}
            isError={query.isError}
            error={query.error}
            items={items}
            filtering={filtering}
            loadingMessage="Loading CPU coolers…"
            emptyFilteredMessage="No CPU coolers match these filters."
            emptyMessage="No CPU coolers in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New CPU Cooler"
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onImport={excelImport.openImport}
            pageIndex={pageIndex}
            pageCount={pageCount}
            totalCount={totalCount}
            countLabel="CPU coolers"
            onPageChange={goToPage}
          />
        </div>
      </div>
      {excelImport.importDialog}
    </section>
  );
}
