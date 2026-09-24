import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteMultipleCpuSeries,
  listCpuSeries,
  masterDataKeys,
  type CpuSeriesOption,
  importCpuSeries,
} from "@/api/master-data";
import { CpuSeriesFormDialog } from "@/components/master-data/CpuSeriesFormDialog";
import {
  closeMasterDataEditor,
  cpuSeriesEditPath,
  newMasterDataEditValue,
} from "@/lib/master-data-edit";
import { uniqueById } from "@/lib/unique-by-id";
import { FieldGroup } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery } from "@tanstack/react-query";
import { MasterDataResults } from "@/components/master-data/MasterDataResults";
import {
  FilterActions,
  NameField,
  IdSelectField,
} from "@/components/filters/ListFilters";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useExcelImport } from "@/hooks/use-excel-import";

const EMPTY_ITEMS: CpuSeriesOption[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  CpuSeriesOption
>();
const columns = columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <Link to={cpuSeriesEditPath(info.row.original.id)}>
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
  columnHelper.accessor("socketName", { header: "Socket" }),
]);

type CpuSeriesFilter = {
  name?: string;
  manufacturerId?: string;
  socketId?: string;
};

const emptyCpuSeriesFilter: CpuSeriesFilter = {};

function isCpuSeriesFilterActive(filter: CpuSeriesFilter) {
  return Boolean(filter.name || filter.manufacturerId || filter.socketId);
}

export function CpuSeriesListPage() {
  const query = useQuery({
    queryKey: masterDataKeys.cpuSeries,
    queryFn: listCpuSeries,
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<CpuSeriesFilter>(emptyCpuSeriesFilter);
  const [applied, setApplied] = useState<CpuSeriesFilter>(emptyCpuSeriesFilter);
  const filtering = isCpuSeriesFilterActive(applied);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const manufacturers = useMemo(
    () =>
      uniqueById(
        items.map((item) => ({
          id: item.manufacturerId,
          name: item.manufacturerName,
        })),
      ),
    [items],
  );
  const sockets = useMemo(
    () =>
      uniqueById(
        items.map((item) => ({
          id: item.socketId,
          name: item.socketName,
          manufacturerId: item.manufacturerId,
        })),
      ),
    [items],
  );
  const socketOptions = draft.manufacturerId
    ? sockets.filter((item) => item.manufacturerId === draft.manufacturerId)
    : sockets;
  const visibleItems = useMemo(() => {
    const name = applied.name?.trim().toLowerCase();
    return items.filter((item) => {
      if (name && !item.name.toLowerCase().includes(name)) return false;
      if (
        applied.manufacturerId &&
        item.manufacturerId !== applied.manufacturerId
      )
        return false;
      if (applied.socketId && item.socketId !== applied.socketId) return false;
      return true;
    });
  }, [applied, items]);
  const bulkDelete = useBulkDelete({
    items: visibleItems,
    rowSelection,
    setRowSelection,
    queryKey: masterDataKeys.cpuSeries,
    singular: "CPU series",
    plural: "CPU series",
    deleteByIds: (ids) => deleteMultipleCpuSeries({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: masterDataKeys.cpuSeries,
    importFile: importCpuSeries,
  });

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptyCpuSeriesFilter);
    setApplied(emptyCpuSeriesFilter);
  }

  return (
    <section className="catalog-page">
      <h1>CPU Series</h1>
      <p className="catalog-lead">
        Browse the master data, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <NameField
              id="cpu-series-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <IdSelectField
              id="cpu-series-manufacturer"
              label="Manufacturer"
              value={draft.manufacturerId}
              options={manufacturers}
              onChange={(value) =>
                setDraft((current) => ({ ...current, manufacturerId: value }))
              }
            />
            <IdSelectField
              id="cpu-series-socket"
              label="Socket"
              value={draft.socketId}
              options={socketOptions}
              onChange={(value) =>
                setDraft((current) => ({ ...current, socketId: value }))
              }
            />
          </FieldGroup>
          <FilterActions onClear={clearFilters} />
        </form>
        <div className="catalog-results">
          <MasterDataResults
            isInitialLoading={query.isPending && !query.data}
            isError={query.isError}
            error={query.error}
            items={visibleItems}
            filtering={filtering}
            loadingMessage="Loading CPU Series…"
            emptyFilteredMessage="No CPU Series match these filters."
            emptyMessage="No CPU Series yet."
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onImport={excelImport.openImport}
            newItemTo={cpuSeriesEditPath(newMasterDataEditValue)}
            newItemLabel="New CPU Series"
          />
        </div>
      </div>
      {editingId ? (
        <CpuSeriesFormDialog
          key={editingId}
          editingId={editingId}
          cpuSeries={items}
          cpuSeriesSettled={query.isSuccess || query.isError}
          onClose={() => closeMasterDataEditor(searchParams, setSearchParams)}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
