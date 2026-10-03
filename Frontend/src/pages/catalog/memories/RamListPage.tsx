import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogLeadColumns } from "@/components/catalog/CatalogLeadColumns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import { deleteMemories } from "@/api/catalog/bulk-delete";
import {
  createMemory,
  memoryKeys,
  isMemoryFilterActive,
  updateMemories,
  type MemoryFilter,
  type MemoryDetail,
} from "@/api/catalog/memories";
import { DecimalInput } from "@/components/catalog/DecimalInput";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { useAuth } from "@/auth/use-auth";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { useMemories } from "@/hooks/use-memories";
import {
  memoryListParamsFromSearch,
  memoryListSearchFromParams,
  emptyMemoryFilter,
} from "@/api/catalog/params/memory-list-params";
import { toInteger } from "@/api/helper";
import {
  DDR4_MODULE_SIZE_GB,
  DDR5_MODULE_SIZE_GB,
  DDR4_KIT_SIZE_GB,
  DDR5_KIT_SIZE_GB,
  DDR4_SPEED_MT_S,
  DDR5_SPEED_MT_S,
  DDR_GENERATIONS,
  RAM_FORM_FACTORS,
  RAM_RANKS,
  type DdrGeneration,
  type RamFormFactor,
  type RamRank,
  MODULES_COUNT,
} from "@/api/enums";
import { usePcBuild } from "@/builds/use-pc-build";
import { unsetCatalogItem } from "@/components/catalog/catalog-create";
import { CatalogCreateDialog } from "@/components/catalog/CatalogCreateDialog";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importMemories } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogFilterActions,
  CatalogFilterGroup,
  CatalogNameField,
  CatalogCompatibleCheckbox,
} from "@/components/catalog/CatalogFilterFields";
import { useQueryClient } from "@tanstack/react-query";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import {
  MemoryEditColumns,
  MemoryFields,
} from "@/pages/catalog/memories/MemoryEditColumns";
import { optionsForDdr } from "@/pages/catalog/memories/memory-ddr-options";

