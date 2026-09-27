import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteChassisFans } from "@/api/catalog/bulk-delete";
import {
  chassisFanKeys,
  isChassisFanFilterActive,
  updateChassisFans,
  type ChassisFan,
  type ChassisFanFilter,
} from "@/api/catalog/chassis-fans";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
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
import { FAN_DIAMETERS_MM, formatFanDiameterMm, type FanDiameterMm } from "@/api/enums";
import { CatalogCompatibleCheckbox } from "@/components/catalog/CatalogFilterFields.tsx";
import { usePcBuild } from "@/builds/use-pc-build";
import { useAuth } from "@/auth/use-auth";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importChassisFans } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import { catalogNameCell } from "@/components/catalog/CatalogNameCell";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogEnumField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import { useQueryClient } from "@tanstack/react-query";
import { formSelectClassName } from "@/components/filters/ListFilters";
import { BulkEditDialog, type BulkEditColumn } from "@/components/BulkEditDialog";

const EMPTY_ITEMS: ChassisFan[] = [];
const columnHelper = createColumnHelper<typeof dataTableFeatures, ChassisFan>();

function chassisFanEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<ChassisFan>[] {
  return [
    {
      header: "Name",
      cell: (row, update) => (
        <Input
          aria-label={`Name for ${row.name}`}
          value={row.name}
          onChange={(event) => update({ ...row, name: event.target.value })}
        />
      )
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
      )
    },
    {
      header: "Diameter",
      cell: (row, update) => (
        <select
          aria-label={`Diameter for ${row.name}`}
          className={formSelectClassName}
          value={row.diameterMm}
          onChange={(event) => update({ ...row, diameterMm: event.target.value as FanDiameterMm })}
        >
          {FAN_DIAMETERS_MM.map((diameter) => (
            <option key={diameter} value={diameter}>
              {formatFanDiameterMm(diameter)}
            </option>
          ))}
        </select>
      )
    },
    {
      header: "Pack size",
      cell: (row, update) => (
        <select 
          aria-label={`Pack size for ${row.name}`}
          className={formSelectClassName}
          value={row.fansCountPerPack}
          onChange={(event) => update({ ...row, fansCountPerPack: toInteger(event.target.value) ?? 0 })}
        >
          {Array.from({ length: 10 }, (_, index) => index + 1).map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      )
    }
  ];
}


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
    singular: "chassis fan",
    plural: "chassis fans",
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
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...(isAdmin ? [createSelectionColumn(columnHelper)] : []),
        columnHelper.accessor("name", {
          header: "Name",
          cell: (info) =>
            catalogNameCell(
              `/catalog/chassis-fans/${info.row.original.id}`,
              info.getValue(),
            ),
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


  function startEditing() {
    const selected = items.filter((item) => rowSelection[item.id]);
    if (selected.length === 0) return;
    setEditRows(selected);
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
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="fan-manufacturer"
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
            onDeleteSelected={() => void bulkDelete.onDeleteSelected()}
            deleting={bulkDelete.isDeleting}
            deleteError={bulkDelete.deleteError}
            onEditSelected={startEditing}
            onImport={excelImport.openImport}
            pageIndex={pageIndex}
            pageCount={pageCount}
            totalCount={totalCount}
            countLabel="chassis fans"
            onPageChange={goToPage}
          />
        </div>
      </div>
      {editRows ? (
        <BulkEditDialog
          title="Edit Chassis Fans"
          rows={editRows}
          columns={chassisFanEditColumns(manufacturers)}
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
