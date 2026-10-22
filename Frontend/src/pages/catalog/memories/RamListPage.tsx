import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogLeadColumns, unitColumn } from "@/components/catalog/CatalogLeadColumns";
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
import {enumText, ui} from "@/i18n/translate-enum";
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
import { CatalogListResults } from "@/components/catalog/CatalogResults";
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
        columnHelper.accessor("ddrGeneration", {
          header: ui.header("ddrGeneration"),
          cell: (info) => enumText.ddrGeneration(info.getValue()),
        }),
        columnHelper.accessor("ramFormFactor", {
          header: ui.header("ramFormFactor"),
          cell: (info) => enumText.ramFormFactor(info.getValue()),
        }),
        columnHelper.accessor("ramRank", {
          header: ui.header("ramRank"),
          cell: (info) => enumText.ramRank(info.getValue()),
        }),
        unitColumn(
          columnHelper,
          "memorySizePerStickGb",
          ui.header("moduleSize"),
          ui.unit("gb"),
        ),
        unitColumn(
          columnHelper,
          "totalMemorySizeGb",
          ui.header("kitSize"),
          ui.unit("gb"),
        ),
        unitColumn(
          columnHelper,
          "maxMemorySpeedMts",
          ui.header("speed"),
          ui.unit("mtS"),
        ),
        columnHelper.accessor("modulesCount", { header: ui.header("modulesCount") }),
        unitColumn(columnHelper, "heightMm", ui.header("height"), ui.unit("mm")),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: memoryKeys.all,
    singular: ui.label("nRamModule"),
    plural: ui.label("nRamModules"),
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
      <h1>{ui.page("memory")}</h1>
      <p className="catalog-lead">{ui.message("browseCatalogLead")}</p>
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
              <FieldLabel htmlFor="memory-manufacturer">{ui.label("manufacturer")}</FieldLabel>
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
                <option value="">{ui.label("all")}</option>
                {manufacturerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-ddr-generation">{ui.label("ddrGeneration")}</FieldLabel>
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
                <option value="">{ui.label("all")}</option>
                {DDR_GENERATIONS.map((generation) => (
                  <option key={generation} value={generation}>
                    {enumText.ddrGeneration(generation)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-ram-form-factor">{ui.label("ramFormFactor")}</FieldLabel>
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
                <option value="">{ui.label("all")}</option>
                {RAM_FORM_FACTORS.map((factor) => (
                  <option key={factor} value={factor}>
                    {enumText.ramFormFactor(factor)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-ram-rank">{ui.label("ramRank")}</FieldLabel>
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
                <option value="">{ui.label("all")}</option>
                {RAM_RANKS.map((rank) => (
                  <option key={rank} value={rank}>
                    {enumText.ramRank(rank)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-module-size">{ui.label("moduleSize")}</FieldLabel>
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
                <option value="">{ui.label("all")}</option>
                {moduleSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} {ui.unit("gb")}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-kit-size">{ui.label("kitSize")}</FieldLabel>
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
                <option value="">{ui.label("all")}</option>
                {kitSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} {ui.unit("gb")}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-speed">{ui.label("speed")}</FieldLabel>
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
                <option value="">{ui.label("all")}</option>
                {speedOptions.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed} {ui.unit("mtS")}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-modules-count">{ui.label("modulesCountLong")}</FieldLabel>
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
                <option value="">{ui.label("all")}</option>
                {MODULES_COUNT.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="memory-height-min">{ui.label("height")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="memory-height-min"
                  label={ui.label("heightMin")}
                  placeholder={ui.label("min")}
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
                  label={ui.label("heightMax")}
                  placeholder={ui.label("max")}
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

        <CatalogListResults
          entity="memories"
          query={query}
          items={items}
          filtering={filtering}
          columns={columns}
          isAdmin={isAdmin}
          newItemLabel={ui.action("newMemory")}
          onNewItem={() => setCreating(true)}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          bulkDelete={bulkDelete}
          onImport={excelImport.openImport}
          onEditSelected={startEditing}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={goToPage}
        />
      </div>
      {creating ? (
        <CatalogCreateDialog
          title={ui.dialog("newMemory")}
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
          title={ui.dialog("editMemories")}
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
