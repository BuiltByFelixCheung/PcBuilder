import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isWiredNetworkAdapterFilterActive,
  type WiredNetworkAdapter,
  type WiredNetworkAdapterFilter,
} from "@/api/catalog/wired-network-adapters";
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
import { useWiredNetworkAdapters } from "@/hooks/use-wired-network-adapters.ts";
import {
  emptyWiredNetworkAdapterFilter,
  wiredNetworkAdapterListParamsFromSearch,
  wiredNetworkAdapterListSearchFromParams,
} from "@/api/catalog/params/wired-network-adapter-list-params";
import { toOptionalNumber } from "@/api/helper";
import {
  PCIE_SLOT_TYPES,
  USB_TYPES,
  USB_VERSIONS,
  WIRED_HOST_INTERFACES,
  type PcieSlotType,
  type UsbType,
  type UsbVersion,
  type WiredHostInterface,
} from "@/api/enums";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";
import { CatalogCompatibleCheckbox } from "@/pages/catalog/catalog-filter-fields.tsx";
import { usePcBuild } from "@/builds/usePcBuild";

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
            <Field>
              <FieldLabel htmlFor="wired-name">Name</FieldLabel>
              <Input
                id="wired-name"
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
              <FieldLabel htmlFor="wired-manufacturer">Manufacturer</FieldLabel>
              <select
                id="wired-manufacturer"
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
              <FieldLabel htmlFor="wired-interface">Host interface</FieldLabel>
              <select
                id="wired-interface"
                className={catalogSelectClassName}
                value={draft.hostInterface ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    hostInterface: (event.target.value || undefined) as
                      | WiredHostInterface
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {WIRED_HOST_INTERFACES.map((hostInterface) => (
                  <option key={hostInterface} value={hostInterface}>
                    {hostInterface}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="wired-speed-min">Max speed (Mbps)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="wired-speed-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={draft.maxSpeedMbps?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxSpeedMbps: {
                        min: toOptionalNumber(event.target.value),
                        max: current.maxSpeedMbps?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="wired-speed-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Max speed max"
                  value={draft.maxSpeedMbps?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxSpeedMbps: {
                        min: current.maxSpeedMbps?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="wired-usb-version">USB version</FieldLabel>
              <select
                id="wired-usb-version"
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
              <FieldLabel htmlFor="wired-usb-type">USB type</FieldLabel>
              <select
                id="wired-usb-type"
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
            <Field>
              <FieldLabel htmlFor="wired-pcie-slot">PCIe slot</FieldLabel>
              <select
                id="wired-pcie-slot"
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
      return <PageStatus>Loading wired network adapters…</PageStatus>;
    }
    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }
    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No wired network adapters match these filters."
            : "No wired network adapters in the catalog yet."}
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
            <Button>New Wired Network Adapter</Button>
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
  info: CellContext<typeof dataTableFeatures, WiredNetworkAdapter, string>,
) {
  return (
    <Link to={`/catalog/wired-network-adapters/${info.row.original.id}`}>
      {info.getValue()}
    </Link>
  );
}
