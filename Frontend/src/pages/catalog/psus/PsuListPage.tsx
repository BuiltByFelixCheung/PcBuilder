import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isPsuFilterActive,
  type PsuFilter,
  type PsuListItem,
} from "@/api/catalog/psus";
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
import { usePsus } from "@/hooks/use-psus.ts";
import {
  emptyPsuFilter,
  psuListParamsFromSearch,
  psuListSearchFromParams,
} from "@/api/catalog/params/psu-list-params";
import { toOptionalNumber } from "@/api/helper";
import {
  PSU_FORM_FACTORS,
  PSU_MODULARITIES,
  type PsuFormFactor,
  type PsuModularity,
} from "@/api/enums";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";
import {
  CatalogCompatibleCheckbox,
  CatalogRangeField,
} from "@/pages/catalog/catalog-filter-fields.tsx";
import { usePcBuild } from "@/builds/usePcBuild";

const EMPTY_ITEMS: PsuListItem[] = [];
const columnHelper = createColumnHelper<typeof dataTableFeatures, PsuListItem>();

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
          cell: nameCell,
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
    setSearchParams(psuListSearchFromParams({ ...params, pageIndex: nextIndex }));
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
            <Field>
              <FieldLabel htmlFor="psu-name">Name</FieldLabel>
              <Input
                id="psu-name"
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
              <FieldLabel htmlFor="psu-manufacturer">Manufacturer</FieldLabel>
              <select
                id="psu-manufacturer"
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
              <FieldLabel htmlFor="psu-modularity">Modularity</FieldLabel>
              <select
                id="psu-modularity"
                className={catalogSelectClassName}
                value={draft.modularity ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    modularity: (event.target.value ||
                      undefined) as PsuModularity | undefined,
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
                className={catalogSelectClassName}
                value={draft.formFactor ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    formFactor: (event.target.value ||
                      undefined) as PsuFormFactor | undefined,
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
            <Field>
              <FieldLabel htmlFor="psu-wattage-min">Wattage</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="psu-wattage-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={draft.wattage?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      wattage: {
                        min: toOptionalNumber(event.target.value),
                        max: current.wattage?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="psu-wattage-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Wattage max"
                  value={draft.wattage?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      wattage: {
                        min: current.wattage?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
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
      return <PageStatus>Loading PSUs…</PageStatus>;
    }
    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }
    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No PSUs match these filters."
            : "No PSUs in the catalog yet."}
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
            <Button>New PSU</Button>
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
            Page {pageIndex + 1} of {pageCount} ({totalCount} PSUs)
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
  info: CellContext<typeof dataTableFeatures, PsuListItem, string>,
) {
  return (
    <Link to={`/catalog/psus/${info.row.original.id}`}>
      {info.getValue()}
    </Link>
  );
}
