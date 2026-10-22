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
import {enumText, ui} from "@/i18n/translate-enum";
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
        columnHelper.accessor("media", {
          header: ui.header("media"),
          cell: (info) => enumText.storageMedia(info.getValue()),
        }),
        columnHelper.accessor("interface", {
          header: ui.header("interface"),
          cell: (info) => enumText.storageInterface(info.getValue()),
        }),
        columnHelper.accessor("formFactor", {
          header: ui.header("formFactor"),
          cell: (info) => formatStorageFormFactor(info.getValue()),
        }),
        columnHelper.accessor("capacityGb", {
          header: ui.header("capacity"),
          cell: (info) => `${info.getValue()} ${ui.unit("gb")}`,
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
    singular: ui.label("nStorageDrive"),
    plural: ui.label("nStorageDrives"),
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
      <h1>{ui.nav("products.storage")}</h1>
      <p className="catalog-lead">{ui.message("browseCatalogLead")}</p>
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
              id="storage-media"
              label={ui.label("media")}
              value={draft.media}
              options={STORAGE_MEDIAS}
              formatOption={enumText.storageMedia}
              onChange={(media) =>
                setDraft((current) => ({ ...current, media }))
              }
            />
            <CatalogEnumField
              id="storage-interface"
              label={ui.label("interface")}
              value={draft.interface}
              options={STORAGE_INTERFACES}
              formatOption={enumText.storageInterface}
              onChange={(storageInterface) =>
                setDraft((current) => ({
                  ...current,
                  interface: storageInterface,
                }))
              }
            />
            <CatalogEnumField
              id="storage-form-factor"
              label={ui.label("formFactor")}
              value={draft.formFactor}
              options={STORAGE_FORM_FACTORS}
              formatOption={formatStorageFormFactor}
              onChange={(formFactor) =>
                setDraft((current) => ({ ...current, formFactor }))
              }
            />
            <Field>
              <FieldLabel htmlFor="storage-pcie">{ui.label("pcieGeneration")}</FieldLabel>
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
                <option value="">{ui.label("any")}</option>
                {PCIE_GENERATIONS.map((generation) => (
                  <option key={generation} value={generation}>
                    {enumText.pcieGeneration(generation)}
                  </option>
                ))}
              </select>
            </Field>
            <CatalogRangeField
              id="storage-capacity"
              label={ui.label("capacityGb")}
              maxAriaLabel={ui.label("capacityMax")}
              range={draft.capacityGb}
              onChange={(capacityGb) =>
                setDraft((current) => ({ ...current, capacityGb }))
              }
            />
            <CatalogRangeField
              id="storage-rpm"
              label={ui.label("rpm")}
              maxAriaLabel={ui.label("rpmMax")}
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
            loadingMessage={ui.empty("loading", { entity: ui.entity("storageDrives") })}
            emptyFilteredMessage={ui.empty("noMatchFilters", { entity: ui.entity("storageDrives") })}
            emptyMessage={ui.empty("noneInCatalog", { entity: ui.entity("storageDrives") })}
            isAdmin={isAdmin}
            newItemLabel={ui.action("newStorageDrive")}
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
          title={ui.dialog("newStorageDrive")}
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
          title={ui.dialog("editStorageDrives")}
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
