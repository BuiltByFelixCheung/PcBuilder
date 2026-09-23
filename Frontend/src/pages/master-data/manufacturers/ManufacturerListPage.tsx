import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  listManufacturers,
  masterDataKeys,
  type NamedMasterData,
} from "@/api/master-data";
import { ManufacturerFormDialog } from "@/pages/master-data/manufacturers/ManufacturerFormDialog";
import {
  manufacturerEditPath,
  newMasterDataEditValue,
} from "@/pages/master-data/master-data-edit";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery } from "@tanstack/react-query";
import { MasterDataResults } from "@/pages/catalog/catalog-results";
import { CatalogFilterActions } from "@/pages/catalog/catalog-filter-fields";

const EMPTY_ITEMS: NamedMasterData[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  NamedMasterData
>();
const columns = columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <Link to={manufacturerEditPath(info.row.original.id)}>
        {info.getValue()}
      </Link>
    ),
  }),
]);

type ManufacturerFilter = {
  name?: string;
};

const emptyManufacturerFilter: ManufacturerFilter = {};

function isManufacturerFilterActive(filter: ManufacturerFilter) {
  return Object.values(filter).some(Boolean);
}

export function ManufacturerListPage() {
  const query = useQuery({
    queryKey: masterDataKeys.manufacturers,
    queryFn: listManufacturers,
  });
  const items = query.data ?? EMPTY_ITEMS;
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const [draft, setDraft] = useState<ManufacturerFilter>(emptyManufacturerFilter);
  const [applied, setApplied] = useState<ManufacturerFilter>(emptyManufacturerFilter);
  const filtering = isManufacturerFilterActive(applied);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const visibleItems = useMemo(() => {
    const name = applied.name?.trim().toLowerCase();
    return items.filter((item) => {
      if (name && !item.name.toLowerCase().includes(name)) return false;
      return true;
    });
  }, [applied, items]);

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptyManufacturerFilter);
    setApplied(emptyManufacturerFilter);
  }

  function closeEditor() {
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next);
  }

  return (
    <section className="catalog-page">
      <h1>Manufacturers</h1>
      <p className="catalog-lead">
        Browse the master data, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                id="manufacturer-name"
                name="name"
                value={draft.name ?? ""}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </Field>
          </FieldGroup>
          <CatalogFilterActions onClear={clearFilters} />
        </form>
        <div className="catalog-results">
          <MasterDataResults
            isInitialLoading={query.isPending && !query.data}
            isError={query.isError}
            error={query.error}
            items={visibleItems}
            filtering={filtering}
            loadingMessage="Loading Manufacturers…"
            emptyFilteredMessage="No Manufacturers match these filters."
            emptyMessage="No Manufacturers found."
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            newItemTo={manufacturerEditPath(newMasterDataEditValue)}
            newItemLabel="New Manufacturer"
            showImport={false}
            keepTableWhenEmpty
          />
        </div>
        {editingId ? (
            <ManufacturerFormDialog
                key={editingId}
                editingId={editingId}
                manufacturers={items}
                manufacturersSettled={query.isSuccess || query.isError}
                onClose={closeEditor}
            />
        ) : null}
      </div>
    </section>
  );

}