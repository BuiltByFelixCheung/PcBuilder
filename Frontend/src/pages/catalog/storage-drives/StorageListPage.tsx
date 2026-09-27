import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteStorageDrives } from "@/api/catalog/bulk-delete";
import {
  storageDriveKeys,
  isStorageDriveFilterActive,
  type StorageDrive,
  type StorageDriveFilter,
  updateStorageDrives,
} from "@/api/catalog/storage-drives";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useAuth } from "@/auth/use-auth";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { useStorageDrives } from "@/hooks/use-storage-drives.ts";
import {
  emptyStorageDriveFilter,
  storageDriveListParamsFromSearch,
  storageDriveListSearchFromParams,
} from "@/api/catalog/params/storage-drive-list-params";
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
import { formSelectClassName } from "@/components/filters/ListFilters";
import {
  CatalogCompatibleCheckbox,
  CatalogRangeField,
} from "@/components/catalog/CatalogFilterFields.tsx";
import { usePcBuild } from "@/builds/use-pc-build";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importStorageDrives } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import { catalogNameCell } from "@/components/catalog/CatalogNameCell";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogEnumField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import {
  BulkEditDialog,
  type BulkEditColumn,
} from "@/components/BulkEditDialog";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { toInteger } from "@/api/helper";

const EMPTY_ITEMS: StorageDrive[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  StorageDrive
>();

function storageDriveEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<StorageDrive>[] {
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
          onChange={(event) =>
            update({ ...row, manufacturerId: event.target.value })
          }
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
      header: "Media",
      cell: (row, update) => (
        <select
          aria-label={`Media for ${row.name}`}
          className={formSelectClassName}
          value={row.media}
          onChange={(event) =>
            update({ ...row, media: event.target.value as StorageMedia })
          }
        >
          {STORAGE_MEDIAS.map((media) => (
            <option key={media} value={media}>
              {media}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Interface",
      cell: (row, update) => (
        <select
          aria-label={`Interface for ${row.name}`}
          className={formSelectClassName}
          value={row.interface}
          onChange={(event) =>
            update({
              ...row,
              interface: event.target.value as StorageInterface,
            })
          }
        >
          {STORAGE_INTERFACES.map((storageInterface) => (
            <option key={storageInterface} value={storageInterface}>
              {storageInterface}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Form factor",
      cell: (row, update) => (
        <select
          aria-label={`Form factor for ${row.name}`}
          className={formSelectClassName}
          value={row.formFactor}
          onChange={(event) =>
            update({
              ...row,
              formFactor: event.target.value as StorageFormFactor,
            })
          }
        >
          {STORAGE_FORM_FACTORS.map((formFactor) => (
            <option key={formFactor} value={formFactor}>
              {formFactor}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Capacity (GB)",
      cell: (row, update) => (
        <Input
          aria-label={`Capacity (GB) for ${row.name}`}
          type="number"
          min={0}
          value={row.capacityGb}
          onChange={(event) =>
            update({ ...row, capacityGb: toInteger(event.target.value) ?? 0 })
          }
        />
      ),
    },
    {
      header: "PCIe generation",
      cell: (row, update) => (
        <select
          aria-label={`PCIe generation for ${row.name}`}
          className={formSelectClassName}
          value={row.pcieGeneration ?? ""}
          onChange={(event) =>
            update({
              ...row,
              pcieGeneration: event.target.value as PcieGeneration,
            })
          }
        >
          {PCIE_GENERATIONS.map((generation) => (
            <option key={generation} value={generation}>
              {generation.replace("Gen", "PCIe ")}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "RPM",
      cell: (row, update) => (
        <Input
          aria-label={`RPM for ${row.name}`}
          type="number"
          value={row.rpm ?? ""}
          onChange={(event) =>
            update({ ...row, rpm: toInteger(event.target.value) ?? undefined })
          }
        />
      ),
    },
  ];
}
export function StorageListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => storageDriveListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<StorageDriveFilter>(() => params.filter);
  const manufacturers = useCatalogManufacturers("storagedrive");
  const query = useStorageDrives(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editRows, setEditRows] = useState<StorageDrive[] | null>(null);
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...(isAdmin ? [createSelectionColumn(columnHelper)] : []),
        columnHelper.accessor("name", {
          header: "Name",
          cell: (info) =>
            catalogNameCell(
              `/catalog/storage/${info.row.original.id}`,
              info.getValue(),
            ),
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
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: storageDriveKeys.all,
    singular: "storage drive",
    plural: "storage drives",
    deleteByIds: (ids) => deleteStorageDrives({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: storageDriveKeys.all,
    importFile: importStorageDrives,
  });
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

  function startEditing() {
    const selected = items.filter((item) => rowSelection[item.id]);
    if (selected.length === 0) return;
    setEditRows(selected);
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
            <CatalogNameField
              id="storage-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="storage-manufacturer"
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
              id="storage-media"
              label="Media"
              value={draft.media}
              options={STORAGE_MEDIAS}
              onChange={(media) =>
                setDraft((current) => ({ ...current, media }))
              }
            />
            <CatalogEnumField
              id="storage-interface"
              label="Interface"
              value={draft.interface}
              options={STORAGE_INTERFACES}
              onChange={(storageInterface) =>
                setDraft((current) => ({
                  ...current,
                  interface: storageInterface,
                }))
              }
            />
            <CatalogEnumField
              id="storage-form-factor"
              label="Form factor"
              value={draft.formFactor}
              options={STORAGE_FORM_FACTORS}
              formatOption={formatStorageFormFactor}
              onChange={(formFactor) =>
                setDraft((current) => ({ ...current, formFactor }))
              }
            />
            <Field>
              <FieldLabel htmlFor="storage-pcie">PCIe generation</FieldLabel>
              <select
                id="storage-pcie"
                className={formSelectClassName}
                value={draft.pcieGeneration ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    pcieGeneration: (event.target.value || undefined) as
                      PcieGeneration | undefined,
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
            <CatalogRangeField
              id="storage-capacity"
              label="Capacity (GB)"
              maxAriaLabel="Capacity max"
              range={draft.capacityGb}
              onChange={(capacityGb) =>
                setDraft((current) => ({ ...current, capacityGb }))
              }
            />
            <CatalogRangeField
              id="storage-rpm"
              label="RPM"
              maxAriaLabel="RPM max"
              range={draft.rpm}
              onChange={(rpm) => setDraft((current) => ({ ...current, rpm }))}
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
            loadingMessage="Loading storage…"
            emptyFilteredMessage="No storage drives match these filters."
            emptyMessage="No storage drives in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Storage Drive"
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onImport={excelImport.openImport}
            onEditSelected={startEditing}
            pageIndex={pageIndex}
            pageCount={pageCount}
            totalCount={totalCount}
            countLabel="drives"
            onPageChange={goToPage}
          />
        </div>
      </div>
      {editRows ? (
        <BulkEditDialog
          title="Edit Storage Drives"
          rows={editRows}
          columns={storageDriveEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateStorageDrives(rows);
            await queryClient.invalidateQueries({
              queryKey: storageDriveKeys.all,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
