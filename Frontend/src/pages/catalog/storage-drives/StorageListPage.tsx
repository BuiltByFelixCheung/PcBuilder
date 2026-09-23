import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isStorageDriveFilterActive,
  type StorageDrive,
  type StorageDriveFilter,
} from "@/api/catalog/storage-drives";
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
import { useStorageDrives } from "@/hooks/use-storage-drives.ts";
import {
  emptyStorageDriveFilter,
  storageDriveListParamsFromSearch,
  storageDriveListSearchFromParams,
} from "@/api/catalog/params/storage-drive-list-params";
import { toOptionalNumber } from "@/api/helper";
import {
  PCIE_GENERATIONS,
  STORAGE_FORM_FACTORS,
  STORAGE_INTERFACES,
  STORAGE_MEDIAS,
  formatStorageFormFactor,
  type PcieGeneration,
  type StorageFormFactor,
  type StorageInterface,
  type StorageMedia,
} from "@/api/enums";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";
import {
  CatalogCompatibleCheckbox,
  CatalogRangeField,
} from "@/pages/catalog/catalog-filter-fields.tsx";
import { usePcBuild } from "@/builds/usePcBuild";

const EMPTY_ITEMS: StorageDrive[] = [];
const columnHelper = createColumnHelper<typeof dataTableFeatures, StorageDrive>();

export function StorageListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => storageDriveListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<StorageDriveFilter>(() => params.filter);
  const manufacturers = useCatalogManufacturers("storagedrive");
  const query = useStorageDrives(params);
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
        columnHelper.accessor("media", { header: "Media" }),
        columnHelper.accessor("interface", { header: "Interface" }),
        columnHelper.accessor("formFactor", {
          header: "Form factor",
          cell: (info) => formatStorageFormFactor(info.getValue()),
        }),
        columnHelper.accessor("capacityGb", {
          header: "Capacity",
          cell: (info) => `${info.getValue()} GB`,
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isStorageDriveFilterActive(params.filter);
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(params.filter.motherboardId || params.filter.chassisId),
  );

  function compatibilityIds(checked: boolean) {
    return {
      motherboardId: checked ? currentBuild.motherboardId : undefined,
      chassisId: checked ? currentBuild.chassisId : undefined,
    };
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      storageDriveListSearchFromParams({
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
      storageDriveListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: { ...params.filter, ...next },
      }),
    );
  }

  function clearFilters() {
    setShowOnlyCompatible(false);
    setDraft(emptyStorageDriveFilter);
    setSearchParams(
      storageDriveListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyStorageDriveFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      storageDriveListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>Storage</h1>
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
              <FieldLabel htmlFor="storage-name">Name</FieldLabel>
              <Input
                id="storage-name"
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
              <FieldLabel htmlFor="storage-manufacturer">Manufacturer</FieldLabel>
              <select
                id="storage-manufacturer"
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
              <FieldLabel htmlFor="storage-media">Media</FieldLabel>
              <select
                id="storage-media"
                className={catalogSelectClassName}
                value={draft.media ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    media: (event.target.value || undefined) as
                      | StorageMedia
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {STORAGE_MEDIAS.map((media) => (
                  <option key={media} value={media}>
                    {media}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="storage-interface">Interface</FieldLabel>
              <select
                id="storage-interface"
                className={catalogSelectClassName}
                value={draft.interface ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    interface: (event.target.value || undefined) as
                      | StorageInterface
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {STORAGE_INTERFACES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="storage-form-factor">Form factor</FieldLabel>
              <select
                id="storage-form-factor"
                className={catalogSelectClassName}
                value={draft.formFactor ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    formFactor: (event.target.value || undefined) as
                      | StorageFormFactor
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {STORAGE_FORM_FACTORS.map((formFactor) => (
                  <option key={formFactor} value={formFactor}>
                    {formatStorageFormFactor(formFactor)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="storage-pcie">PCIe generation</FieldLabel>
              <select
                id="storage-pcie"
                className={catalogSelectClassName}
                value={draft.pcieGeneration ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    pcieGeneration: (event.target.value || undefined) as
                      | PcieGeneration
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {PCIE_GENERATIONS.map((generation) => (
                  <option key={generation} value={generation}>
                    {generation.replace("Gen", "PCIe ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="storage-capacity-min">Capacity (GB)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="storage-capacity-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={draft.capacityGb?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      capacityGb: {
                        min: toOptionalNumber(event.target.value),
                        max: current.capacityGb?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="storage-capacity-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Capacity max"
                  value={draft.capacityGb?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      capacityGb: {
                        min: current.capacityGb?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <CatalogRangeField
              id="storage-rpm"
              label="RPM"
              maxAriaLabel="RPM max"
              range={draft.rpm}
              onChange={(rpm) => setDraft((current) => ({ ...current, rpm }))}
            />
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
      return <PageStatus>Loading storage…</PageStatus>;
    }
    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }
    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No storage drives match these filters."
            : "No storage drives in the catalog yet."}
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
            <Button>New Storage Drive</Button>
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
            Page {pageIndex + 1} of {pageCount} ({totalCount} drives)
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
  info: CellContext<typeof dataTableFeatures, StorageDrive, string>,
) {
  return (
    <Link to={`/catalog/storage/${info.row.original.id}`}>
      {info.getValue()}
    </Link>
  );
}
