import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteMemories } from "@/api/catalog/bulk-delete";
import {
  memoryKeys,
  isMemoryFilterActive,
  updateMemories,
  type MemoryFilter,
  type MemoryDetail,
} from "@/api/catalog/memories";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useAuth } from "@/auth/use-auth";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { useMemories } from "@/hooks/use-memories";
import {
  memoryListParamsFromSearch,
  memoryListSearchFromParams,
  emptyMemoryFilter,
} from "@/api/catalog/params/memory-list-params";
import { toInteger, toOptionalNumber } from "@/api/helper";
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
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importMemories } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import { catalogNameCell } from "@/components/catalog/CatalogNameCell";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogCompatibleCheckbox,
} from "@/components/catalog/CatalogFilterFields";
import { useQueryClient } from "@tanstack/react-query";
import {
  BulkEditDialog,
  type BulkEditColumn,
} from "@/components/BulkEditDialog";

const EMPTY_ITEMS: MemoryDetail[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  MemoryDetail
>();
const selectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function optionsForDdr<T>(
  ddrGeneration: DdrGeneration | undefined,
  ddr4: readonly T[],
  ddr5: readonly T[],
): readonly T[] {
  if (ddrGeneration === "Ddr4") return ddr4;
  if (ddrGeneration === "Ddr5") return ddr5;
  return [];
}

function valueInOptions(value: number, options: readonly number[]): number {
  return options.includes(value) ? value : (options[0] ?? value);
}

function memoryEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<MemoryDetail>[] {
  return [
    {
      header: "Name",
      cell: (row, update) => (
        <Input
          aria-label={`Name for ${row.name}`}
          value={row.name}
          onChange={(event) => update({ ...row, name: event.target.value })}
        />
      ),
    },
    {
      header: "Manufacturer",
      cell: (row, update) => (
        <select
          aria-label={`Manufacturer for ${row.name}`}
          className={selectClassName}
          value={row.manufacturerId}
          onChange={(event) =>
            update({ ...row, manufacturerId: event.target.value })
          }
        >
          {manufacturers.map((manufacturer) => (
            <option key={manufacturer.id} value={manufacturer.id}>
              {manufacturer.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "DDR Generation",
      cell: (row, update) => (
        <select
          aria-label={`DDR Generation for ${row.name}`}
          className={selectClassName}
          value={row.ddrGeneration}
          onChange={(event) => {
            const ddrGeneration = event.target.value as DdrGeneration;
            const moduleSizes = optionsForDdr(
              ddrGeneration,
              DDR4_MODULE_SIZE_GB,
              DDR5_MODULE_SIZE_GB,
            );
            const kitSizes = optionsForDdr(
              ddrGeneration,
              DDR4_KIT_SIZE_GB,
              DDR5_KIT_SIZE_GB,
            );
            const speeds = optionsForDdr(
              ddrGeneration,
              DDR4_SPEED_MT_S,
              DDR5_SPEED_MT_S,
            );
            update({
              ...row,
              ddrGeneration,
              memorySizePerStickGb: valueInOptions(
                row.memorySizePerStickGb,
                moduleSizes,
              ),
              totalMemorySizeGb: valueInOptions(
                row.totalMemorySizeGb,
                kitSizes,
              ),
              maxMemorySpeedMts: valueInOptions(row.maxMemorySpeedMts, speeds),
            });
          }}
        >
          {DDR_GENERATIONS.map((generation) => (
            <option key={generation} value={generation}>
              {generation}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "RAM Form Factor",
      cell: (row, update) => (
        <select
          aria-label={`RAM Form Factor for ${row.name}`}
          className={selectClassName}
          value={row.ramFormFactor}
          onChange={(event) =>
            update({
              ...row,
              ramFormFactor: event.target.value as RamFormFactor,
            })
          }
        >
          {RAM_FORM_FACTORS.map((factor) => (
            <option key={factor} value={factor}>
              {factor}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "RAM Rank",
      cell: (row, update) => (
        <select
          aria-label={`RAM Rank for ${row.name}`}
          className={selectClassName}
          value={row.ramRank}
          onChange={(event) =>
            update({ ...row, ramRank: event.target.value as RamRank })
          }
        >
          {RAM_RANKS.map((rank) => (
            <option key={rank} value={rank}>
              {rank}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Module Size",
      cell: (row, update) => {
        const moduleSizeOptions = optionsForDdr(
          row.ddrGeneration,
          DDR4_MODULE_SIZE_GB,
          DDR5_MODULE_SIZE_GB,
        );
        return (
          <select
            aria-label={`Module Size for ${row.name}`}
            className={selectClassName}
            value={row.memorySizePerStickGb}
            onChange={(event) =>
              update({
                ...row,
                memorySizePerStickGb: toInteger(event.target.value) ?? 0,
              })
            }
          >
            {moduleSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} GB
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: "Kit Size",
      cell: (row, update) => {
        const kitSizeOptions = optionsForDdr(
          row.ddrGeneration,
          DDR4_KIT_SIZE_GB,
          DDR5_KIT_SIZE_GB,
        );
        return (
          <select
            aria-label={`Kit Size for ${row.name}`}
            className={selectClassName}
            value={row.totalMemorySizeGb}
            onChange={(event) =>
              update({
                ...row,
                totalMemorySizeGb: toInteger(event.target.value) ?? 0,
              })
            }
          >
            {kitSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} GB
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: "Speed",
      cell: (row, update) => {
        const speedOptions = optionsForDdr(
          row.ddrGeneration,
          DDR4_SPEED_MT_S,
          DDR5_SPEED_MT_S,
        );
        return (
          <select
            aria-label={`Speed for ${row.name}`}
            className={selectClassName}
            value={row.maxMemorySpeedMts}
            onChange={(event) =>
              update({
                ...row,
                maxMemorySpeedMts: toInteger(event.target.value) ?? 0,
              })
            }
          >
            {speedOptions.map((speed) => (
              <option key={speed} value={speed}>
                {speed} MT/s
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: "Modules Count",
      cell: (row, update) => (
        <select
          aria-label={`Modules Count for ${row.name}`}
          className={selectClassName}
          value={row.modulesCount}
          onChange={(event) =>
            update({ ...row, modulesCount: toInteger(event.target.value) ?? 0 })
          }
        >
          {MODULES_COUNT.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Height (mm)",
      cell: (row, update) => (
        <Input
          aria-label={`Height for ${row.name}`}
          value={row.heightMm}
          onChange={(event) =>
            update({ ...row, heightMm: toInteger(event.target.value) ?? 0 })
          }
        />
      ),
    },
  ];
}

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
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...(isAdmin ? [createSelectionColumn(columnHelper)] : []),
        columnHelper.accessor("name", {
          header: "Name",
          cell: (info) =>
            catalogNameCell(
              `/catalog/memories/${info.row.original.id}`,
              info.getValue(),
            ),
        }),
        columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
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
    const selected = items.filter((item) => rowSelection[item.id]);
    if (selected.length === 0) return;
    setEditRows(selected);
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
          <FieldGroup className="catalog-filter-grid">
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
                <Input
                  id="memory-height-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  aria-label="Height min"
                  value={draft.heightMm?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      heightMm: {
                        min: toOptionalNumber(event.target.value),
                        max: current.heightMm?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="memory-height-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Height max"
                  value={draft.heightMm?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      heightMm: {
                        min: current.heightMm?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
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
            loadingMessage="Loading memories…"
            emptyFilteredMessage="No memories match these filters."
            emptyMessage="No memories in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Memory"
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
            totalCount={totalCount}
            countLabel="CPUs"
            onPageChange={goToPage}
          />
        </div>
      </div>
      {editRows ? (
        <BulkEditDialog
          title="Edit Memories"
          rows={editRows}
          columns={memoryEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateMemories(rows);
            queryClient.invalidateQueries({ queryKey: memoryKeys.all });
            setEditRows(null);
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
