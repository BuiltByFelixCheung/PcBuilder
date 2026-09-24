import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { deletePsus } from "@/api/catalog/bulk-delete";
import {
  psuKeys,
  isPsuFilterActive,
  type PsuFilter,
  type PsuListItem,
} from "@/api/catalog/psus";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
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
import { catalogNameCell } from "@/components/catalog/CatalogNameCell";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";

const EMPTY_ITEMS: PsuListItem[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  PsuListItem
>();

export function PsuListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => psuListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<PsuFilter>(() => params.filter);
  const manufacturers = useCatalogManufacturers("psu");
  const query = usePsus(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...(isAdmin ? [createSelectionColumn(columnHelper)] : []),
        columnHelper.accessor("name", {
          header: "Name",
          cell: (info) =>
            catalogNameCell(
              `/catalog/psus/${info.row.original.id}`,
              info.getValue(),
            ),
        }),
        columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
        columnHelper.accessor("wattage", {
          header: "Wattage",
          cell: (info) => `${info.getValue()} W`,
        }),
        columnHelper.accessor("modularity", { header: "Modularity" }),
        columnHelper.accessor("formFactor", { header: "Form factor" }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: psuKeys.all,
    singular: "PSU",
    plural: "PSUs",
    deleteByIds: deletePsus,
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
      <h1>PSUs</h1>
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
              id="psu-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="psu-manufacturer"
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
            <Field>
              <FieldLabel htmlFor="psu-modularity">Modularity</FieldLabel>
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
                <option value="">Any</option>
                {PSU_MODULARITIES.map((modularity) => (
                  <option key={modularity} value={modularity}>
                    {modularity}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="psu-form-factor">Form factor</FieldLabel>
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
                <option value="">Any</option>
                {PSU_FORM_FACTORS.map((formFactor) => (
                  <option key={formFactor} value={formFactor}>
                    {formFactor}
                  </option>
                ))}
              </select>
            </Field>
            <CatalogRangeField
              id="psu-wattage"
              label="Wattage"
              maxAriaLabel="Wattage max"
              range={draft.wattage}
              onChange={(wattage) =>
                setDraft((current) => ({ ...current, wattage }))
              }
            />
            <CatalogRangeField
              id="psu-length"
              label="Length (mm)"
              maxAriaLabel="Length max"
              range={draft.lengthMm}
              onChange={(lengthMm) =>
                setDraft((current) => ({ ...current, lengthMm }))
              }
            />
            <CatalogRangeField
              id="psu-width"
              label="Width (mm)"
              maxAriaLabel="Width max"
              range={draft.widthMm}
              onChange={(widthMm) =>
                setDraft((current) => ({ ...current, widthMm }))
              }
            />
            <CatalogRangeField
              id="psu-height"
              label="Height (mm)"
              maxAriaLabel="Height max"
              range={draft.heightMm}
              onChange={(heightMm) =>
                setDraft((current) => ({ ...current, heightMm }))
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
            loadingMessage="Loading PSUs…"
            emptyFilteredMessage="No PSUs match these filters."
            emptyMessage="No PSUs in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New PSU"
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onImport={excelImport.openImport}
            pageIndex={pageIndex}
            pageCount={pageCount}
            totalCount={totalCount}
            countLabel="PSUs"
            onPageChange={goToPage}
          />
        </div>
      </div>
      {excelImport.importDialog}
    </section>
  );
}
