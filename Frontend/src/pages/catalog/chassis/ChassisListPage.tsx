import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteChassis } from "@/api/catalog/bulk-delete";
import {
  chassisKeys,
  isChassisFilterActive,
  updateMultipleChassis,
  type ChassisFilter,
  type ChassisListItem,
} from "@/api/catalog/chassis";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useAuth } from "@/auth/use-auth";

import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { useChassis } from "@/hooks/use-chassis.ts";
import {
  chassisListParamsFromSearch,
  chassisListSearchFromParams,
  emptyChassisFilter,
} from "@/api/catalog/params/chassis-list-params";
import { toOptionalNumber } from "@/api/helper";
import { MB_FORM_FACTORS } from "@/api/enums";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importChassis } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import { catalogNameCell } from "@/components/catalog/CatalogNameCell";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import {
  BulkEditDialog,
  type BulkEditColumn,
} from "@/components/BulkEditDialog";
import { useQueryClient } from "@tanstack/react-query";
import { formSelectClassName } from "@/components/filters/ListFilters";

const EMPTY_ITEMS: ChassisListItem[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  ChassisListItem
>();

function chassisEditColumns(
  manufacturers: { id: string; name: string }[],
): BulkEditColumn<ChassisListItem>[] {
  return [
    {
      header: "Name",
      cell: (row, update) => (
        <Input
          aria-label={`Name for ${row.name}`}
          value={row.name}
          onChange={(event) => update({ ...row, name: event.target.value })}
        />
      ),
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
      ),
    },
    {
      header: "Length (mm)",
      numeric: true,
      cell: (row, update) => (
        <Input
          aria-label={`Length (mm) for ${row.name}`}
          type="number"
          min={0}
          value={row.lengthMm?.toString() ?? ""}
          onChange={(event) =>
            update({
              ...row,
              lengthMm: toOptionalNumber(event.target.value) ?? 0,
            })
          }
        />
      ),
    },
    {
      header: "Width (mm)",
      numeric: true,
      cell: (row, update) => (
        <Input
          aria-label={`Width (mm) for ${row.name}`}
          type="number"
          min={0}
          value={row.widthMm?.toString() ?? ""}
          onChange={(event) =>
            update({
              ...row,
              widthMm: toOptionalNumber(event.target.value) ?? 0,
            })
          }
        />
      ),
    },
    {
      header: "Height (mm)",
      numeric: true,
      cell: (row, update) => (
        <Input
          aria-label={`Height (mm) for ${row.name}`}
          type="number"
          min={0}
          value={row.heightMm?.toString() ?? ""}
          onChange={(event) =>
            update({
              ...row,
              heightMm: toOptionalNumber(event.target.value) ?? 0,
            })
          }
        />
      ),
    },
    {
      header: "Motherboard Max Width (mm)",
      numeric: true,
      cell: (row, update) => (
        <Input
          aria-label={`Motherboard Max Width (mm) for ${row.name}`}
          type="number"
          min={0}
          value={row.motherboardMaxWidthMm?.toString() ?? ""}
          onChange={(event) =>
            update({
              ...row,
              motherboardMaxWidthMm: toOptionalNumber(event.target.value) ?? 0,
            })
          }
        />
      ),
    },
    {
      header: "Motherboard Max Height (mm)",
      numeric: true,
      cell: (row, update) => (
        <Input
          aria-label={`Motherboard Max Height (mm) for ${row.name}`}
          type="number"
          min={0}
          value={row.motherboardMaxHeightMm?.toString() ?? ""}
          onChange={(event) =>
            update({
              ...row,
              motherboardMaxHeightMm: toOptionalNumber(event.target.value) ?? 0,
            })
          }
        />
      ),
    },
    {
      header: "Max CPU Cooler Height (mm)",
      numeric: true,
      cell: (row, update) => (
        <Input
          aria-label={`Max CPU Cooler Height (mm) for ${row.name}`}
          type="number"
          min={0}
          value={row.maxCpuCoolerHeightMm?.toString() ?? ""}
          onChange={(event) =>
            update({
              ...row,
              maxCpuCoolerHeightMm: toOptionalNumber(event.target.value) ?? 0,
            })
          }
        />
      ),
    },
    {
      header: "Max Graphics Card Length (mm)",
      numeric: true,
      cell: (row, update) => (
        <Input
          aria-label={`Max Graphics Card Length (mm) for ${row.name}`}
          type="number"
          min={0}
          value={row.maxGraphicsCardLengthMm?.toString() ?? ""}
          onChange={(event) =>
            update({
              ...row,
              maxGraphicsCardLengthMm:
                toOptionalNumber(event.target.value) ?? 0,
            })
          }
        />
      ),
    },
    {
      header: "Max PSU Length (mm)",
      numeric: true,
      cell: (row, update) => (
        <Input
          aria-label={`Max PSU Length (mm) for ${row.name}`}
          type="number"
          min={0}
          value={row.maxPsuLengthMm?.toString() ?? ""}
          onChange={(event) =>
            update({
              ...row,
              maxPsuLengthMm: toOptionalNumber(event.target.value) ?? 0,
            })
          }
        />
      ),
    },
  ];
}

