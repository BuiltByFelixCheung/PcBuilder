import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogLeadColumns } from "@/components/catalog/CatalogLeadColumns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import { deleteCpuCoolers } from "@/api/catalog/bulk-delete";
import {
  cpuCoolerKeys,
  isCpuCoolerFilterActive,
  updateCpuCoolers,
  type CpuCoolerFilter,
  type CpuCoolerListItem,
} from "@/api/catalog/cpu-coolers";
import { DecimalInput } from "@/components/catalog/DecimalInput";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
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
import {
  CPU_COOLER_TYPES,
  RADIATOR_CLASSES,
  formatRadiatorClass,
} from "@/api/enums";
import {enumText, ui} from "@/i18n/translate-enum";
import { usePcBuild } from "@/builds/use-pc-build";
import type { RangeFilter } from "@/api/paging";
import { CatalogListResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importCpuCoolers } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogFilterActions,
  CatalogFilterGroup,
  CatalogNameField,
  CatalogCompatibleCheckbox,
  CatalogEnumField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import { CpuCoolerEditColumns } from "@/pages/catalog/cpu-coolers/CpuCoolerEditColumns";
import { useQueryClient } from "@tanstack/react-query";

const EMPTY_ITEMS: CpuCoolerListItem[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  CpuCoolerListItem
>();

function formatOptionalMm(value: number | null | undefined) {
  return value != null ? `${value} ${ui.unit("mm")}` : "—";
}

const COOLER_MM_COLUMNS = [
  ["coolerLengthMm", ui.label("length")],
  ["coolerWidthMm", ui.label("width")],
  ["coolerHeightMm", ui.label("height")],
  ["maxRamHeightMm", ui.label("maxRamHeight")],
] as const;

const RADIATOR_AND_FAN_MM_COLUMNS = [
  ["radiatorLengthMm", ui.label("radiatorLength")],
  ["radiatorWidthMm", ui.label("radiatorWidth")],
  ["radiatorHeightMm", ui.label("radiatorHeight")],
  ["waterBlockLengthMm", ui.label("waterBlockLength")],
  ["waterBlockWidthMm", ui.label("waterBlockWidth")],
  ["waterBlockHeightMm", ui.label("waterBlockHeight")],
  ["fanThicknessMm", ui.label("fanThickness")],
  ["fanWidthMm", ui.label("fanWidth")],
  ["fanHeightMm", ui.label("fanHeight")],
] as const;

export function CpuCoolerListPage() {
  const queryClient = useQueryClient();
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
  const [editRows, setEditRows] = useState<CpuCoolerListItem[] | null>(null);

  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/cpu-coolers/${id}`,
        ),
        columnHelper.accessor("type", {
          header: ui.header("type"),
          cell: (info) => enumText.cpuCoolerType(info.getValue()),
        }),
        ...COOLER_MM_COLUMNS.map(([key, header]) =>
          columnHelper.accessor(key, {
            header,
            cell: (info) => formatOptionalMm(info.getValue()),
          }),
        ),
        columnHelper.accessor("radiatorClass", {
          header: ui.header("radiatorClass"),
          cell: (info) => {
            const value = info.getValue();
            return value ? formatRadiatorClass(value) : "—";
          },
        }),
        ...RADIATOR_AND_FAN_MM_COLUMNS.map(([key, header]) =>
          columnHelper.accessor(key, {
            header,
            cell: (info) => formatOptionalMm(info.getValue()),
          }),
        ),
        columnHelper.accessor("fanCount", {
          header: ui.header("fanCount"),
          cell: (info) => info.getValue() ?? "—",
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
    singular: ui.label("nCpuCooler"),
    plural: ui.label("nCpuCoolers"),
    deleteByIds: (ids) => deleteCpuCoolers({ ids }),
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

  function startEditing() {
    beginBulkEdit(items, rowSelection, setEditRows);
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
    key: "coolerHeightMm" | "maxRamHeightMm",
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
      <h1>{ui.nav("products.cpuCoolers")}</h1>
      <p className="catalog-lead">{ui.message("browseCatalogLead")}</p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <CatalogFilterGroup>
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
              label={ui.label("manufacturer")}
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
              label={ui.label("type")}
              value={draft.type}
              options={CPU_COOLER_TYPES}
              formatOption={enumText.cpuCoolerType}
              onChange={(type) => setDraft((current) => ({ ...current, type }))}
            />
            <CatalogIdSelectField
              id="cooler-socket"
              label={ui.label("socket")}
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
              label={ui.label("radiatorClass")}
              value={draft.radiatorClass}
              options={RADIATOR_CLASSES}
              formatOption={formatRadiatorClass}
              onChange={(radiatorClass) =>
                setDraft((current) => ({ ...current, radiatorClass }))
              }
            />
            <Field>
              <FieldLabel htmlFor="cooler-height-min">{ui.label("heightMm")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="cooler-height-min"
                  placeholder={ui.label("min")}
                  value={draft.coolerHeightMm?.min}
                  onValue={(min) => setRange("coolerHeightMm", "min", min)}
                />
                <DecimalInput
                  label={ui.label("heightMax")}
                  placeholder={ui.label("max")}
                  value={draft.coolerHeightMm?.max}
                  onValue={(max) => setRange("coolerHeightMm", "max", max)}
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="cooler-ram-height-min">{ui.label("maxRamHeightMm")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="cooler-ram-height-min"
                  placeholder={ui.label("min")}
                  value={draft.maxRamHeightMm?.min}
                  onValue={(min) => setRange("maxRamHeightMm", "min", min)}
                />
                <DecimalInput
                  label={ui.label("maxRamHeightMax")}
                  placeholder={ui.label("max")}
                  value={draft.maxRamHeightMm?.max}
                  onValue={(max) => setRange("maxRamHeightMm", "max", max)}
                />
              </div>
            </Field>
          </CatalogFilterGroup>
          <CatalogFilterActions onClear={clearFilters} />
        </form>
        <CatalogListResults
          entity="cpuCoolers"
          query={query}
          items={items}
          filtering={filtering}
          columns={columns}
          isAdmin={isAdmin}
          newItemLabel={ui.action("newCpuCooler")}
          newItemTo="/catalog/cpu-coolers/new"
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
      {editRows ? (
        <BulkEditDialog
          title={ui.dialog("editCpuCoolers")}
          rows={editRows}
          columns={CpuCoolerEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateCpuCoolers(rows);
            await queryClient.invalidateQueries({
              queryKey: cpuCoolerKeys.all,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
