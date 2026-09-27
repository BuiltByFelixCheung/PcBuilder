import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogLeadColumns } from "@/components/catalog/catalog-lead-columns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import {
  enumSelectBulkColumn,
  idSelectBulkColumn,
  integerColumn,
  nameBulkColumn,
} from "@/components/bulk-edit-columns";
import { deleteGraphicsCards } from "@/api/catalog/bulk-delete";
import {
  graphicsCardKeys,
  isGraphicsCardFilterActive,
  updateGraphicsCards,
  type GraphicsCardFilter,
  type GraphicsCardListItem,
} from "@/api/catalog/graphics-cards";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
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
  PSU_CABLE_TYPES,
  VIDEO_MEMORY_GB,
  type PcieGeneration,
} from "@/api/enums";
import {
  CatalogCompatibleCheckbox,
  CatalogOptionalBooleanField,
  CatalogRangeField,
} from "@/components/catalog/CatalogFilterFields.tsx";
import { usePcBuild } from "@/builds/use-pc-build";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importGraphicsCards } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import { BulkEditDialog, type BulkEditColumn } from "@/components/BulkEditDialog";
import { useQueryClient } from "@tanstack/react-query";

const EMPTY_ITEMS: GraphicsCardListItem[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  GraphicsCardListItem
>();
const selectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";


function graphicsCardEditColumns(
  manufacturers: { id: string; name: string }[],
  gpus: { id: string; name: string }[],
): BulkEditColumn<GraphicsCardListItem>[] {
  const counted = (header: string, field: "videoMemoryGb" | "pcieSlotsUsed" | "lengthMm" | "widthMm" | "heightMm" | "powerConsumptionWatts" | "powerConnectorCount") =>
    integerColumn<GraphicsCardListItem>(header, field, { type: "number", min: 0 });

  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    idSelectBulkColumn("GPU", "gpuId", gpus),
    counted("Video Memory", "videoMemoryGb"),
    counted("Pcie Slots Used", "pcieSlotsUsed"),
    enumSelectBulkColumn("Pcie Generation", "pcieGeneration", PCIE_GENERATIONS, {
      label: (generation) => generation.replace("Gen", "PCIe "),
    }),
    {
      header: "Is Low Profile",
      cell: (row, update) => (
        <Checkbox
          checked={row.isLowProfile}
          onCheckedChange={(checked) => update({ ...row, isLowProfile: checked as boolean })}
        />
      ),
    },
    counted("Length (mm)", "lengthMm"),
    counted("Width (mm)", "widthMm"),
    counted("Height (mm)", "heightMm"),
    counted("Power Consumption (W)", "powerConsumptionWatts"),
    enumSelectBulkColumn("Power Connector Type", "powerConnectorType", PSU_CABLE_TYPES),
    counted("Power Connector Count", "powerConnectorCount"),
  ];
}

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
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/graphics-cards/${id}`,
        ),
        columnHelper.accessor("gpuName", { header: "GPU" }),
        columnHelper.accessor("videoMemoryGb", {
          header: "Video Memory",
          cell: (info) => `${info.getValue()} GB`,
        }),
        columnHelper.accessor("pcieSlotsUsed", { header: "Pcie Slots Used" }),
        columnHelper.accessor("pcieGeneration", { header: "Pcie Generation" }),
        columnHelper.accessor("isLowProfile", {
          header: "Is Low Profile",
          cell: (info) => (info.getValue() ? "Yes" : "No"),
        }),
        columnHelper.accessor("lengthMm", {
          header: "Length",
          cell: (info) => `${info.getValue()} mm`,
        }),
        columnHelper.accessor("widthMm", {
          header: "Width",
          cell: (info) => `${info.getValue()} mm`,
        }),
        columnHelper.accessor("heightMm", {
          header: "Height",
          cell: (info) => `${info.getValue()} mm`,
        }),
        columnHelper.accessor("powerConsumptionWatts", {
          header: "Power Consumption",
          cell: (info) => `${info.getValue()} W`,
        }),
        columnHelper.accessor("powerConnectorType", {
          header: "Power Connector Type",
        }),
        columnHelper.accessor("powerConnectorCount", {
          header: "Power Connector Count",
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
    singular: "graphics card",
    plural: "graphics cards",
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
      <h1>Graphics Cards</h1>
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
              id="graphics-card-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="graphics-card-manufacturer"
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
            <Field>
              <FieldLabel htmlFor="graphics-card-gpu-manufacturer">
                GPU Manufacturer
              </FieldLabel>
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
                <option value="">Any</option>
                {gpuManufacturers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="graphics-card-gpu-series">
                GPU Series
              </FieldLabel>
              <select
                id="graphics-card-gpu-series"
                className={selectClassName}
                value={gpuSeriesId ?? ""}
                onChange={(event) => {
                  setGpuSeriesId(event.target.value || undefined);
                  setDraft((current) => ({ ...current, gpuId: undefined }));
                }}
              >
                <option value="">Any</option>
                {gpuSeriesOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <CatalogIdSelectField
              id="graphics-card-gpu-id"
              label="GPU"
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
              <FieldLabel htmlFor="graphics-card-video-memory">
                Video Memory
              </FieldLabel>
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
                <option value="">Any</option>
                {VIDEO_MEMORY_GB.map((memory) => (
                  <option key={memory} value={memory}>
                    {memory} GB
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="graphics-card-pcie-slots-used">
                Pcie Slots Used
              </FieldLabel>
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
                <option value="">Any</option>
                {PCIE_SLOTS_USED.map((slots) => (
                  <option key={slots} value={slots}>
                    {slots}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="graphics-card-pcie-generation">
                PCIe Generation
              </FieldLabel>
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
                <option value="">Any</option>
                {PCIE_GENERATIONS.map((generation) => (
                  <option key={generation} value={generation}>
                    {generation.replace("Gen", "PCIe ")}
                  </option>
                ))}
              </select>
            </Field>
            <CatalogOptionalBooleanField
              id="graphics-card-low-profile"
              label="Low profile"
              value={draft.isLowProfile}
              onChange={(isLowProfile) =>
                setDraft((current) => ({ ...current, isLowProfile }))
              }
            />
            <CatalogRangeField
              id="graphics-card-length"
              label="Length (mm)"
              maxAriaLabel="Length max"
              range={draft.lengthMm}
              onChange={(lengthMm) =>
                setDraft((current) => ({ ...current, lengthMm }))
              }
            />
            <CatalogRangeField
              id="graphics-card-width"
              label="Width (mm)"
              maxAriaLabel="Width max"
              range={draft.widthMm}
              onChange={(widthMm) =>
                setDraft((current) => ({ ...current, widthMm }))
              }
            />
            <CatalogRangeField
              id="graphics-card-height"
              label="Height (mm)"
              maxAriaLabel="Height max"
              range={draft.heightMm}
              onChange={(heightMm) =>
                setDraft((current) => ({ ...current, heightMm }))
              }
            />
            <CatalogRangeField
              id="graphics-card-power"
              label="Power consumption (W)"
              maxAriaLabel="Power consumption max"
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
            loadingMessage="Loading graphics cards…"
            emptyFilteredMessage="No graphics cards match these filters."
            emptyMessage="No graphics cards in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Graphics Card"
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onImport={excelImport.openImport}
            onEditSelected={startEditing}
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
          title="Edit Graphics Cards"
          rows={editRows}
          columns={graphicsCardEditColumns(manufacturers, gpus)}
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
