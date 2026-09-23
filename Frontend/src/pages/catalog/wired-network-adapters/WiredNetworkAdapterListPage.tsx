import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  isWiredNetworkAdapterFilterActive,
  type WiredNetworkAdapter,
  type WiredNetworkAdapterFilter,
} from "@/api/catalog/wired-network-adapters";
import { FieldGroup } from "@/components/ui/field";
import {
  createColumnHelper,
  type CellContext,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useAuth } from "@/auth/useAuth";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { useWiredNetworkAdapters } from "@/hooks/use-wired-network-adapters.ts";
import {
  emptyWiredNetworkAdapterFilter,
  wiredNetworkAdapterListParamsFromSearch,
  wiredNetworkAdapterListSearchFromParams,
} from "@/api/catalog/params/wired-network-adapter-list-params";
import {
  PCIE_SLOT_TYPES,
  USB_TYPES,
  USB_VERSIONS,
  WIRED_HOST_INTERFACES,
} from "@/api/enums";
import { CatalogCompatibleCheckbox } from "@/pages/catalog/catalog-filter-fields.tsx";
import { usePcBuild } from "@/builds/usePcBuild";
import { CatalogPagedResults } from "@/pages/catalog/catalog-results";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogEnumField,
  CatalogIdSelectField,
  CatalogRangeField,
} from "@/pages/catalog/catalog-filter-fields";

const EMPTY_ITEMS: WiredNetworkAdapter[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  WiredNetworkAdapter
>();

export function WiredNetworkAdapterListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => wiredNetworkAdapterListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<WiredNetworkAdapterFilter>(
    () => params.filter,
  );
  const manufacturers = useCatalogManufacturers("wirednetworkadapter");
  const query = useWiredNetworkAdapters(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...(isAdmin ? [createSelectionColumn(columnHelper)] : []),
        columnHelper.accessor("name", {
          header: "Name",
          cell: nameCell,
        }),
        columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
        columnHelper.accessor("hostInterface", { header: "Interface" }),
        columnHelper.accessor("maxSpeedMbps", {
          header: "Max speed",
          cell: (info) => `${info.getValue()} Mbps`,
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isWiredNetworkAdapterFilterActive(params.filter);
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(params.filter.motherboardId),
  );

  function compatibilityIds(checked: boolean) {
    return {
      motherboardId: checked ? currentBuild.motherboardId : undefined,
    };
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      wiredNetworkAdapterListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: draft,
      }),
    );
  }

  function applyCompatibleFilter(checked: boolean) {
    const next = compatibilityIds(checked);
    setShowOnlyCompatible(checked);
    setDraft((current) => ({ ...current, ...next }));
    setSearchParams(
      wiredNetworkAdapterListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: { ...params.filter, ...next },
      }),
    );
  }

  function clearFilters() {
    setShowOnlyCompatible(false);
    setDraft(emptyWiredNetworkAdapterFilter);
    setSearchParams(
      wiredNetworkAdapterListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyWiredNetworkAdapterFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      wiredNetworkAdapterListSearchFromParams({
        ...params,
        pageIndex: nextIndex,
      }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>Wired Network Adapters</h1>
      <p className="catalog-lead">
        Browse the catalog, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <CatalogCompatibleCheckbox
              checked={showOnlyCompatible}
              onCheckedChange={applyCompatibleFilter}
            />
            <CatalogNameField
              id="wired-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="wired-manufacturer"
              label="Manufacturer"
              value={draft.manufacturerId}
              options={manufacturers}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  manufacturerId: value || undefined,
                }))
              }
            />
            <CatalogEnumField
              id="wired-interface"
              label="Host interface"
              value={draft.hostInterface}
              options={WIRED_HOST_INTERFACES}
              onChange={(hostInterface) =>
                setDraft((current) => ({ ...current, hostInterface }))
              }
            />
            <CatalogRangeField
              id="wired-speed"
              label="Max speed (Mbps)"
              maxAriaLabel="Max speed max"
              range={draft.maxSpeedMbps}
              onChange={(maxSpeedMbps) =>
                setDraft((current) => ({ ...current, maxSpeedMbps }))
              }
            />
            <CatalogEnumField
              id="wired-usb-version"
              label="USB version"
              value={draft.usbVersion}
              options={USB_VERSIONS}
              onChange={(usbVersion) =>
                setDraft((current) => ({ ...current, usbVersion }))
              }
            />
            <CatalogEnumField
              id="wired-usb-type"
              label="USB type"
              value={draft.usbType}
              options={USB_TYPES}
              onChange={(usbType) =>
                setDraft((current) => ({ ...current, usbType }))
              }
            />
            <CatalogEnumField
              id="wired-pcie-slot"
              label="PCIe slot"
              value={draft.pcieSlotType}
              options={PCIE_SLOT_TYPES}
              onChange={(pcieSlotType) =>
                setDraft((current) => ({ ...current, pcieSlotType }))
              }
            />
          </FieldGroup>
          <CatalogFilterActions onClear={clearFilters} />
        </form>
        <div className="catalog-results">
          <CatalogPagedResults
            isInitialLoading={query.isPending && !query.data}
            isError={query.isError}
            error={query.error}
            items={items}
            filtering={filtering}
            loadingMessage="Loading wired network adapters…"
            emptyFilteredMessage="No wired network adapters match these filters."
            emptyMessage="No wired network adapters in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Wired Network Adapter"
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            pageIndex={pageIndex}
            pageCount={pageCount}
            totalCount={totalCount}
            countLabel="adapters"
            onPageChange={goToPage}
          />
        </div>
      </div>
    </section>
  );
}

function nameCell(
  info: CellContext<typeof dataTableFeatures, WiredNetworkAdapter, string>,
) {
  return (
    <Link to={`/catalog/wired-network-adapters/${info.row.original.id}`}>
      {info.getValue()}
    </Link>
  );
}
