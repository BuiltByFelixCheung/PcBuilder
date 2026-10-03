import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteWiredNetworkAdapters } from "@/api/catalog/bulk-delete";
import {
  createWiredNetworkAdapter,
  wiredNetworkAdapterKeys,
  isWiredNetworkAdapterFilterActive,
  updateWiredNetworkAdapters,
  type WiredNetworkAdapter,
  type WiredNetworkAdapterFilter,
} from "@/api/catalog/wired-network-adapters";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { catalogLeadColumns } from "@/components/catalog/CatalogLeadColumns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import { useMotherboardOnlyCompatibility } from "@/hooks/use-motherboard-compatibility";
import { useAuth } from "@/auth/use-auth";
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
import { CatalogCompatibleCheckbox } from "@/components/catalog/CatalogFilterFields.tsx";
import { unsetCatalogItem } from "@/components/catalog/catalog-create";
import { CatalogCreateDialog } from "@/components/catalog/CatalogCreateDialog";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importWiredNetworkAdapters } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogFilterActions,
  CatalogFilterGroup,
  CatalogNameField,
  CatalogEnumField,
  CatalogIdSelectField,
  CatalogRangeField,
} from "@/components/catalog/CatalogFilterFields";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  WiredNetworkAdapterEditColumns,
  WiredNetworkAdapterFields,
} from "@/pages/catalog/wired-network-adapters/WiredNetworkAdapterEditColumns";

const EMPTY_ITEMS: WiredNetworkAdapter[] = [];
const emptyAdapter = unsetCatalogItem<WiredNetworkAdapter>({
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  hostInterface: "",
  maxSpeedMbps: 0,
  usbVersion: null,
  usbType: null,
  pcieSlotType: null,
});
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  WiredNetworkAdapter
>();

export function WiredNetworkAdapterListPage() {
  const queryClient = useQueryClient();
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
  const [editRows, setEditRows] = useState<WiredNetworkAdapter[] | null>(null);
  const [creating, setCreating] = useState(false);

  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/wired-network-adapters/${id}`,
        ),
        columnHelper.accessor("hostInterface", { header: "Interface" }),
        columnHelper.accessor("maxSpeedMbps", {
          header: "Max speed",
          cell: (info) => `${info.getValue()} Mbps`,
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: wiredNetworkAdapterKeys.all,
    singular: "wired network adapter",
    plural: "wired network adapters",
    deleteByIds: (ids) => deleteWiredNetworkAdapters({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: wiredNetworkAdapterKeys.all,
    importFile: importWiredNetworkAdapters,
  });
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isWiredNetworkAdapterFilterActive(params.filter);
  const { showOnlyCompatible, setShowOnlyCompatible, compatibilityIds } =
    useMotherboardOnlyCompatibility(Boolean(params.filter.motherboardId));

  function startEditing() {
    beginBulkEdit(items, rowSelection, setEditRows);
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
          <CatalogFilterGroup>
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
          </CatalogFilterGroup>
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
            onNewItem={() => setCreating(true)}
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onEditSelected={startEditing}
            onImport={excelImport.openImport}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={goToPage}
          />
        </div>
      </div>
      {creating ? (
        <CatalogCreateDialog
          title="New wired network adapter"
          item={emptyAdapter}
          fields={WiredNetworkAdapterFields(manufacturers)}
          queryKey={wiredNetworkAdapterKeys.all}
          detailPath={(id) => `/catalog/wired-network-adapters/${id}`}
          onClose={() => setCreating(false)}
          create={createWiredNetworkAdapter}
        />
      ) : null}
      {editRows ? (
        <BulkEditDialog
          title="Edit Wired Network Adapters"
          rows={editRows}
          columns={WiredNetworkAdapterEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateWiredNetworkAdapters(rows);
            await queryClient.invalidateQueries({
              queryKey: wiredNetworkAdapterKeys.all,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
