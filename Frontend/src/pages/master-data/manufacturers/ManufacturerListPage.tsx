import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
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
import { PageStatus } from "@/components/PageStatus";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useQuery } from "@tanstack/react-query";

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
          <div className="catalog-filter-actions">
            <Button type="submit">Apply filters</Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </form>
        <div className="catalog-results">{renderCatalog()}</div>
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

  function renderCatalog(): ReactNode {
    if (query.isPending && !query.data) {
      return <PageStatus>Loading Manufacturers…</PageStatus>;
    }

    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }

    const hasSelection = Object.values(rowSelection).some(Boolean);

    return (
      <>
        <div className="catalog-results-actions">
          <Button disabled={!hasSelection}>Edit Selected</Button>
          <Button disabled={!hasSelection}>Delete Selected</Button>
          <Button asChild>
            <Link
              style={{ textDecoration: "none", color: "black" }}
              to={manufacturerEditPath(newMasterDataEditValue)}
            >
              New Manufacturer
            </Link>
          </Button>
        </div>
        {visibleItems.length === 0 ? (
          <PageStatus>
            {filtering
              ? "No Manufacturers match these filters."
              : "No Manufacturers found."}
          </PageStatus>
        ) : null}
        <DataTable data={visibleItems} columns={columns} rowSelection={rowSelection} onRowSelectionChange={setRowSelection} />
      </>
    );
  }
}