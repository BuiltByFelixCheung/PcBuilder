import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  listChipsets,
  masterDataKeys,
  type ChipsetOption,
} from "@/api/master-data";
import { ChipsetFormDialog } from "@/pages/master-data/chipsets/ChipsetFormDialog";
import {
  chipsetEditPath,
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
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";

const EMPTY_ITEMS: ChipsetOption[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  ChipsetOption
>();
const columns = columnHelper.columns([
  createSelectionColumn(columnHelper),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <Link to={chipsetEditPath(info.row.original.id)}>{info.getValue()}</Link>
    ),
  }),
  columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
  columnHelper.accessor("socketName", { header: "Socket" }),
]);

type ChipsetFilter = {
  name?: string;
  manufacturerId?: string;
  socketId?: string;
};

const emptyChipsetFilter: ChipsetFilter = {};

function isChipsetFilterActive(filter: ChipsetFilter) {
  return Boolean(filter.name || filter.manufacturerId || filter.socketId);
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
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

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  function clearFilters() {
    setDraft(emptyChipsetFilter);
    setApplied(emptyChipsetFilter);
  }

  function closeEditor() {
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next, { replace: true });
  }

  return (
    <section className="catalog-page">
      <h1>Chipsets</h1>
      <p className="catalog-lead">
        Browse the master data, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <Field>
              <FieldLabel htmlFor="chipset-name">Name</FieldLabel>
              <Input
                id="chipset-name"
                value={draft.name ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="chipset-manufacturer">
                Manufacturer
              </FieldLabel>
              <select
                id="chipset-manufacturer"
                className={catalogSelectClassName}
                value={draft.manufacturerId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    manufacturerId: event.target.value || undefined,
                    socketId: undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {manufacturers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="chipset-socket">Socket</FieldLabel>
              <select
                id="chipset-socket"
                className={catalogSelectClassName}
                value={draft.socketId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    socketId: event.target.value || undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {socketOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
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
      </div>
      {editingId ? (
        <ChipsetFormDialog
          key={editingId}
          editingId={editingId}
          chipsets={items}
          chipsetsSettled={query.isSuccess || query.isError}
          onClose={closeEditor}
        />
      ) : null}
    </section>
  );

  function renderCatalog(): ReactNode {
    if (query.isPending && !query.data) {
      return <PageStatus>Loading chipsets…</PageStatus>;
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
              to={chipsetEditPath(newMasterDataEditValue)}
            >
              New Chipset
            </Link>
          </Button>
          <Button>Import</Button>
        </div>
        {visibleItems.length === 0 ? (
          <PageStatus>
            {filtering
              ? "No chipsets match these filters."
              : "No chipsets yet."}
          </PageStatus>
        ) : (
          <DataTable
            data={visibleItems}
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        )}
      </>
    );
  }
}
