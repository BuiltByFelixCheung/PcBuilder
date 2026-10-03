import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogLeadColumns } from "@/components/catalog/CatalogLeadColumns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import { deleteStorageDrives } from "@/api/catalog/bulk-delete";
import {
  createStorageDrive,
  storageDriveKeys,
  isStorageDriveFilterActive,
  type StorageDrive,
  type StorageDriveFilter,
  updateStorageDrives,
} from "@/api/catalog/storage-drives";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
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
} from "@/api/enums";
import { formSelectClassName } from "@/components/filters/ListFilters";
import {
  CatalogCompatibleCheckbox,
  CatalogRangeField,
} from "@/components/catalog/CatalogFilterFields.tsx";
import { usePcBuild } from "@/builds/use-pc-build";
import { unsetCatalogItem } from "@/components/catalog/catalog-create";
import { CatalogCreateDialog } from "@/components/catalog/CatalogCreateDialog";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importStorageDrives } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogFilterActions,
  CatalogFilterGroup,
  CatalogNameField,
  CatalogEnumField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import {
  StorageEditColumns,
  StorageFields,
} from "@/pages/catalog/storage-drives/StorageEditColumns";
import { useQueryClient } from "@tanstack/react-query";

const EMPTY_ITEMS: StorageDrive[] = [];
const emptyDrive = unsetCatalogItem<StorageDrive>({
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  media: "",
  interface: "",
  formFactor: "",
  capacityGb: 0,
  pcieGeneration: null,
  rpm: null,
  isM2: false,
  moduleKey: null,
  m2FormFactor: null,
});
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  StorageDrive
>();

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
  const [creating, setCreating] = useState(false);
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/storage/${id}`,
        ),
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
    beginBulkEdit(items, rowSelection, setEditRows);
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
          <CatalogFilterGroup>
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
            loadingMessage="Loading storage…"
            emptyFilteredMessage="No storage drives match these filters."
            emptyMessage="No storage drives in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Storage Drive"
            onNewItem={() => setCreating(true)}
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
            onPageChange={goToPage}
          />
        </div>
      </div>
      {creating ? (
        <CatalogCreateDialog
          title="New storage drive"
          item={emptyDrive}
          fields={StorageFields(manufacturers)}
          queryKey={storageDriveKeys.all}
          detailPath={(id) => `/catalog/storage/${id}`}
          onClose={() => setCreating(false)}
          create={createStorageDrive}
        />
      ) : null}
      {editRows ? (
        <BulkEditDialog
          title="Edit Storage Drives"
          rows={editRows}
          columns={StorageEditColumns(manufacturers)}
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
