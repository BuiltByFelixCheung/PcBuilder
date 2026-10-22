import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteWirelessNetworkAdapters } from "@/api/catalog/bulk-delete";
import {
  createWirelessNetworkAdapter,
  wirelessNetworkAdapterKeys,
  isWirelessNetworkAdapterFilterActive,
  updateWirelessNetworkAdapters,
  type WirelessNetworkAdapter,
  type WirelessNetworkAdapterFilter,
} from "@/api/catalog/wireless-network-adapters";
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
import { useWirelessNetworkAdapters } from "@/hooks/use-wireless-network-adapters.ts";
import {
  emptyWirelessNetworkAdapterFilter,
  wirelessNetworkAdapterListParamsFromSearch,
  wirelessNetworkAdapterListSearchFromParams,
} from "@/api/catalog/params/wireless-network-adapter-list-params";
import {
  BLUETOOTH_VERSIONS,
  M2_FORM_FACTORS,
  M2_KEYS,
  PCIE_SLOT_TYPES,
  USB_TYPES,
  USB_VERSIONS,
  WIFI_STANDARDS,
  WIRELESS_HOST_INTERFACES,
  formatBluetoothVersion,
  formatM2FormFactor,
  formatWifiStandard,
} from "@/api/enums";
import {enumText, ui} from "@/i18n/translate-enum";
import {
  CatalogCompatibleCheckbox,
  CatalogRangeField,
} from "@/components/catalog/CatalogFilterFields.tsx";
import { unsetCatalogItem } from "@/components/catalog/catalog-create";
import { CatalogCreateDialog } from "@/components/catalog/CatalogCreateDialog";
import { CatalogListResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importWirelessNetworkAdapters } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogFilterActions,
  CatalogFilterGroup,
  CatalogNameField,
  CatalogEnumField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  WirelessNetworkAdapterEditColumns,
  WirelessNetworkAdapterFields,
} from "@/pages/catalog/wireless-network-adapters/WirelessNetworkAdapterEditColumns";

const EMPTY_ITEMS: WirelessNetworkAdapter[] = [];
const emptyAdapter = unsetCatalogItem<WirelessNetworkAdapter>({
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  wifiStandard: "",
  bluetoothVersion: null,
  hostInterface: "",
  maxSpeedMbps: 0,
  maxSpeedMbps5G: null,
  maxSpeedMbps6G: null,
  pcieSlotType: null,
  key: null,
  m2FormFactor: null,
  usbVersion: null,
  usbType: null,
});
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  WirelessNetworkAdapter
>();

export function WirelessNetworkAdapterListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => wirelessNetworkAdapterListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<WirelessNetworkAdapterFilter>(
    () => params.filter,
  );
  const manufacturers = useCatalogManufacturers("wirelessnetworkadapter");
  const query = useWirelessNetworkAdapters(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const queryClient = useQueryClient();
  const [editRows, setEditRows] = useState<WirelessNetworkAdapter[] | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/wireless-network-adapters/${id}`,
        ),
        columnHelper.accessor("wifiStandard", {
          header: ui.header("wifi"),
          cell: (info) => formatWifiStandard(info.getValue()),
        }),
        columnHelper.accessor("hostInterface", {
          header: ui.header("interface"),
          cell: (info) => enumText.wifiInterface(info.getValue()),
        }),
        columnHelper.accessor("maxSpeedMbps", {
          header: ui.header("maxSpeed"),
          cell: (info) => `${info.getValue()} ${ui.unit("mbps")}`,
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: wirelessNetworkAdapterKeys.all,
    singular: ui.label("nWireless"),
    plural: ui.label("nWirelesss"),
    deleteByIds: (ids) => deleteWirelessNetworkAdapters({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: wirelessNetworkAdapterKeys.all,
    importFile: importWirelessNetworkAdapters,
  });
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isWirelessNetworkAdapterFilterActive(params.filter);
  const { showOnlyCompatible, setShowOnlyCompatible, compatibilityIds } =
    useMotherboardOnlyCompatibility(Boolean(params.filter.motherboardId));

  function startEditing() {
    beginBulkEdit(items, rowSelection, setEditRows);
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      wirelessNetworkAdapterListSearchFromParams({
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
      wirelessNetworkAdapterListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: { ...params.filter, ...next },
      }),
    );
  }

  function clearFilters() {
    setShowOnlyCompatible(false);
    setDraft(emptyWirelessNetworkAdapterFilter);
    setSearchParams(
      wirelessNetworkAdapterListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyWirelessNetworkAdapterFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      wirelessNetworkAdapterListSearchFromParams({
        ...params,
        pageIndex: nextIndex,
      }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>{ui.nav("products.wirelessNetworkAdapters")}</h1>
      <p className="catalog-lead">{ui.message("browseCatalogLead")}</p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <CatalogFilterGroup>
            <CatalogCompatibleCheckbox
              checked={showOnlyCompatible}
              onCheckedChange={applyCompatibleFilter}
            />
            <CatalogNameField
              id="wireless-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="wireless-manufacturer"
              label={ui.label("manufacturer")}
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
              id="wireless-wifi"
              label={ui.label("wifi")}
              value={draft.wifiStandard}
              options={WIFI_STANDARDS}
              formatOption={formatWifiStandard}
              onChange={(wifiStandard) =>
                setDraft((current) => ({ ...current, wifiStandard }))
              }
            />
            <CatalogEnumField
              id="wireless-interface"
              label={ui.label("hostInterface")}
              value={draft.hostInterface}
              options={WIRELESS_HOST_INTERFACES}
              formatOption={enumText.wifiInterface}
              onChange={(hostInterface) =>
                setDraft((current) => ({ ...current, hostInterface }))
              }
            />
            <CatalogEnumField
              id="wireless-bluetooth"
              label={ui.label("bluetooth")}
              value={draft.bluetoothVersion}
              options={BLUETOOTH_VERSIONS}
              formatOption={formatBluetoothVersion}
              onChange={(bluetoothVersion) =>
                setDraft((current) => ({ ...current, bluetoothVersion }))
              }
            />
            <CatalogRangeField
              id="wireless-speed"
              label={ui.label("maxSpeedMbps")}
              maxAriaLabel={ui.label("maxSpeedMax")}
              range={draft.maxSpeedMbps}
              onChange={(maxSpeedMbps) =>
                setDraft((current) => ({ ...current, maxSpeedMbps }))
              }
            />
            <CatalogRangeField
              id="wireless-speed-5g"
              label={ui.label("maxSpeed5GhzMbps")}
              maxAriaLabel={ui.label("maxSpeed5Ghz")}
              range={draft.maxSpeedMbps5G}
              onChange={(maxSpeedMbps5G) =>
                setDraft((current) => ({ ...current, maxSpeedMbps5G }))
              }
            />
            <CatalogRangeField
              id="wireless-speed-6g"
              label={ui.label("maxSpeed6GhzMbps")}
              maxAriaLabel={ui.label("maxSpeed6Ghz")}
              range={draft.maxSpeedMbps6G}
              onChange={(maxSpeedMbps6G) =>
                setDraft((current) => ({ ...current, maxSpeedMbps6G }))
              }
            />
            <CatalogEnumField
              id="wireless-pcie-slot"
              label={ui.label("pcieSlot")}
              value={draft.pcieSlotType}
              options={PCIE_SLOT_TYPES}
              formatOption={enumText.pcieSlotType}
              onChange={(pcieSlotType) =>
                setDraft((current) => ({ ...current, pcieSlotType }))
              }
            />
            <CatalogEnumField
              id="wireless-m2-key"
              label={ui.label("m2Key")}
              value={draft.key}
              options={M2_KEYS}
              formatOption={enumText.m2Key}
              onChange={(key) => setDraft((current) => ({ ...current, key }))}
            />
            <CatalogEnumField
              id="wireless-m2-form"
              label={ui.label("m2FormFactor")}
              value={draft.m2FormFactor}
              options={M2_FORM_FACTORS}
              formatOption={formatM2FormFactor}
              onChange={(m2FormFactor) =>
                setDraft((current) => ({ ...current, m2FormFactor }))
              }
            />
            <CatalogEnumField
              id="wireless-usb-version"
              label={ui.label("usbVersion")}
              value={draft.usbVersion}
              options={USB_VERSIONS}
              formatOption={enumText.usbVersion}
              onChange={(usbVersion) =>
                setDraft((current) => ({ ...current, usbVersion }))
              }
            />
            <CatalogEnumField
              id="wireless-usb-type"
              label={ui.label("usbType")}
              value={draft.usbType}
              options={USB_TYPES}
              formatOption={enumText.usbType}
              onChange={(usbType) =>
                setDraft((current) => ({ ...current, usbType }))
              }
            />
          </CatalogFilterGroup>
          <CatalogFilterActions onClear={clearFilters} />
        </form>
        <CatalogListResults
          entity="wirelessNetworkAdapters"
          query={query}
          items={items}
          filtering={filtering}
          columns={columns}
          isAdmin={isAdmin}
          newItemLabel={ui.action("newWirelessNetworkAdapter")}
          onNewItem={() => setCreating(true)}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          bulkDelete={bulkDelete}
          onImport={excelImport.openImport}
          onEditSelected={startEditing}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={goToPage}
        />
      </div>
      {creating ? (
        <CatalogCreateDialog
          title={ui.dialog("newWirelessNetworkAdapter")}
          item={emptyAdapter}
          fields={WirelessNetworkAdapterFields(manufacturers)}
          queryKey={wirelessNetworkAdapterKeys.all}
          detailPath={(id) => `/catalog/wireless-network-adapters/${id}`}
          onClose={() => setCreating(false)}
          create={createWirelessNetworkAdapter}
        />
      ) : null}
      {editRows ? (
        <BulkEditDialog
          title={ui.dialog("editWirelessNetworkAdapters")}
          rows={editRows}
          columns={WirelessNetworkAdapterEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateWirelessNetworkAdapters(rows);
            await queryClient.invalidateQueries({
              queryKey: wirelessNetworkAdapterKeys.all,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
