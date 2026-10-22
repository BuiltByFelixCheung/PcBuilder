import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  catalogLeadColumns,
  unitColumn,
  yesNoColumn,
} from "@/components/catalog/CatalogLeadColumns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import { deleteGraphicsCards } from "@/api/catalog/bulk-delete";
import {
  createGraphicsCard,
  graphicsCardKeys,
  isGraphicsCardFilterActive,
  updateGraphicsCards,
  type GraphicsCardFilter,
  type GraphicsCardListItem,
} from "@/api/catalog/graphics-cards";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { useAuth } from "@/auth/use-auth";
import { useGraphicsCardFilterOptions } from "@/hooks/use-graphics-card-filter-options";
import { useGraphicsCards } from "@/hooks/use-graphics-cards";
import {
  graphicsCardListParamsFromSearch,
  graphicsCardListSearchFromParams,
  emptyGraphicsCardFilter,
} from "@/api/catalog/params/graphics-card-list-params";
import { toInteger } from "@/api/helper";
import {
  PCIE_GENERATIONS,
  PCIE_SLOTS_USED,
  VIDEO_MEMORY_GB,
  type PcieGeneration,
} from "@/api/enums";
import {enumText, ui} from "@/i18n/translate-enum";
import {
  CatalogCompatibleCheckbox,
  CatalogOptionalBooleanField,
  CatalogRangeField,
} from "@/components/catalog/CatalogFilterFields.tsx";
import { usePcBuild } from "@/builds/use-pc-build";
import { unsetCatalogItem } from "@/components/catalog/catalog-create";
import { CatalogCreateDialog } from "@/components/catalog/CatalogCreateDialog";
import { CatalogListResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importGraphicsCards } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogFilterActions,
  CatalogFilterGroup,
  CatalogNameField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import {
  GraphicsCardEditColumns,
  GraphicsCardFields,
} from "@/pages/catalog/graphics-cards/GraphicsCardEditColumns";
import { useQueryClient } from "@tanstack/react-query";

