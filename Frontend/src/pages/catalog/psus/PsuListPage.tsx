import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogLeadColumns } from "@/components/catalog/CatalogLeadColumns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import { deletePsus } from "@/api/catalog/bulk-delete";
import {
  psuKeys,
  isPsuFilterActive,
  type PsuFilter,
  type PsuListItem,
  updatePsus,
} from "@/api/catalog/psus";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { useAuth } from "@/auth/use-auth";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { usePsus } from "@/hooks/use-psus.ts";
import {
  emptyPsuFilter,
  psuListParamsFromSearch,
  psuListSearchFromParams,
} from "@/api/catalog/params/psu-list-params";
import {
  PSU_FORM_FACTORS,
  PSU_MODULARITIES,
  type PsuFormFactor,
  type PsuModularity,
} from "@/api/enums";
import {enumText, ui} from "@/i18n/translate-enum";
import { formSelectClassName } from "@/components/filters/ListFilters";
import {
  CatalogCompatibleCheckbox,
  CatalogRangeField,
} from "@/components/catalog/CatalogFilterFields.tsx";
import { usePcBuild } from "@/builds/use-pc-build";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importPsus } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogFilterActions,
  CatalogFilterGroup,
  CatalogNameField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import { PsuEditColumns } from "@/pages/catalog/psus/PsuEditColumns";
import { useQueryClient } from "@tanstack/react-query";

const EMPTY_ITEMS: PsuListItem[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  PsuListItem
>();

export function PsuListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => psuListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<PsuFilter>(() => params.filter);
  const manufacturers = useCatalogManufacturers("psu");
  const query = usePsus(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editRows, setEditRows] = useState<PsuListItem[] | null>(null);
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/psus/${id}`,
        ),
        columnHelper.accessor("wattage", {
          header: ui.header("wattage"),
          cell: (info) => `${info.getValue()} ${ui.unit("watts")}`,
        }),
        columnHelper.accessor("modularity", {
          header: ui.header("modularity"),
          cell: (info) => enumText.psuModularity(info.getValue()),
        }),
        columnHelper.accessor("formFactor", {
          header: ui.header("formFactor"),
          cell: (info) => enumText.psuFormFactor(info.getValue()),
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: psuKeys.all,
    singular: ui.label("nPsu"),
    plural: ui.label("nPsus"),
    deleteByIds: (ids) => deletePsus({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: psuKeys.all,
    importFile: importPsus,
  });
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isPsuFilterActive(params.filter);
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(
      params.filter.chassisId ||
      params.filter.motherboardId ||
      params.filter.graphicsCardId ||
      params.filter.cpuId,
    ),
  );

  function compatibilityIds(checked: boolean) {
    return {
      chassisId: checked ? currentBuild.chassisId : undefined,
      motherboardId: checked ? currentBuild.motherboardId : undefined,
      graphicsCardId: checked ? currentBuild.graphicsCardId : undefined,
      cpuId: checked ? currentBuild.cpuId : undefined,
    };
  }

  function startEditing() {
    beginBulkEdit(items, rowSelection, setEditRows);
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      psuListSearchFromParams({ ...params, pageIndex: 0, filter: draft }),
    );
  }

  function applyCompatibleFilter(checked: boolean) {
    const next = compatibilityIds(checked);
    setShowOnlyCompatible(checked);
    setDraft((current) => ({ ...current, ...next }));
    setSearchParams(
      psuListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: { ...params.filter, ...next },
      }),
    );
  }

  function clearFilters() {
    setShowOnlyCompatible(false);
    setDraft(emptyPsuFilter);
    setSearchParams(
      psuListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyPsuFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      psuListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>{ui.nav("products.psus")}</h1>
      <p className="catalog-lead">{ui.message("browseCatalogLead")}</p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <CatalogFilterGroup>
            <CatalogCompatibleCheckbox
              checked={showOnlyCompatible}
              onCheckedChange={applyCompatibleFilter}
            />
            <CatalogNameField
              id="psu-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="psu-manufacturer"
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
            <Field>
              <FieldLabel htmlFor="psu-modularity">{ui.label("modularity")}</FieldLabel>
              <select
                id="psu-modularity"
                className={formSelectClassName}
                value={draft.modularity ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    modularity: (event.target.value || undefined) as
                      PsuModularity | undefined,
                  }))
                }
              >
                <option value="">{ui.label("any")}</option>
                {PSU_MODULARITIES.map((modularity) => (
                  <option key={modularity} value={modularity}>
                    {enumText.psuModularity(modularity)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="psu-form-factor">{ui.label("formFactor")}</FieldLabel>
              <select
                id="psu-form-factor"
                className={formSelectClassName}
                value={draft.formFactor ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    formFactor: (event.target.value || undefined) as
                      PsuFormFactor | undefined,
                  }))
                }
              >
                <option value="">{ui.label("any")}</option>
                {PSU_FORM_FACTORS.map((formFactor) => (
                  <option key={formFactor} value={formFactor}>
                    {enumText.psuFormFactor(formFactor)}
                  </option>
                ))}
              </select>
            </Field>
            <CatalogRangeField
              id="psu-wattage"
              label={ui.label("wattage")}
              maxAriaLabel={ui.label("wattageMax")}
              range={draft.wattage}
              onChange={(wattage) =>
                setDraft((current) => ({ ...current, wattage }))
              }
            />
            <CatalogRangeField
              id="psu-length"
              label={ui.label("lengthMm")}
              maxAriaLabel={ui.label("lengthMax")}
              range={draft.lengthMm}
              onChange={(lengthMm) =>
                setDraft((current) => ({ ...current, lengthMm }))
              }
            />
            <CatalogRangeField
              id="psu-width"
              label={ui.label("widthMm")}
              maxAriaLabel={ui.label("widthMax")}
              range={draft.widthMm}
              onChange={(widthMm) =>
                setDraft((current) => ({ ...current, widthMm }))
              }
            />
            <CatalogRangeField
              id="psu-height"
              label={ui.label("heightMm")}
              maxAriaLabel={ui.label("heightMax")}
              range={draft.heightMm}
              onChange={(heightMm) =>
                setDraft((current) => ({ ...current, heightMm }))
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
            loadingMessage={ui.empty("loading", { entity: ui.entity("psus") })}
            emptyFilteredMessage={ui.empty("noMatchFilters", { entity: ui.entity("psus") })}
            emptyMessage={ui.empty("noneInCatalog", { entity: ui.entity("psus") })}
            isAdmin={isAdmin}
            newItemLabel={ui.action("newPsu")}
            newItemTo="/catalog/psus/new"
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
      {editRows ? (
        <BulkEditDialog
          title={ui.dialog("editPsus")}
          rows={editRows}
          columns={PsuEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updatePsus(rows);
            await queryClient.invalidateQueries({
              queryKey: psuKeys.all,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
