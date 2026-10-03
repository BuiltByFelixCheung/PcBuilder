import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteMultipleCpuSeries,
  updateMultipleCpuSeries,
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
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import {
  filterByNameAndFields,
  socketsForManufacturer,
  useIdNameChoices,
  useSocketChoices,
} from "@/lib/named-list-filter";
import {
  idSelectBulkColumn,
  nameBulkColumn,
} from "@/components/BulkEditColumns";
import { FieldGroup } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MasterDataResults } from "@/components/master-data/MasterDataResults";
import {
  FilterActions,
  NameField,
  IdSelectField,
} from "@/components/filters/ListFilters";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  BulkEditDialog,
  type BulkEditColumn,
} from "@/components/BulkEditDialog";

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

function cpuSeriesEditColumns(
  manufacturers: { id: string; name: string }[],
  sockets: { id: string; name: string; manufacturerId: string }[],
): BulkEditColumn<CpuSeriesOption>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    idSelectBulkColumn("Socket", "socketId", sockets),
  ];
}

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
  const queryClient = useQueryClient();
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
  const [editRows, setEditRows] = useState<CpuSeriesOption[] | null>(null);
  const manufacturers = useIdNameChoices(
    items,
    "manufacturerId",
    "manufacturerName",
  );
  const sockets = useSocketChoices(items);
  const socketOptions = socketsForManufacturer(sockets, draft.manufacturerId);
  const visibleItems = useMemo(
    () => filterByNameAndFields(items, applied, ["manufacturerId", "socketId"]),
    [applied, items],
  );
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
  function startEditing() {
    beginBulkEdit(visibleItems, rowSelection, setEditRows);
  }
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
            onEditSelected={startEditing}
            onImport={excelImport.openImport}
            newItemTo={cpuSeriesEditPath(newMasterDataEditValue)}
            newItemLabel="New CPU Series"
          />
        </div>
      </div>
      {editRows ? (
        <BulkEditDialog
          title="Edit CPU Series"
          rows={editRows}
          columns={cpuSeriesEditColumns(manufacturers, sockets)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateMultipleCpuSeries(rows);
            await queryClient.invalidateQueries({
              queryKey: masterDataKeys.cpuSeries,
            });
            setRowSelection({});
          }}
        />
      ) : null}
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
