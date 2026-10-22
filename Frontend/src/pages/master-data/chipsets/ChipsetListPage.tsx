import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteChipsets,
  listChipsets,
  masterDataKeys,
  type ChipsetOption,
  importChipsets,
} from "@/api/master-data";
import { ChipsetFormDialog } from "@/components/master-data/ChipsetFormDialog";
import {
  chipsetEditPath,
  closeMasterDataEditor,
  newMasterDataEditValue,
} from "@/lib/master-data-edit";
import {
  filterByNameAndFields,
  socketsForManufacturer,
  useIdNameChoices,
  useSocketChoices,
} from "@/lib/named-list-filter";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery } from "@tanstack/react-query";
import {
  FilterActions,
  formSelectClassName,
  IdSelectField,
  NameField,
} from "@/components/filters/ListFilters";
import { MasterDataResults } from "@/components/master-data/MasterDataResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useExcelImport } from "@/hooks/use-excel-import";
import { ui } from "@/i18n/translate-enum";

const EMPTY_ITEMS: ChipsetOption[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  ChipsetOption
>();
function listColumns() {
  return columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: ui.header("name"),
    cell: (info) => (
      <Link to={chipsetEditPath(info.row.original.id)}>{info.getValue()}</Link>
    ),
  }),
  columnHelper.accessor("manufacturerName", { header: ui.header("manufacturer") }),
  columnHelper.accessor("socketName", { header: ui.header("socket") }),
]);
}

type ChipsetFilter = {
  name?: string;
  manufacturerId?: string;
  socketId?: string;
};

const emptyChipsetFilter: ChipsetFilter = {};

function isChipsetFilterActive(filter: ChipsetFilter) {
  return Boolean(filter.name || filter.manufacturerId || filter.socketId);
}

export function ChipsetListPage() {
  const query = useQuery({
    queryKey: masterDataKeys.chipsets,
    queryFn: () => listChipsets(),
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<ChipsetFilter>(emptyChipsetFilter);
  const [applied, setApplied] = useState<ChipsetFilter>(emptyChipsetFilter);
  const filtering = isChipsetFilterActive(applied);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const columns = useMemo(() => listColumns(), []);
  const manufacturers = useIdNameChoices(
    items,
    "manufacturerId",
    "manufacturerName",
  );
  const sockets = useSocketChoices(items);
  const socketOptions = socketsForManufacturer(sockets, draft.manufacturerId);
  const visibleItems = useMemo(
    () =>
      filterByNameAndFields(items, applied, ["manufacturerId", "socketId"]),
    [applied, items],
  );
  const bulkDelete = useBulkDelete({
    items: visibleItems,
    rowSelection,
    setRowSelection,
    queryKey: masterDataKeys.chipsets,
    singular: ui.label("nChipset"),
    plural: ui.label("nChipsets"),
    deleteByIds: (ids) => deleteChipsets({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: masterDataKeys.chipsets,
    importFile: importChipsets,
  });

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptyChipsetFilter);
    setApplied(emptyChipsetFilter);
  }

  return (
    <section className="catalog-page">
      <h1>{ui.nav("master.chipsets")}</h1>
      <p className="catalog-lead">{ui.message("browseMasterDataLead")}</p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <NameField
              id="chipset-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <Field>
              <FieldLabel htmlFor="chipset-manufacturer">{ui.label("manufacturer")}</FieldLabel>
              <select
                id="chipset-manufacturer"
                className={formSelectClassName}
                value={draft.manufacturerId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    manufacturerId: event.target.value || undefined,
                    socketId: undefined,
                  }))
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
            <IdSelectField
              id="chipset-socket"
              label={ui.label("socket")}
              value={draft.socketId}
              options={socketOptions}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  socketId: value || undefined,
                }))
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
            loadingMessage={ui.empty("loading", { entity: ui.entity("chipsets") })}
            emptyFilteredMessage={ui.empty("noMatchFilters", { entity: ui.entity("chipsets") })}
            emptyMessage={ui.empty("noneYet", { entity: ui.entity("chipsets") })}
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onImport={excelImport.openImport}
            newItemTo={chipsetEditPath(newMasterDataEditValue)}
            newItemLabel={ui.action("newChipset")}
          />
        </div>
      </div>
      {editingId ? (
        <ChipsetFormDialog
          key={editingId}
          editingId={editingId}
          chipsets={items}
          chipsetsSettled={query.isSuccess || query.isError}
          onClose={() => closeMasterDataEditor(searchParams, setSearchParams)}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
