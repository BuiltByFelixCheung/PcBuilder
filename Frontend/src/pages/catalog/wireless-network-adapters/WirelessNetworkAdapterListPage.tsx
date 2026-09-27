import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteWirelessNetworkAdapters } from "@/api/catalog/bulk-delete";
import {
  wirelessNetworkAdapterKeys,
  isWirelessNetworkAdapterFilterActive,
  updateWirelessNetworkAdapters,
  type WirelessNetworkAdapter,
  type WirelessNetworkAdapterFilter,
} from "@/api/catalog/wireless-network-adapters";
import { FieldGroup } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
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
  type BluetoothVersion,
  type M2FormFactor,
  type M2Key,
  type PcieSlotType,
  type UsbVersion,
  type WifiStandard,
  type WirelessHostInterface,
} from "@/api/enums";
import {
  CatalogCompatibleCheckbox,
  CatalogRangeField,
} from "@/components/catalog/CatalogFilterFields.tsx";
import { usePcBuild } from "@/builds/use-pc-build";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importWirelessNetworkAdapters } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import { catalogNameCell } from "@/components/catalog/CatalogNameCell";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogEnumField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import { BulkEditDialog, type BulkEditColumn } from "@/components/BulkEditDialog";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { formSelectClassName } from "@/components/filters/ListFilters";
import { toInteger } from "@/api/helper";

