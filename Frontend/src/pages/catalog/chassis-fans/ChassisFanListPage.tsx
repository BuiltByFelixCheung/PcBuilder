import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  isChassisFanFilterActive,
  type ChassisFan,
  type ChassisFanFilter,
} from "@/api/catalog/chassis-fans";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type CellContext,
  type RowSelectionState,
} from "@tanstack/react-table";
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
} from "@/api/enums";
import { CatalogCompatibleCheckbox } from "@/pages/catalog/catalog-filter-fields.tsx";
import { usePcBuild } from "@/builds/usePcBuild";
import { useAuth } from "@/auth/useAuth";
import { CatalogPagedResults } from "@/pages/catalog/catalog-results";
import { CatalogFilterActions, CatalogNameField, CatalogEnumField, CatalogIdSelectField } from "@/pages/catalog/catalog-filter-fields";

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
            <CatalogNameField
              id="fan-name"
              value={draft.name}
              onChange={(name) =>
                setDraft((current) => ({ ...current, name }))
              }
            />
            <CatalogIdSelectField
              id="fan-manufacturer"
              label="Manufacturer"
              value={draft.manufacturerId}
              options={manufacturers}
              onChange={(value) =>
                setDraft((current) => ({ ...current, manufacturerId: value || undefined }))
              }
            />
            <CatalogEnumField
              id="fan-diameter"
              label="Diameter"
              value={draft.diameterMm}
              options={FAN_DIAMETERS_MM}
              formatOption={formatFanDiameterMm}
              onChange={(diameterMm) =>
                setDraft((current) => ({ ...current, diameterMm }))
              }
            />
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
          <CatalogFilterActions onClear={clearFilters} />
        </form>
        <div className="catalog-results">
          <CatalogPagedResults
            isInitialLoading={query.isPending && !query.data}
            isError={query.isError}
            error={query.error}
            items={items}
            filtering={filtering}
            loadingMessage="Loading chassis fans…"
            emptyFilteredMessage="No chassis fans match these filters."
            emptyMessage="No chassis fans in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Chassis Fan"
            columns={columns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            pageIndex={pageIndex}
            pageCount={pageCount}
            totalCount={totalCount}
            countLabel="chassis fans"
            onPageChange={goToPage}
          />
        </div>
      </div>
    </section>
  );

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