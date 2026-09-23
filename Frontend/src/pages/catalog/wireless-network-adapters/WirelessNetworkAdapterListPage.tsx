import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isWirelessNetworkAdapterFilterActive,
  type WirelessNetworkAdapter,
  type WirelessNetworkAdapterFilter,
} from "@/api/catalog/wireless-network-adapters";
import { PageStatus } from "@/components/PageStatus.tsx";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type CellContext,
  type RowSelectionState,
} from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useAuth } from "@/auth/useAuth";
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
  type UsbType,
  type UsbVersion,
  type WifiStandard,
  type WirelessHostInterface,
} from "@/api/enums";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";
import {
  CatalogCompatibleCheckbox,
  CatalogRangeField,
} from "@/pages/catalog/catalog-filter-fields.tsx";
import { usePcBuild } from "@/builds/usePcBuild";

const EMPTY_ITEMS: WirelessNetworkAdapter[] = [];
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
            <Field>
              <FieldLabel htmlFor="wireless-name">Name</FieldLabel>
              <Input
                id="wireless-name"
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
              <FieldLabel htmlFor="wireless-manufacturer">
                Manufacturer
              </FieldLabel>
              <select
                id="wireless-manufacturer"
                className={catalogSelectClassName}
                value={draft.manufacturerId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    manufacturerId: event.target.value || undefined,
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
              <FieldLabel htmlFor="wireless-wifi">Wi-Fi</FieldLabel>
              <select
                id="wireless-wifi"
                className={catalogSelectClassName}
                value={draft.wifiStandard ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    wifiStandard: (event.target.value || undefined) as
                      | WifiStandard
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {WIFI_STANDARDS.map((standard) => (
                  <option key={standard} value={standard}>
                    {formatWifiStandard(standard)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="wireless-interface">Host interface</FieldLabel>
              <select
                id="wireless-interface"
                className={catalogSelectClassName}
                value={draft.hostInterface ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    hostInterface: (event.target.value || undefined) as
                      | WirelessHostInterface
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {WIRELESS_HOST_INTERFACES.map((hostInterface) => (
                  <option key={hostInterface} value={hostInterface}>
                    {hostInterface}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="wireless-bluetooth">Bluetooth</FieldLabel>
              <select
                id="wireless-bluetooth"
                className={catalogSelectClassName}
                value={draft.bluetoothVersion ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    bluetoothVersion: (event.target.value || undefined) as
                      | BluetoothVersion
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {BLUETOOTH_VERSIONS.map((version) => (
                  <option key={version} value={version}>
                    {formatBluetoothVersion(version)}
                  </option>
                ))}
              </select>
            </Field>
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
            <Field>
              <FieldLabel htmlFor="wireless-pcie-slot">PCIe slot</FieldLabel>
              <select
                id="wireless-pcie-slot"
                className={catalogSelectClassName}
                value={draft.pcieSlotType ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    pcieSlotType: (event.target.value || undefined) as
                      | PcieSlotType
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {PCIE_SLOT_TYPES.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="wireless-m2-key">M.2 key</FieldLabel>
              <select
                id="wireless-m2-key"
                className={catalogSelectClassName}
                value={draft.key ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    key: (event.target.value || undefined) as M2Key | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {M2_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="wireless-m2-form">M.2 form factor</FieldLabel>
              <select
                id="wireless-m2-form"
                className={catalogSelectClassName}
                value={draft.m2FormFactor ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    m2FormFactor: (event.target.value || undefined) as
                      | M2FormFactor
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {M2_FORM_FACTORS.map((formFactor) => (
                  <option key={formFactor} value={formFactor}>
                    {formatM2FormFactor(formFactor)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="wireless-usb-version">USB version</FieldLabel>
              <select
                id="wireless-usb-version"
                className={catalogSelectClassName}
                value={draft.usbVersion ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    usbVersion: (event.target.value || undefined) as
                      | UsbVersion
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {USB_VERSIONS.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="wireless-usb-type">USB type</FieldLabel>
              <select
                id="wireless-usb-type"
                className={catalogSelectClassName}
                value={draft.usbType ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    usbType: (event.target.value || undefined) as
                      | UsbType
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {USB_TYPES.map((usbType) => (
                  <option key={usbType} value={usbType}>
                    {usbType}
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
    </section>
  );

  function renderCatalog(): ReactNode {
    if (query.isPending && !query.data) {
      return <PageStatus>Loading wireless network adapters…</PageStatus>;
    }
    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }
    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No wireless network adapters match these filters."
            : "No wireless network adapters in the catalog yet."}
        </PageStatus>
      );
    }

    return (
      <>
        {isAdmin && (
          <div className="catalog-results-actions">
            <Button disabled={!Object.values(rowSelection).some(Boolean)}>
              Edit Selected
            </Button>
            <Button disabled={!Object.values(rowSelection).some(Boolean)}>
              Delete Selected
            </Button>
            <Button>New Wireless Network Adapter</Button>
            <Button>Import</Button>
          </div>
        )}
        <DataTable
          data={items}
          columns={columns}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
        <div className="catalog-pagination">
          <p>
            Page {pageIndex + 1} of {pageCount} ({totalCount} adapters)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pageIndex === 0}
              onClick={() => goToPage(pageIndex - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pageIndex + 1 >= pageCount}
              onClick={() => goToPage(pageIndex + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </>
    );
  }
}

function nameCell(
  info: CellContext<typeof dataTableFeatures, WirelessNetworkAdapter, string>,
) {
  return (
    <Link to={`/catalog/wireless-network-adapters/${info.row.original.id}`}>
      {info.getValue()}
    </Link>
  );
}