const EMPTY_ITEMS: MemoryDetail[] = [];
const emptyMemory = unsetCatalogItem<MemoryDetail>({
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  color: "",
  ddrGeneration: "",
  ramFormFactor: "",
  ramRank: "",
  memorySizePerStickGb: 0,
  totalMemorySizeGb: 0,
  modulesCount: 0,
  maxMemorySpeedMts: 0,
  heightMm: 0,
});
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  MemoryDetail
>();
const selectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function RamListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const params = useMemo(
    () => memoryListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<MemoryFilter>(() => params.filter);
  const query = useMemories(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editRows, setEditRows] = useState<MemoryDetail[] | null>(null);
  const [creating, setCreating] = useState(false);
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/memories/${id}`,
        ),
        columnHelper.accessor("ddrGeneration", { header: "DDR Generation" }),
        columnHelper.accessor("ramFormFactor", { header: "RAM Form Factor" }),
        columnHelper.accessor("ramRank", { header: "RAM Rank" }),
        columnHelper.accessor("memorySizePerStickGb", {
          header: "Module Size",
          cell: (info) => `${info.getValue()} GB`,
        }),
        columnHelper.accessor("totalMemorySizeGb", {
          header: "Kit Size",
          cell: (info) => `${info.getValue()} GB`,
        }),
        columnHelper.accessor("maxMemorySpeedMts", {
          header: "Speed",
          cell: (info) => `${info.getValue()} MT/s`,
        }),
        columnHelper.accessor("modulesCount", { header: "Modules Count" }),
        columnHelper.accessor("heightMm", {
          header: "Height",
          cell: (info) => `${info.getValue()} mm`,
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: memoryKeys.all,
    singular: "RAM module",
    plural: "RAM modules",
    deleteByIds: (ids) => deleteMemories({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: memoryKeys.all,
    importFile: importMemories,
  });
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isMemoryFilterActive(params.filter);
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(params.filter.cpuId || params.filter.motherboardId),
  );

  const moduleSizeOptions = optionsForDdr(
    draft.ddrGeneration,
    DDR4_MODULE_SIZE_GB,
    DDR5_MODULE_SIZE_GB,
  );
  const kitSizeOptions = optionsForDdr(
    draft.ddrGeneration,
    DDR4_KIT_SIZE_GB,
    DDR5_KIT_SIZE_GB,
  );
  const speedOptions = optionsForDdr(
    draft.ddrGeneration,
    DDR4_SPEED_MT_S,
    DDR5_SPEED_MT_S,
  );

  const manufacturers = useCatalogManufacturers("ram");
  const manufacturerOptions = useMemo(
    () =>
      manufacturers.map((manufacturer) => ({
        value: manufacturer.id,
        label: manufacturer.name,
      })),
    [manufacturers],
  );

  function startEditing() {
    beginBulkEdit(items, rowSelection, setEditRows);
  }

  function applyCompatibleFilter(checked: boolean) {
    const next = {
      cpuId: checked ? currentBuild.cpuId : undefined,
      motherboardId: checked ? currentBuild.motherboardId : undefined,
    };
    setShowOnlyCompatible(checked);
    setDraft((current) => ({ ...current, ...next }));
    setSearchParams(
      memoryListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: { ...params.filter, ...next },
      }),
    );
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      memoryListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: draft,
      }),
    );
  }

  function clearFilters() {
    setShowOnlyCompatible(false);
    setDraft(emptyMemoryFilter);
    setSearchParams(
      memoryListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyMemoryFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      memoryListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>Memory</h1>
      <p className="catalog-lead">
        Browse the catalog, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <CatalogFilterGroup>
            <CatalogCompatibleCheckbox
              checked={showOnlyCompatible}
              onCheckedChange={applyCompatibleFilter}
            />
            <CatalogNameField
              id="memory-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <Field>
              <FieldLabel htmlFor="memory-manufacturer">
                Manufacturer
              </FieldLabel>
              <select
                id="memory-manufacturer"
                className={selectClassName}
                value={draft.manufacturerId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    manufacturerId: event.target.value,
                  }))
                }
              >
                <option value="">All</option>
                {manufacturerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-ddr-generation">
                DDR Generation
              </FieldLabel>
              <select
                id="memory-ddr-generation"
                className={selectClassName}
                value={draft.ddrGeneration ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    ddrGeneration: event.target.value as DdrGeneration,
                  }))
                }
              >
                <option value="">All</option>
                {DDR_GENERATIONS.map((generation) => (
                  <option key={generation} value={generation}>
                    {generation}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-ram-form-factor">
                RAM Form Factor
              </FieldLabel>
              <select
                id="memory-ram-form-factor"
                className={selectClassName}
                value={draft.ramFormFactor ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    ramFormFactor: event.target.value as RamFormFactor,
                  }))
                }
              >
                <option value="">All</option>
                {RAM_FORM_FACTORS.map((factor) => (
                  <option key={factor} value={factor}>
                    {factor}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-ram-rank">RAM Rank</FieldLabel>
              <select
                id="memory-ram-rank"
                className={selectClassName}
                value={draft.ramRank ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    ramRank: event.target.value as RamRank,
                  }))
                }
              >
                <option value="">All</option>
                {RAM_RANKS.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-module-size">Module Size</FieldLabel>
              <select
                id="memory-module-size"
                className={selectClassName}
                value={draft.memorySizePerStickGb ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    memorySizePerStickGb:
                      toInteger(event.target.value) ?? undefined,
                  }))
                }
              >
                <option value="">All</option>
                {moduleSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} GB
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-kit-size">Kit Size</FieldLabel>
              <select
                id="memory-kit-size"
                className={selectClassName}
                value={draft.totalMemorySizeGb ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    totalMemorySizeGb:
                      toInteger(event.target.value) ?? undefined,
                  }))
                }
              >
                <option value="">All</option>
                {kitSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} GB
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-speed">Speed</FieldLabel>
              <select
                id="memory-speed"
                className={selectClassName}
                value={draft.maxMemorySpeedMts ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maxMemorySpeedMts:
                      toInteger(event.target.value) ?? undefined,
                  }))
                }
              >
                <option value="">All</option>
                {speedOptions.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed} MT/s
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-modules-count">
                Modules Count
              </FieldLabel>
              <select
                id="memory-modules-count"
                className={selectClassName}
                value={draft.modulesCount ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    modulesCount: toInteger(event.target.value) ?? undefined,
                  }))
                }
              >
                <option value="">All</option>
                {MODULES_COUNT.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-height-min">Height</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="memory-height-min"
                  label="Height min"
                  placeholder="Min"
                  value={draft.heightMm?.min}
                  onValue={(min) =>
                    setDraft((current) => ({
                      ...current,
                      heightMm: {
                        min: min,
                        max: current.heightMm?.max ?? null,
                      },
                    }))
                  }
                />
                <DecimalInput
                  id="memory-height-max"
                  label="Height max"
                  placeholder="Max"
                  value={draft.heightMm?.max}
                  onValue={(max) =>
                    setDraft((current) => ({
                      ...current,
                      heightMm: {
                        min: current.heightMm?.min ?? null,
                        max: max,
                      },
                    }))
                  }
                />
              </div>
            </Field>
          </CatalogFilterGroup>
          <CatalogFilterActions onClear={clearFilters} />
        </form>

        <div className="catalog-results">
          <CatalogPagedResults
            isInitialLoading={query.isPending && !query.data}
            isError={query.isError}
            error={query.error}
            items={items}
            filtering={filtering}
            loadingMessage="Loading memories…"
            emptyFilteredMessage="No memories match these filters."
            emptyMessage="No memories in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Memory"
            onNewItem={() => setCreating(true)}
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onEditSelected={startEditing}
            onImport={excelImport.openImport}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={goToPage}
          />
        </div>
      </div>
      {creating ? (
        <CatalogCreateDialog
          title="New memory"
          item={emptyMemory}
          fields={MemoryFields(manufacturers, true)}
          queryKey={memoryKeys.all}
          detailPath={(id) => `/catalog/memories/${id}`}
          onClose={() => setCreating(false)}
          create={createMemory}
        />
      ) : null}
      {editRows ? (
        <BulkEditDialog
          title="Edit Memories"
          rows={editRows}
          columns={MemoryEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateMemories(rows);
            await queryClient.invalidateQueries({ queryKey: memoryKeys.all });
            setEditRows(null);
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
