import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteMultipleGpuSeries,
  updateMultipleGpuSeries,
  listGpuSeries,
  masterDataKeys,
  type GpuSeriesOption,
  importGpuSeries,
} from "@/api/master-data";
import { GpuSeriesFormDialog } from "@/components/master-data/GpuSeriesFormDialog";
import {
  closeMasterDataEditor,
  gpuSeriesEditPath,
  newMasterDataEditValue,
} from "@/lib/master-data-edit";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import {
  filterByNameAndFields,
  useIdNameChoices,
} from "@/lib/named-list-filter";
import {
  idSelectBulkColumn,
  nameBulkColumn,
} from "@/components/BulkEditColumns";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FilterActions,
  formSelectClassName,
  NameField,
} from "@/components/filters/ListFilters";
import { MasterDataResults } from "@/components/master-data/MasterDataResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useExcelImport } from "@/hooks/use-excel-import";
import { ui } from "@/i18n/translate-enum";
import {
  BulkEditDialog,
  type BulkEditColumn,
} from "@/components/BulkEditDialog";

const EMPTY_ITEMS: GpuSeriesOption[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  GpuSeriesOption
>();
function listColumns() {
  return columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: ui.header("name"),
    cell: (info) => (
      <Link to={gpuSeriesEditPath(info.row.original.id)}>
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("manufacturerName", { header: ui.header("manufacturer") }),
]);
}

function gpuSeriesEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<GpuSeriesOption>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
  ];
}
type GpuSeriesFilter = {
  name?: string;
  manufacturerId?: string;
};

const emptyGpuSeriesFilter: GpuSeriesFilter = {};

function isGpuSeriesFilterActive(filter: GpuSeriesFilter) {
  return Object.values(filter).some((value) => value !== undefined);
}

export function GpuSeriesListPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: masterDataKeys.gpuSeries,
    queryFn: listGpuSeries,
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<GpuSeriesFilter>(emptyGpuSeriesFilter);
  const [applied, setApplied] = useState<GpuSeriesFilter>(emptyGpuSeriesFilter);
  const filtering = isGpuSeriesFilterActive(applied);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const columns = useMemo(() => listColumns(), []);
  const [editRows, setEditRows] = useState<GpuSeriesOption[] | null>(null);
  const manufacturers = useIdNameChoices(
    items,
    "manufacturerId",
    "manufacturerName",
  );
  const visibleItems = useMemo(
    () => filterByNameAndFields(items, applied, ["manufacturerId"]),
    [applied, items],
  );
  const bulkDelete = useBulkDelete({
    items: visibleItems,
    rowSelection,
    setRowSelection,
    queryKey: masterDataKeys.gpuSeries,
    singular: ui.label("nGpuSeries"),
    plural: ui.label("nGpuSeries"),
    deleteByIds: (ids) => deleteMultipleGpuSeries({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: masterDataKeys.gpuSeries,
    importFile: importGpuSeries,
  });
  function startEditing() {
    beginBulkEdit(visibleItems, rowSelection, setEditRows);
  }
  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptyGpuSeriesFilter);
    setApplied(emptyGpuSeriesFilter);
  }

  return (
    <section className="catalog-page">
      <h1>{ui.nav("master.gpuSeries")}</h1>
      <p className="catalog-lead">{ui.message("browseMasterDataLead")}</p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <NameField
              id="gpu-series-name"
              name="name"
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
            />
            <Field>
              <FieldLabel htmlFor="gpu-series-manufacturer">{ui.label("manufacturer")}</FieldLabel>
              <select
                id="gpu-series-manufacturer"
                className={formSelectClassName}
                value={draft.manufacturerId ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, manufacturerId: event.target.value })
                }
              >
                <option value="">{ui.label("any")}</option>
                {manufacturers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
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
            loadingMessage={ui.empty("loading", { entity: ui.entity("gpuSeries") })}
            emptyFilteredMessage={ui.empty("noMatchFilters", { entity: ui.entity("gpuSeries") })}
            emptyMessage={ui.empty("noneFound", { entity: ui.entity("gpuSeries") })}
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onEditSelected={startEditing}
            onImport={excelImport.openImport}
            newItemTo={gpuSeriesEditPath(newMasterDataEditValue)}
            newItemLabel={ui.action("newGpuSeries")}
          />
        </div>
      </div>
      {editRows ? (
        <BulkEditDialog
          title={ui.dialog("editGpuSeries")}
          rows={editRows}
          columns={gpuSeriesEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateMultipleGpuSeries(rows);
            await queryClient.invalidateQueries({
              queryKey: masterDataKeys.gpuSeries,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {editingId ? (
        <GpuSeriesFormDialog
          key={editingId}
          editingId={editingId}
          gpuSeries={items}
          gpuSeriesSettled={query.isSuccess || query.isError}
          onClose={() => closeMasterDataEditor(searchParams, setSearchParams)}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