const EMPTY_ITEMS: WirelessNetworkAdapter[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  WirelessNetworkAdapter
>();

function bulkEditColumns(
  manufacturers: {id: string, name: string}[],
): BulkEditColumn<WirelessNetworkAdapter>[] {
  return [
    {
      header: "Name",
      cell: (row, update) => (
        <Input
          aria-label={`Name for ${row.name}`}
          value={row.name}
          onChange={(event) => update({ ...row, name: event.target.value })}
        />
      ),
    },
    {
      header: "Manufacturer",
      cell: (row, update) => (
        <select
          aria-label={`Manufacturer for ${row.name}`}
          className={formSelectClassName}
          value={row.manufacturerId}
          onChange={(event) => update({ ...row, manufacturerId: event.target.value })}
        >
          {manufacturers.map((manufacturer) => (
            <option key={manufacturer.id} value={manufacturer.id}>
              {manufacturer.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Wi-Fi",
      cell: (row, update) => (
        <select
          aria-label={`Wi-Fi for ${row.name}`}
          className={formSelectClassName}
          value={row.wifiStandard}
          onChange={(event) => update({ ...row, wifiStandard: event.target.value as WifiStandard })}
        >
          {WIFI_STANDARDS.map((wifiStandard) => (
            <option key={wifiStandard} value={wifiStandard}>
              {wifiStandard}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Host interface",
      cell: (row, update) => (
        <select
          aria-label={`Host interface for ${row.name}`}
          className={formSelectClassName}
          value={row.hostInterface}
          onChange={(event) => update({ ...row, hostInterface: event.target.value as WirelessHostInterface })}
        >
          {WIRELESS_HOST_INTERFACES.map((hostInterface) => (
            <option key={hostInterface} value={hostInterface}>
              {hostInterface}
            </option>
          ))}
          </select>
      ),
    },
    {
      header: "Bluetooth",
      cell: (row, update) => (
        <select
          aria-label={`Bluetooth for ${row.name}`}
          className={formSelectClassName}
          value={row.bluetoothVersion ?? ""}
          onChange={(event) =>
            update({
              ...row,
              bluetoothVersion: event.target.value
                ? (event.target.value as BluetoothVersion)
                : null,
            })
          }
        >
          <option value=""></option>
          {BLUETOOTH_VERSIONS.map((bluetoothVersion) => (
            <option key={bluetoothVersion} value={bluetoothVersion}>
              {bluetoothVersion}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Max speed (Mbps)",
      cell: (row, update) => (
        <Input
          aria-label={`Max speed (Mbps) for ${row.name}`}
          value={row.maxSpeedMbps}
          onChange={(event) => update({ ...row, maxSpeedMbps: toInteger(event.target.value) ?? 0 })}
        />
      ),
    },
    {
      header: "5 GHz max speed (Mbps)",
      cell: (row, update) => (
        <Input
          aria-label={`5 GHz max speed (Mbps) for ${row.name}`}
          value={row.maxSpeedMbps5G ?? ""}
          onChange={(event) =>
            update({
              ...row,
              maxSpeedMbps5G: toInteger(event.target.value) ?? null,
            })
          }
        />
      ),
    },
    {
      header: "6 GHz max speed (Mbps)",
      cell: (row, update) => (
        <Input
          aria-label={`6 GHz max speed (Mbps) for ${row.name}`}
          value={row.maxSpeedMbps6G ?? ""}
          onChange={(event) =>
            update({
              ...row,
              maxSpeedMbps6G: toInteger(event.target.value) ?? null,
            })
          }
        />
      ),
    },
    {
      header: "PCIe slot",
      cell: (row, update) => (
        <select
          aria-label={`PCIe slot for ${row.name}`}
          className={formSelectClassName}
          value={row.pcieSlotType ?? ""}
          onChange={(event) => update({ ...row, pcieSlotType: event.target.value as PcieSlotType })}
        >
          <option value=""></option>
          {PCIE_SLOT_TYPES.map((pcieSlotType) => (
            <option key={pcieSlotType} value={pcieSlotType}>
              {pcieSlotType}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "M.2 key",
      cell: (row, update) => (
        <select
          aria-label={`M.2 key for ${row.name}`}
          className={formSelectClassName}
          value={row.key ?? ""}
          onChange={(event) => update({ ...row, key: event.target.value as M2Key })}
        >
          <option value=""></option>
          {M2_KEYS.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "M.2 form factor",
      cell: (row, update) => (
        <select
          aria-label={`M.2 form factor for ${row.name}`}
          className={formSelectClassName}
          value={row.m2FormFactor ?? ""}
          onChange={(event) => update({ ...row, m2FormFactor: event.target.value as M2FormFactor })}
        >
          <option value=""></option>
          {M2_FORM_FACTORS.map((m2FormFactor) => (
            <option key={m2FormFactor} value={m2FormFactor}>
              {m2FormFactor}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "USB version",
      cell: (row, update) => (
        <select
          aria-label={`USB version for ${row.name}`}
          className={formSelectClassName}
          value={row.usbVersion ?? ""}
          onChange={(event) => update({ ...row, usbVersion: event.target.value as UsbVersion })}
        >
          <option value=""></option>
          {USB_VERSIONS.map((usbVersion) => (
            <option key={usbVersion} value={usbVersion}>
              {usbVersion}
            </option>
          ))}
        </select>
      ),
    }
  ];
}
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
  const [editRows, setEditRows] = useState<WirelessNetworkAdapter[]|null>(null);
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...(isAdmin ? [createSelectionColumn(columnHelper)] : []),
        columnHelper.accessor("name", {
          header: "Name",
          cell: (info) =>
            catalogNameCell(
              `/catalog/wireless-network-adapters/${info.row.original.id}`,
              info.getValue(),
            ),
        }),
        columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
        columnHelper.accessor("wifiStandard", {
          header: "Wi-Fi",
          cell: (info) => formatWifiStandard(info.getValue()),
        }),
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
    queryKey: wirelessNetworkAdapterKeys.all,
    singular: "wireless network adapter",
    plural: "wireless network adapters",
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
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(params.filter.motherboardId),
  );

  function compatibilityIds(checked: boolean) {
    return {
      motherboardId: checked ? currentBuild.motherboardId : undefined,
    };
  }

  function startEditing() {
    const selected = items.filter((item) => rowSelection[item.id]);
    if (selected.length === 0) return;
    setEditRows(selected);
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
      <h1>Wireless Network Adapters</h1>
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
              id="wireless-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="wireless-manufacturer"
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
              id="wireless-wifi"
              label="Wi-Fi"
              value={draft.wifiStandard}
              options={WIFI_STANDARDS}
              formatOption={formatWifiStandard}
              onChange={(wifiStandard) =>
                setDraft((current) => ({ ...current, wifiStandard }))
              }
            />
            <CatalogEnumField
              id="wireless-interface"
              label="Host interface"
              value={draft.hostInterface}
              options={WIRELESS_HOST_INTERFACES}
              onChange={(hostInterface) =>
                setDraft((current) => ({ ...current, hostInterface }))
              }
            />
            <CatalogEnumField
              id="wireless-bluetooth"
              label="Bluetooth"
              value={draft.bluetoothVersion}
              options={BLUETOOTH_VERSIONS}
              formatOption={formatBluetoothVersion}
              onChange={(bluetoothVersion) =>
                setDraft((current) => ({ ...current, bluetoothVersion }))
              }
            />
            <CatalogRangeField
              id="wireless-speed"
              label="Max speed (Mbps)"
              maxAriaLabel="Max speed max"
              range={draft.maxSpeedMbps}
              onChange={(maxSpeedMbps) =>
                setDraft((current) => ({ ...current, maxSpeedMbps }))
              }
            />
            <CatalogRangeField
              id="wireless-speed-5g"
              label="5 GHz max speed (Mbps)"
              maxAriaLabel="5 GHz max speed max"
              range={draft.maxSpeedMbps5G}
              onChange={(maxSpeedMbps5G) =>
                setDraft((current) => ({ ...current, maxSpeedMbps5G }))
              }
            />
            <CatalogRangeField
              id="wireless-speed-6g"
              label="6 GHz max speed (Mbps)"
              maxAriaLabel="6 GHz max speed max"
              range={draft.maxSpeedMbps6G}
              onChange={(maxSpeedMbps6G) =>
                setDraft((current) => ({ ...current, maxSpeedMbps6G }))
              }
            />
            <CatalogEnumField
              id="wireless-pcie-slot"
              label="PCIe slot"
              value={draft.pcieSlotType}
              options={PCIE_SLOT_TYPES}
              onChange={(pcieSlotType) =>
                setDraft((current) => ({ ...current, pcieSlotType }))
              }
            />
            <CatalogEnumField
              id="wireless-m2-key"
              label="M.2 key"
              value={draft.key}
              options={M2_KEYS}
              onChange={(key) => setDraft((current) => ({ ...current, key }))}
            />
            <CatalogEnumField
              id="wireless-m2-form"
              label="M.2 form factor"
              value={draft.m2FormFactor}
              options={M2_FORM_FACTORS}
              formatOption={formatM2FormFactor}
              onChange={(m2FormFactor) =>
                setDraft((current) => ({ ...current, m2FormFactor }))
              }
            />
            <CatalogEnumField
              id="wireless-usb-version"
              label="USB version"
              value={draft.usbVersion}
              options={USB_VERSIONS}
              onChange={(usbVersion) =>
                setDraft((current) => ({ ...current, usbVersion }))
              }
            />
            <CatalogEnumField
              id="wireless-usb-type"
              label="USB type"
              value={draft.usbType}
              options={USB_TYPES}
              onChange={(usbType) =>
                setDraft((current) => ({ ...current, usbType }))
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
            loadingMessage="Loading wireless network adapters…"
            emptyFilteredMessage="No wireless network adapters match these filters."
            emptyMessage="No wireless network adapters in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Wireless Network Adapter"
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
            totalCount={totalCount}
            countLabel="adapters"
            onPageChange={goToPage}
          />
        </div>
      </div>
      {editRows ? (
        <BulkEditDialog
          title="Edit Wireless Network Adapters"
          rows={editRows}
          columns={bulkEditColumns(manufacturers)}
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
