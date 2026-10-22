import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogLeadColumns } from "@/components/catalog/CatalogLeadColumns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import { deleteChassisFans } from "@/api/catalog/bulk-delete";
import {
  chassisFanKeys,
  createChassisFan,
  isChassisFanFilterActive,
  updateChassisFans,
  type ChassisFan,
  type ChassisFanFilter,
} from "@/api/catalog/chassis-fans";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { useChassisFans } from "@/hooks/use-chassis-fans.ts";
import {
  chassisFanListParamsFromSearch,
  chassisFanListSearchFromParams,
  emptyChassisFanFilter,
} from "@/api/catalog/params/chassis-fan-list-params";
import { toInteger } from "@/api/helper";
import {
  FAN_DIAMETERS_MM,
  FAN_HEADER_TYPES,
  formatFanDiameterMm,
  formatFanHeaderType,
} from "@/api/enums";
import { usePcBuild } from "@/builds/use-pc-build";
import { useAuth } from "@/auth/use-auth";
import { unsetCatalogItem } from "@/components/catalog/catalog-create";
import { CatalogCreateDialog } from "@/components/catalog/CatalogCreateDialog";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importChassisFans } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogCompatibleCheckbox,
  CatalogFilterActions,
  CatalogFilterGroup,
  CatalogNameField,
  CatalogEnumField,
  CatalogIdSelectField,
  CatalogOptionalBooleanField,
} from "@/components/catalog/CatalogFilterFields";
import { useQueryClient } from "@tanstack/react-query";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import { ui } from "@/i18n/translate-enum";
import {
  ChassisFanEditColumns,
  ChassisFanFields,
} from "@/pages/catalog/chassis-fans/ChassisFanEditColumns";

const EMPTY_ITEMS: ChassisFan[] = [];
const columnHelper = createColumnHelper<typeof dataTableFeatures, ChassisFan>();
const emptyFan = unsetCatalogItem<ChassisFan>({
  id: "",
  name: "",
  manufacturerId: "",
  manufacturerName: "",
  diameterMm: "",
  fansCountPerPack: 0,
  thicknessMm: 0,
  headerType: "",
  supportsDaisyChain: false,
  maxFansPerDaisyChain: null,
});

export function ChassisFanListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => chassisFanListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<ChassisFanFilter>(() => params.filter);
  const manufacturers = useCatalogManufacturers("chassisfan");
  const query = useChassisFans(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const items = query.data?.items ?? EMPTY_ITEMS;
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: chassisFanKeys.all,
    singular: ui.label("nChassisFan"),
    plural: ui.label("nChassisFans"),
    deleteByIds: (ids) => deleteChassisFans({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: chassisFanKeys.all,
    importFile: importChassisFans,
  });
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isChassisFanFilterActive(params.filter);
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(params.filter.chassisId),
  );
  const [editRows, setEditRows] = useState<ChassisFan[] | null>(null);
  const [creating, setCreating] = useState(false);
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/chassis-fans/${id}`,
        ),
        columnHelper.accessor("diameterMm", {
          header: ui.header("diameter"),
          cell: (info) => formatFanDiameterMm(info.getValue()),
        }),
        columnHelper.accessor("fansCountPerPack", { header: ui.header("packSize") }),
        columnHelper.accessor("thicknessMm", { header: ui.header("thicknessMm") }),
        columnHelper.accessor("headerType", {
          header: ui.header("header"),
          cell: (info) => formatFanHeaderType(info.getValue()),
        }),
        columnHelper.accessor("supportsDaisyChain", {
          header: ui.header("daisyChain"),
          cell: (info) => (info.getValue() ? ui.label("yes") : ui.label("no")),
        }),
      ]),
    [isAdmin],
  );

  function compatibilityIds(checked: boolean) {
    return { chassisId: checked ? currentBuild.chassisId : undefined };
  }

  function startEditing() {
    beginBulkEdit(items, rowSelection, setEditRows);
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      chassisFanListSearchFromParams({
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
      chassisFanListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: { ...params.filter, ...next },
      }),
    );
  }

  function clearFilters() {
    setShowOnlyCompatible(false);
    setDraft(emptyChassisFanFilter);
    setSearchParams(
      chassisFanListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyChassisFanFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      chassisFanListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>{ui.nav("products.chassisFans")}</h1>
      <p className="catalog-lead">{ui.message("browseCatalogLead")}</p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <CatalogFilterGroup>
            <CatalogCompatibleCheckbox
              checked={showOnlyCompatible}
              onCheckedChange={applyCompatibleFilter}
            />
            <CatalogNameField
              id="fan-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="fan-manufacturer"
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
              id="fan-diameter"
              label={ui.label("diameter")}
              value={draft.diameterMm}
              options={FAN_DIAMETERS_MM}
              formatOption={formatFanDiameterMm}
              onChange={(diameterMm) =>
                setDraft((current) => ({ ...current, diameterMm }))
              }
            />
            <Field>
              <FieldLabel htmlFor="fan-pack">{ui.label("fansPerPack")}</FieldLabel>
              <Input
                id="fan-pack"
                type="number"
                min={0}
                value={draft.fansCountPerPack ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    fansCountPerPack: toInteger(event.target.value),
                  }))
                }
              />
            </Field>
            <CatalogEnumField
              id="fan-header"
              label={ui.label("header")}
              value={draft.headerType}
              options={FAN_HEADER_TYPES}
              formatOption={formatFanHeaderType}
              onChange={(headerType) =>
                setDraft((current) => ({ ...current, headerType }))
              }
            />
            <CatalogOptionalBooleanField
              id="fan-daisy-chain"
              label={ui.label("daisyChain")}
              value={draft.supportsDaisyChain}
              onChange={(supportsDaisyChain) =>
                setDraft((current) => ({ ...current, supportsDaisyChain }))
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
            loadingMessage={ui.empty("loading", { entity: ui.entity("chassisFans") })}
            emptyFilteredMessage={ui.empty("noMatchFilters", { entity: ui.entity("chassisFans") })}
            emptyMessage={ui.empty("noneInCatalog", { entity: ui.entity("chassisFans") })}
            isAdmin={isAdmin}
            newItemLabel={ui.action("newChassisFan")}
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
          title={ui.dialog("newChassisFan")}
          item={emptyFan}
          fields={ChassisFanFields(manufacturers)}
          queryKey={chassisFanKeys.all}
          detailPath={(id) => `/catalog/chassis-fans/${id}`}
          onClose={() => setCreating(false)}
          create={createChassisFan}
        />
      ) : null}
      {editRows ? (
        <BulkEditDialog
          title={ui.dialog("editChassisFans")}
          rows={editRows}
          columns={ChassisFanEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateChassisFans(rows);
            await queryClient.invalidateQueries({
              queryKey: chassisFanKeys.all,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
