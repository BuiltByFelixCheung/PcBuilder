import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  listSockets,
  masterDataKeys,
  deleteSockets,
  updateSockets,
  type SocketOption,
  importSockets,
} from "@/api/master-data";
import {
  BulkEditDialog,
  type BulkEditColumn,
} from "@/components/BulkEditDialog";
import { SocketFormDialog } from "@/components/master-data/SocketFormDialog";
import {
  closeMasterDataEditor,
  newMasterDataEditValue,
  socketEditPath,
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
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useExcelImport } from "@/hooks/use-excel-import";
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
import { MasterDataListResults } from "@/components/master-data/MasterDataResults";
import { ui } from "@/i18n/translate-enum";

const EMPTY_ITEMS: SocketOption[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  SocketOption
>();
type SocketFilter = {
  name?: string;
  manufacturerId?: string;
};

const emptySocketFilter: SocketFilter = {};

function isSocketFilterActive(filter: SocketFilter) {
  return Boolean(filter.name || filter.manufacturerId);
}

function listColumns() {
  return columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: ui.header("name"),
    cell: (info) => (
      <Link to={socketEditPath(info.row.original.id)}>{info.getValue()}</Link>
    ),
  }),
  columnHelper.accessor("manufacturerName", { header: ui.header("manufacturer") }),
]);
}

function socketEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<SocketOption>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn(ui.label("manufacturer"), "manufacturerId", manufacturers),
  ];
}

export function SocketListPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: masterDataKeys.sockets,
    queryFn: () => listSockets(),
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<SocketFilter>(emptySocketFilter);
  const [applied, setApplied] = useState<SocketFilter>(emptySocketFilter);
  const filtering = isSocketFilterActive(applied);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const columns = useMemo(() => listColumns(), []);
  const [editRows, setEditRows] = useState<SocketOption[] | null>(null);
  const manufacturers = useIdNameChoices(
    items,
    "manufacturerId",
    "manufacturerName",
  );
  const visibleItems = useMemo(
    () => filterByNameAndFields(items, applied, ["manufacturerId"]),
    [items, applied],
  );
  const bulkDelete = useBulkDelete({
    items: visibleItems,
    rowSelection,
    setRowSelection,
    queryKey: masterDataKeys.sockets,
    singular: ui.label("nSocket"),
    plural: ui.label("nSockets"),
    deleteByIds: (ids) => deleteSockets({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: masterDataKeys.sockets,
    importFile: importSockets,
  });
  function startEditing() {
    beginBulkEdit(visibleItems, rowSelection, setEditRows);
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptySocketFilter);
    setApplied(emptySocketFilter);
    setRowSelection({});
    setEditRows(null);
  }

  return (
    <section className="catalog-page">
      <h1>{ui.nav("master.sockets")}</h1>
      <p className="catalog-lead">{ui.message("browseMasterDataLead")}</p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <NameField
              id="socket-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <Field>
              <FieldLabel htmlFor="socket-manufacturer">{ui.label("manufacturer")}</FieldLabel>
              <select
                id="socket-manufacturer"
                className={formSelectClassName}
                value={draft.manufacturerId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    manufacturerId: event.target.value || undefined,
                  }))
                }
              >
                <option value="">{ui.label("all")}</option>
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGroup>
          <FilterActions onClear={clearFilters} />
        </form>
        <MasterDataListResults
          entity="sockets"
          empty="noneYet"
          query={query}
          items={visibleItems}
          filtering={filtering}
          columns={columns}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          bulkDelete={bulkDelete}
          onEditSelected={startEditing}
          onImport={excelImport.openImport}
          newItemTo={socketEditPath(newMasterDataEditValue)}
          newItemLabel={ui.action("newSocket")}
        />
      </div>
      {editRows ? (
        <BulkEditDialog
          title={ui.dialog("editSockets")}
          rows={editRows}
          columns={socketEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            const sockets = rows.map((row) => ({
              ...row,
              name: row.name.trim(),
              manufacturerName:
                manufacturers.find((item) => item.id === row.manufacturerId)
                  ?.name ?? row.manufacturerName,
            }));
            if (sockets.some((row) => row.name.length === 0)) {
              throw new Error(ui.message("nameRequired"));
            }
            if (sockets.some((row) => row.name.length > 200)) {
              throw new Error(ui.message("nameTooLong200"));
            }
            await updateSockets(sockets);
            await queryClient.invalidateQueries({
              queryKey: masterDataKeys.sockets,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {editingId ? (
        <SocketFormDialog
          key={editingId}
          editingId={editingId}
          sockets={items}
          socketsSettled={query.isSuccess || query.isError}
          onClose={() => closeMasterDataEditor(searchParams, setSearchParams)}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