const EMPTY_ITEMS: GraphicsCardListItem[] = [];
const emptyCard = unsetCatalogItem<GraphicsCardListItem>({
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  gpuId: "",
  gpuName: "",
  videoMemoryGb: 0,
  pcieSlotsUsed: 0,
  pcieGeneration: "",
  isLowProfile: false,
  lengthMm: 0,
  widthMm: 0,
  heightMm: 0,
  powerConsumptionWatts: 0,
  powerConnectorType: "",
  powerConnectorCount: 0,
});
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  GraphicsCardListItem
>();
const selectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function GraphicsCardListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [gpuManufacturerId, setGpuManufacturerId] = useState<
    string | undefined
  >(undefined);
  const [gpuSeriesId, setGpuSeriesId] = useState<string | undefined>(undefined);

  const params = useMemo(
    () => graphicsCardListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<GraphicsCardFilter>(() => params.filter);
  const { manufacturers, gpus, gpuSeries, gpuManufacturers } =
    useGraphicsCardFilterOptions();
  const query = useGraphicsCards(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editRows, setEditRows] = useState<GraphicsCardListItem[] | null>(null);
  const [creating, setCreating] = useState(false);
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/graphics-cards/${id}`,
        ),
        columnHelper.accessor("gpuName", { header: ui.header("gpu") }),
        unitColumn(
          columnHelper,
          "videoMemoryGb",
          ui.header("videoMemory"),
          ui.unit("gb"),
        ),
        columnHelper.accessor("pcieSlotsUsed", { header: ui.header("pcieSlotsUsed") }),
        columnHelper.accessor("pcieGeneration", {
          header: ui.header("pcieGeneration"),
          cell: (info) => enumText.pcieGeneration(info.getValue()),
        }),
        yesNoColumn(columnHelper, "isLowProfile", ui.header("isLowProfile")),
        unitColumn(columnHelper, "lengthMm", ui.header("length"), ui.unit("mm")),
        unitColumn(columnHelper, "widthMm", ui.header("width"), ui.unit("mm")),
        unitColumn(columnHelper, "heightMm", ui.header("height"), ui.unit("mm")),
        unitColumn(
          columnHelper,
          "powerConsumptionWatts",
          ui.header("powerConsumption"),
          ui.unit("watts"),
        ),
        columnHelper.accessor("powerConnectorType", {
          header: ui.header("powerConnectorType"),
        }),
        columnHelper.accessor("powerConnectorCount", {
          header: ui.header("powerConnectorCount"),
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: graphicsCardKeys.all,
    singular: ui.label("nGraphicsCard"),
    plural: ui.label("nGraphicsCards"),
    deleteByIds: (ids) => deleteGraphicsCards({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: graphicsCardKeys.all,
    importFile: importGraphicsCards,
  });
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isGraphicsCardFilterActive(params.filter);
  const gpuSeriesOptions = gpuManufacturerId
    ? gpuSeries.filter((item) => item.manufacturerId === gpuManufacturerId)
    : gpuSeries;
  const gpuOptions = gpus.filter((item) => {
    if (gpuManufacturerId && item.manufacturerId !== gpuManufacturerId)
      return false;
    if (gpuSeriesId && item.gpuSeriesId !== gpuSeriesId) return false;
    return true;
  });
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(params.filter.chassisId || params.filter.motherboardId),
  );

  function startEditing() {
    beginBulkEdit(items, rowSelection, setEditRows);
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      graphicsCardListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: draft,
      }),
    );
  }

  function applyCompatibleFilter(checked: boolean) {
    const next = {
      chassisId: checked ? currentBuild.chassisId : undefined,
      motherboardId: checked ? currentBuild.motherboardId : undefined,
    };
    setShowOnlyCompatible(checked);
    setDraft((current) => ({ ...current, ...next }));
    setSearchParams(
      graphicsCardListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: { ...params.filter, ...next },
      }),
    );
  }

  function clearFilters() {
    setShowOnlyCompatible(false);
    setDraft(emptyGraphicsCardFilter);
    setGpuManufacturerId(undefined);
    setGpuSeriesId(undefined);
    setSearchParams(
      graphicsCardListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyGraphicsCardFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      graphicsCardListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>{ui.nav("products.graphicsCards")}</h1>
      <p className="catalog-lead">{ui.message("browseCatalogLead")}</p>

      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <CatalogFilterGroup>
            <CatalogCompatibleCheckbox
              checked={showOnlyCompatible}
              onCheckedChange={applyCompatibleFilter}
            />
            <CatalogNameField
              id="graphics-card-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="graphics-card-manufacturer"
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
            <Field>
              <FieldLabel htmlFor="graphics-card-gpu-manufacturer">{ui.label("gpuManufacturer")}</FieldLabel>
              <select
                id="graphics-card-gpu-manufacturer"
                className={selectClassName}
                value={gpuManufacturerId ?? ""}
                onChange={(event) => {
                  setGpuManufacturerId(event.target.value || undefined);
                  setGpuSeriesId(undefined);
                  setDraft((current) => ({ ...current, gpuId: undefined }));
                }}
              >
                <option value="">{ui.label("any")}</option>
                {gpuManufacturers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="graphics-card-gpu-series">{ui.label("gpuSeries")}</FieldLabel>
              <select
                id="graphics-card-gpu-series"
                className={selectClassName}
                value={gpuSeriesId ?? ""}
                onChange={(event) => {
                  setGpuSeriesId(event.target.value || undefined);
                  setDraft((current) => ({ ...current, gpuId: undefined }));
                }}
              >
                <option value="">{ui.label("any")}</option>
                {gpuSeriesOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <CatalogIdSelectField
              id="graphics-card-gpu-id"
              label={ui.label("gpu")}
              value={draft.gpuId}
              options={gpuOptions}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  gpuId: value || undefined,
                }))
              }
            />
            <Field>
              <FieldLabel htmlFor="graphics-card-video-memory">{ui.label("videoMemory")}</FieldLabel>
              <select
                id="graphics-card-video-memory"
                className={selectClassName}
                value={draft.videoMemoryGb ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    videoMemoryGb: toInteger(event.target.value) ?? undefined,
                  }))
                }
              >
                <option value="">{ui.label("any")}</option>
                {VIDEO_MEMORY_GB.map((memory) => (
                  <option key={memory} value={memory}>
                    {memory} {ui.unit("gb")}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="graphics-card-pcie-slots-used">{ui.label("pcieSlotsUsed")}</FieldLabel>
              <select
                id="graphics-card-pcie-slots-used"
                className={selectClassName}
                value={draft.pcieSlotsUsed ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    pcieSlotsUsed: toInteger(event.target.value) ?? undefined,
                  }))
                }
              >
                <option value="">{ui.label("any")}</option>
                {PCIE_SLOTS_USED.map((slots) => (
                  <option key={slots} value={slots}>
                    {slots}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="graphics-card-pcie-generation">{ui.label("pcieGeneration")}</FieldLabel>
              <select
                id="graphics-card-pcie-generation"
                className={selectClassName}
                value={draft.pcieGeneration ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    pcieGeneration: (event.target.value || undefined) as
                      PcieGeneration | undefined,
                  }))
                }
              >
                <option value="">{ui.label("any")}</option>
                {PCIE_GENERATIONS.map((generation) => (
                  <option key={generation} value={generation}>
                    {enumText.pcieGeneration(generation)}
                  </option>
                ))}
              </select>
            </Field>
            <CatalogOptionalBooleanField
              id="graphics-card-low-profile"
              label={ui.label("lowProfile")}
              value={draft.isLowProfile}
              onChange={(isLowProfile) =>
                setDraft((current) => ({ ...current, isLowProfile }))
              }
            />
            <CatalogRangeField
              id="graphics-card-length"
              label={ui.label("lengthMm")}
              maxAriaLabel={ui.label("lengthMax")}
              range={draft.lengthMm}
              onChange={(lengthMm) =>
                setDraft((current) => ({ ...current, lengthMm }))
              }
            />
            <CatalogRangeField
              id="graphics-card-width"
              label={ui.label("widthMm")}
              maxAriaLabel={ui.label("widthMax")}
              range={draft.widthMm}
              onChange={(widthMm) =>
                setDraft((current) => ({ ...current, widthMm }))
              }
            />
            <CatalogRangeField
              id="graphics-card-height"
              label={ui.label("heightMm")}
              maxAriaLabel={ui.label("heightMax")}
              range={draft.heightMm}
              onChange={(heightMm) =>
                setDraft((current) => ({ ...current, heightMm }))
              }
            />
            <CatalogRangeField
              id="graphics-card-power"
              label={ui.label("powerConsumptionW")}
              maxAriaLabel={ui.label("powerConsumptionMax")}
              range={draft.powerConsumptionWatts}
              onChange={(powerConsumptionWatts) =>
                setDraft((current) => ({
                  ...current,
                  powerConsumptionWatts,
                }))
              }
            />
          </CatalogFilterGroup>
          <CatalogFilterActions onClear={clearFilters} />
        </form>

        <CatalogListResults
          entity="graphicsCards"
          query={query}
          items={items}
          filtering={filtering}
          columns={columns}
          isAdmin={isAdmin}
          newItemLabel={ui.action("newGraphicsCard")}
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
          title={ui.dialog("newGraphicsCard")}
          item={emptyCard}
          fields={GraphicsCardFields(manufacturers, gpus)}
          queryKey={graphicsCardKeys.all}
          detailPath={(id) => `/catalog/graphics-cards/${id}`}
          onClose={() => setCreating(false)}
          create={createGraphicsCard}
        />
      ) : null}
      {editRows ? (
        <BulkEditDialog
          title={ui.dialog("editGraphicsCards")}
          rows={editRows}
          columns={GraphicsCardEditColumns(manufacturers, gpus)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateGraphicsCards(rows);
            await queryClient.invalidateQueries({
              queryKey: graphicsCardKeys.all,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
