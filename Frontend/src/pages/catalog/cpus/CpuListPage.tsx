import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogLeadColumns } from "@/components/catalog/CatalogLeadColumns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import { deleteCpus } from "@/api/catalog/bulk-delete";
import {
  cpuKeys,
  isCpuFilterActive,
  updateCpus,
  type CpuFilter,
  type CpuListItem,
} from "@/api/catalog/cpus";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { useAuth } from "@/auth/use-auth";
import { useCpuFilterOptions } from "@/hooks/use-cpu-filter-options.ts";
import { useCpus } from "@/hooks/use-cpus.ts";
import {
  cpuListParamsFromSearch,
  cpuListSearchFromParams,
  emptyCpuFilter,
} from "@/api/catalog/params/cpu-list-params";
import { usePcBuild } from "@/builds";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importCpus } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogFilterActions,
  CatalogFilterGroup,
  CatalogNameField,
  CatalogCompatibleCheckbox,
  CatalogIdSelectField,
  CatalogRangeField,
} from "@/components/catalog/CatalogFilterFields";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import { CpuEditColumns } from "@/pages/catalog/cpus/CpuEditColumns";
import { useQueryClient } from "@tanstack/react-query";

const EMPTY_ITEMS: CpuListItem[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  CpuListItem
>();

export function CpuListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => cpuListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<CpuFilter>(() => params.filter);
  const { manufacturers, sockets, series } = useCpuFilterOptions();
  const query = useCpus(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editRows, setEditRows] = useState<CpuListItem[] | null>(null);

  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/cpus/${id}`,
        ),
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
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: cpuKeys.all,
    singular: "CPU",
    plural: "CPUs",
    deleteByIds: (ids) => deleteCpus({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: cpuKeys.all,
    importFile: importCpus,
  });
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
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(params.filter.motherboardId),
  );

  function startEditing() {
    beginBulkEdit(items, rowSelection, setEditRows);
  }

  function applyCompatibleFilter(checked: boolean) {
    const motherboardId = checked ? currentBuild.motherboardId : undefined;
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
          <CatalogFilterGroup>
            <CatalogCompatibleCheckbox
              checked={showOnlyCompatible}
              onCheckedChange={applyCompatibleFilter}
            />
            <CatalogNameField
              id="cpu-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="cpu-manufacturer"
              label="Manufacturer"
              value={draft.manufacturerId}
              options={manufacturers}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  manufacturerId: value || undefined,
                  socketId: undefined,
                  seriesId: undefined,
                }))
              }
            />
            <CatalogIdSelectField
              id="cpu-socket"
              label="Socket"
              value={draft.socketId}
              options={socketOptions}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  socketId: value || undefined,
                  seriesId: undefined,
                }))
              }
            />
            <CatalogIdSelectField
              id="cpu-series"
              label="Series"
              value={draft.seriesId}
              options={seriesOptions}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  seriesId: value || undefined,
                }))
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
            loadingMessage="Loading CPUs…"
            emptyFilteredMessage="No CPUs match these filters."
            emptyMessage="No CPUs in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New CPU"
            newItemTo="/catalog/cpus/new"
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
            onPageChange={goToPage}
          />
        </div>
      </div>
      {editRows ? (
        <BulkEditDialog
          title="Edit CPUs"
          rows={editRows}
          columns={CpuEditColumns(manufacturers, series, sockets)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateCpus(rows);
            await queryClient.invalidateQueries({
              queryKey: cpuKeys.all,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
