import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isChassisFanFilterActive,
  type ChassisFan,
  type ChassisFanFilter,
} from "@/api/catalog/chassis-fans";
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
  formatFanDiameterMm,
  type FanDiameterMm,
} from "@/api/enums";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";
import { CatalogCompatibleCheckbox } from "@/pages/catalog/catalog-filter-fields.tsx";
import { usePcBuild } from "@/builds/usePcBuild";
import { useAuth } from "@/auth/useAuth";

const EMPTY_ITEMS: ChassisFan[] = [];
const columnHelper = createColumnHelper<typeof dataTableFeatures, ChassisFan>();

export function ChassisFanListPage() {
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
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isChassisFanFilterActive(params.filter);
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(params.filter.chassisId),
  );

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
        columnHelper.accessor("diameterMm", {
          header: "Diameter",
          cell: (info) => formatFanDiameterMm(info.getValue()),
        }),
        columnHelper.accessor("fansCountPerPack", { header: "Pack size" }),
      ]),
    [isAdmin],
  );

  function compatibilityIds(checked: boolean) {
    return { chassisId: checked ? currentBuild.chassisId : undefined };
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
      <h1>Chassis Fans</h1>
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
              <FieldLabel htmlFor="fan-name">Name</FieldLabel>
              <Input
                id="fan-name"
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
              <FieldLabel htmlFor="fan-manufacturer">Manufacturer</FieldLabel>
              <select
                id="fan-manufacturer"
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
              <FieldLabel htmlFor="fan-diameter">Diameter</FieldLabel>
              <select
                id="fan-diameter"
                className={catalogSelectClassName}
                value={draft.diameterMm ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    diameterMm: (event.target.value || undefined) as
                      | FanDiameterMm
                      | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {FAN_DIAMETERS_MM.map((diameter) => (
                  <option key={diameter} value={diameter}>
                    {formatFanDiameterMm(diameter)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="fan-pack">Fans per pack</FieldLabel>
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
      return <PageStatus>Loading chassis fans…</PageStatus>;
    }
    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }
    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No chassis fans match these filters."
            : "No chassis fans in the catalog yet."}
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
            <Button>New Chassis Fan</Button>
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
            Page {pageIndex + 1} of {pageCount} ({totalCount} chassis fans)
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
  info: CellContext<typeof dataTableFeatures, ChassisFan, string>,
) {
  return (
    <Link to={`/catalog/chassis-fans/${info.row.original.id}`}>
      {info.getValue()}
    </Link>
  );
}