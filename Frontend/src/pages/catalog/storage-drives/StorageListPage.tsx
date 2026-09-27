import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogLeadColumns } from "@/components/catalog/catalog-lead-columns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import {
  enumSelectBulkColumn,
  idSelectBulkColumn,
  integerColumn,
  nameBulkColumn,
} from "@/components/bulk-edit-columns";
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
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importStorageDrives } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
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

const EMPTY_ITEMS: StorageDrive[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  StorageDrive
>();


function storageDriveEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<StorageDrive>[] {
  return [
    nameBulkColumn(),
    idSelectBulkColumn("Manufacturer", "manufacturerId", manufacturers),
    enumSelectBulkColumn("Media", "media", STORAGE_MEDIAS),
    enumSelectBulkColumn("Interface", "interface", STORAGE_INTERFACES),
    enumSelectBulkColumn("Form factor", "formFactor", STORAGE_FORM_FACTORS),
    integerColumn("Capacity (GB)", "capacityGb", { type: "number", min: 0 }),
    enumSelectBulkColumn("PCIe generation", "pcieGeneration", PCIE_GENERATIONS, {
      label: (generation) => generation.replace("Gen", "PCIe "),
    }),
    integerColumn("RPM", "rpm", { type: "number", fallback: undefined }),
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