export function ChassisListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => chassisListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<ChassisFilter>(() => params.filter);
  const query = useChassis(params);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editRows, setEditRows] = useState<ChassisListItem[] | null>(null);
  const { isAdmin } = useAuth();

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...(isAdmin ? [createSelectionColumn(columnHelper)] : []),
        columnHelper.accessor("name", {
          header: "Name",
          cell: (info) =>
            catalogNameCell(
              `/catalog/chassis/${info.row.original.id}`,
              info.getValue(),
            ),
        }),
        columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
        columnHelper.accessor("lengthMm", { header: "Length (mm)" }),
        columnHelper.accessor("widthMm", { header: "Width (mm)" }),
        columnHelper.accessor("heightMm", { header: "Height (mm)" }),
        columnHelper.accessor("motherboardMaxWidthMm", {
          header: "Motherboard Max Width (mm)",
        }),
        columnHelper.accessor("motherboardMaxHeightMm", {
          header: "Motherboard Max Height (mm)",
        }),
        columnHelper.accessor("maxCpuCoolerHeightMm", {
          header: "Max CPU Cooler Height (mm)",
        }),
        columnHelper.accessor("maxGraphicsCardLengthMm", {
          header: "Max Graphics Card Length (mm)",
        }),
        columnHelper.accessor("maxPsuLengthMm", {
          header: "Max PSU Length (mm)",
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: chassisKeys.all,
    singular: "chassis",
    plural: "chassis",
    deleteByIds: (ids) => deleteChassis({ ids }),
  });
  const excelImport = useExcelImport({
    queryKey: chassisKeys.all,
    importFile: importChassis,
  });
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isChassisFilterActive(params.filter);
  const manufacturers = useCatalogManufacturers("chassis");

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      chassisListSearchFromParams({ ...params, pageIndex: 0, filter: draft }),
    );
  }

  function clearFilters() {
    setDraft(emptyChassisFilter);
    setSearchParams(
      chassisListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyChassisFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      chassisListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  function startEditing() {
    const selected = items.filter((item) => rowSelection[item.id]);
    if (selected.length === 0) return;
    setEditRows(selected);
  }

  return (
    <section className="catalog-page">
      <h1>Chassis</h1>
      <p className="catalog-lead">
        Browse the catalog, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <FieldGroup className="catalog-filter-grid">
            <CatalogNameField
              id="chassis-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="chassis-manufacturer"
              label="Manufacturer"
              value={draft.manufacturerId}
              options={manufacturers}
              onChange={(value) =>
                setDraft((current) => ({ ...current, manufacturerId: value }))
              }
            />
            <Field>
              <FieldLabel htmlFor="chassis-length-min">Length (mm)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="chassis-length-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  aria-label="Length min"
                  value={draft.lengthMm?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      lengthMm: {
                        min: toOptionalNumber(event.target.value),
                        max: current.lengthMm?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="chassis-length-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Length max"
                  value={draft.lengthMm?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      lengthMm: {
                        min: current.lengthMm?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="chassis-width-min">Width (mm)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="chassis-width-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  aria-label="Width min"
                  value={draft.widthMm?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      widthMm: {
                        min: toOptionalNumber(event.target.value),
                        max: current.widthMm?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="chassis-width-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Width max"
                  value={draft.widthMm?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      widthMm: {
                        min: current.widthMm?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="chassis-height-min">Height (mm)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="chassis-height-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  aria-label="Height min"
                  value={draft.heightMm?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      heightMm: {
                        min: toOptionalNumber(event.target.value),
                        max: current.heightMm?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="chassis-height-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Height max"
                  value={draft.heightMm?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      heightMm: {
                        min: current.heightMm?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="chassis-motherboard-max-width-min">
                Motherboard Max Width (mm)
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="chassis-motherboard-max-width-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  aria-label="Motherboard max width min"
                  value={draft.motherboardMaxWidthMm?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      motherboardMaxWidthMm: {
                        min: toOptionalNumber(event.target.value),
                        max: current.motherboardMaxWidthMm?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="chassis-motherboard-max-width-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Motherboard max width max"
                  value={draft.motherboardMaxWidthMm?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      motherboardMaxWidthMm: {
                        min: current.motherboardMaxWidthMm?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="chassis-motherboard-max-height-min">
                Motherboard Max Height (mm)
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="chassis-motherboard-max-height-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  aria-label="Motherboard max height min"
                  value={draft.motherboardMaxHeightMm?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      motherboardMaxHeightMm: {
                        min: toOptionalNumber(event.target.value),
                        max: current.motherboardMaxHeightMm?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="chassis-motherboard-max-height-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Motherboard max height max"
                  value={draft.motherboardMaxHeightMm?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      motherboardMaxHeightMm: {
                        min: current.motherboardMaxHeightMm?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="chassis-max-cpu-cooler-height-min">
                Max CPU Cooler Height (mm)
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="chassis-max-cpu-cooler-height-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  aria-label="Max CPU cooler height min"
                  value={draft.maxCpuCoolerHeightMm?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxCpuCoolerHeightMm: {
                        min: toOptionalNumber(event.target.value),
                        max: current.maxCpuCoolerHeightMm?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="chassis-max-cpu-cooler-height-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Max CPU cooler height max"
                  value={draft.maxCpuCoolerHeightMm?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxCpuCoolerHeightMm: {
                        min: current.maxCpuCoolerHeightMm?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="chassis-max-graphics-card-length-min">
                Max Graphics Card Length (mm)
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="chassis-max-graphics-card-length-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  aria-label="Max graphics card length min"
                  value={draft.maxGraphicsCardLengthMm?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxGraphicsCardLengthMm: {
                        min: toOptionalNumber(event.target.value),
                        max: current.maxGraphicsCardLengthMm?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="chassis-max-graphics-card-length-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Max graphics card length max"
                  value={draft.maxGraphicsCardLengthMm?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxGraphicsCardLengthMm: {
                        min: current.maxGraphicsCardLengthMm?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="chassis-max-psu-length-min">
                Max PSU Length (mm)
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="chassis-max-psu-length-min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  aria-label="Max PSU length min"
                  value={draft.maxPsuLengthMm?.min ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxPsuLengthMm: {
                        min: toOptionalNumber(event.target.value),
                        max: current.maxPsuLengthMm?.max ?? null,
                      },
                    }))
                  }
                />
                <Input
                  id="chassis-max-psu-length-max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  aria-label="Max PSU length max"
                  value={draft.maxPsuLengthMm?.max ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxPsuLengthMm: {
                        min: current.maxPsuLengthMm?.min ?? null,
                        max: toOptionalNumber(event.target.value),
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel>Supported MB Form Factors</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {MB_FORM_FACTORS.map((formFactor) => {
                  const id = `chassis-mb-form-factor-${formFactor}`;
                  return (
                    <label
                      key={formFactor}
                      htmlFor={id}
                      className="flex items-center gap-2"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={draft.maxSupportedMbFormFactor === formFactor}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            maxSupportedMbFormFactor: event.target.checked
                              ? formFactor
                              : undefined,
                          }))
                        }
                      />
                      {formFactor}
                    </label>
                  );
                })}
              </div>
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
            loadingMessage="Loading chassis…"
            emptyFilteredMessage="No chassis match these filters."
            emptyMessage="No chassis in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Chassis"
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
            countLabel="Chassis"
            onPageChange={goToPage}
          />
        </div>
      </div>
      {editRows ? (
        <BulkEditDialog
          title="Edit Chassis"
          rows={editRows}
          columns={chassisEditColumns(manufacturers)}
          onClose={() => setEditRows(null)}
          onSave={async (rows) => {
            await updateMultipleChassis(rows);
            await queryClient.invalidateQueries({
              queryKey: chassisKeys.all,
            });
            setRowSelection({});
          }}
        />
      ) : null}
      {excelImport.importDialog}
    </section>
  );
}
