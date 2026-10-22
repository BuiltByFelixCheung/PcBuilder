import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteGpus,
  updateGpus,
  listGpus,
  masterDataKeys,
  type GpuOption,
  importGpus,
} from "@/api/master-data";
import { GpuFormDialog } from "@/components/master-data/GpuFormDialog";
import {
  closeMasterDataEditor,
  gpuEditPath,
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

const EMPTY_ITEMS: GpuOption[] = [];
const columnHelper = createColumnHelper<typeof dataTableFeatures, GpuOption>();
function listColumns() {
  return columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: ui.header("name"),
    cell: (info) => (
      <Link to={gpuEditPath(info.row.original.id)}>{info.getValue()}</Link>
    ),
  }),
  columnHelper.accessor("manufacturerName", {
    header: ui.header("manufacturer"),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("gpuSeriesName", {
    header: ui.header("series"),
    cell: (info) => info.getValue(),
  }),
]);
}

function gpuEditColumns(
  manufacturers: { id: string; name: string }[],
  series: { id: string; name: string }[],
): BulkEditColumn<GpuOption>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
    idSelectBulkColumn(ui.label("series"), "gpuSeriesId", series),
  ];
}

type GpuFilter = {
  name?: string;
  manufacturerId?: string;
  gpuSeriesId?: string;
};

const emptyGpuFilter: GpuFilter = {};

function isGpuFilterActive(filter: GpuFilter) {
  return Object.values(filter).some(Boolean);
}

export function GpuListPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: masterDataKeys.gpus,
    queryFn: listGpus,
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<GpuFilter>(emptyGpuFilter);
  const [applied, setApplied] = useState<GpuFilter>(emptyGpuFilter);
  const filtering = isGpuFilterActive(applied);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const columns = useMemo(() => listColumns(), []);
  const [editRows, setEditRows] = useState<GpuOption[] | null>(null);
  const manufacturers = useIdNameChoices(
    items,
    "manufacturerId",
    "manufacturerName",
  );
  const series = useIdNameChoices(items, "gpuSeriesId", "gpuSeriesName");
  const visibleItems = useMemo(
    () =>
      filterByNameAndFields(items, applied, ["manufacturerId", "gpuSeriesId"]),
    [applied, items],
  );
  const bulkDelete = useBulkDelete({
    items: visibleItems,
    rowSelection,
    setRowSelection,
    queryKey: masterDataKeys.gpus,
    singular: ui.label("nGpu"),
    plural: ui.label("nGpus"),
    deleteByIds: (ids) => deleteGpus({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: masterDataKeys.gpus,
    importFile: importGpus,
  });
  function startEditing() {
    beginBulkEdit(visibleItems, rowSelection, setEditRows);
  }
  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptyGpuFilter);
    setApplied(emptyGpuFilter);
  }

  return (
    <section className="catalog-page">
      <h1>{ui.nav("master.gpus")}</h1>
      <p className="catalog-lead">{ui.message("browseMasterDataLead")}</p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <NameField
              id="gpu-name"
              name="name"
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
            />
            <Field>
              <FieldLabel htmlFor="gpu-manufacturer">{ui.label("manufacturer")}</FieldLabel>
              <select
                id="gpu-manufacturer"
                name="manufacturerId"
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
            <Field>
              <FieldLabel htmlFor="gpu-series">{ui.label("series")}</FieldLabel>
              <select
                id="gpu-series"
                name="gpuSeriesId"
                className={formSelectClassName}
                value={draft.gpuSeriesId ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, gpuSeriesId: event.target.value })
                }
              >
                <option value="">{ui.label("any")}</option>
                {series.map((item) => (
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
            loadingMessage={ui.empty("loading", { entity: ui.entity("gpus") })}
            emptyFilteredMessage={ui.empty("noMatchFilters", { entity: ui.entity("gpus") })}
            emptyMessage={ui.empty("noneFound", { entity: ui.entity("gpus") })}
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onEditSelected={startEditing}
            onImport={excelImport.openImport}
            newItemTo={gpuEditPath(newMasterDataEditValue)}
            newItemLabel={ui.action("newGpu")}
            keepTableWhenEmpty
          />
        </div>
        {editRows ? (
          <BulkEditDialog
            title={ui.dialog("editGpus")}
            rows={editRows}
            columns={gpuEditColumns(manufacturers, series)}
            onClose={() => setEditRows(null)}
            onSave={async (rows) => {
              await updateGpus(rows);
              await queryClient.invalidateQueries({
                queryKey: masterDataKeys.gpus,
              });
              setRowSelection({});
            }}
          />
        ) : null}
        {editingId ? (
          <GpuFormDialog
            key={editingId}
            editingId={editingId}
            gpus={items}
            gpusSettled={query.isSuccess || query.isError}
            onClose={() => closeMasterDataEditor(searchParams, setSearchParams)}
          />
        ) : null}
      </div>
      {excelImport.importDialog}
    </section>
  );
}
