import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogLeadColumns } from "@/components/catalog/CatalogLeadColumns";
import { beginBulkEdit } from "@/lib/begin-bulk-edit";
import { deleteChassis } from "@/api/catalog/bulk-delete";
import {
  chassisKeys,
  isChassisFilterActive,
  updateMultipleChassis,
  type ChassisFilter,
  type ChassisListItem,
} from "@/api/catalog/chassis";
import { DecimalInput } from "@/components/catalog/DecimalInput";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { useAuth } from "@/auth/use-auth";
import { useCatalogManufacturers } from "@/hooks/use-catalog-manufacturers.ts";
import { useChassis } from "@/hooks/use-chassis.ts";
import {
  chassisListParamsFromSearch,
  chassisListSearchFromParams,
  emptyChassisFilter,
} from "@/api/catalog/params/chassis-list-params";
import { MB_FORM_FACTORS } from "@/api/enums";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importChassis } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import {
  CatalogFilterActions,
  CatalogFilterGroup,
  CatalogNameField,
  CatalogIdSelectField,
} from "@/components/catalog/CatalogFilterFields";
import { BulkEditDialog } from "@/components/BulkEditDialog";
import { ChassisEditColumns } from "@/pages/catalog/chassis/ChassisEditColumns";
import { useQueryClient } from "@tanstack/react-query";

const EMPTY_ITEMS: ChassisListItem[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  ChassisListItem
>();

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
        ...catalogLeadColumns(
          columnHelper,
          isAdmin,
          (id) => `/catalog/chassis/${id}`,
        ),
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
    beginBulkEdit(items, rowSelection, setEditRows);
  }

  return (
    <section className="catalog-page">
      <h1>Chassis</h1>
      <p className="catalog-lead">
        Browse the catalog, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
        <form className="catalog-filters" onSubmit={applyFilters}>
          <CatalogFilterGroup>
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
                <DecimalInput
                  id="chassis-length-min"
                  label="Length min"
                  placeholder="Min"
                  value={draft.lengthMm?.min}
                  onValue={(min) =>
                    setDraft((current) => ({
                      ...current,
                      lengthMm: {
                        min: min,
                        max: current.lengthMm?.max ?? null,
                      },
                    }))
                  }
                />
                <DecimalInput
                  id="chassis-length-max"
                  label="Length max"
                  placeholder="Max"
                  value={draft.lengthMm?.max}
                  onValue={(max) =>
                    setDraft((current) => ({
                      ...current,
                      lengthMm: {
                        min: current.lengthMm?.min ?? null,
                        max: max,
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="chassis-width-min">Width (mm)</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="chassis-width-min"
                  label="Width min"
                  placeholder="Min"
                  value={draft.widthMm?.min}
                  onValue={(min) =>
                    setDraft((current) => ({
                      ...current,
                      widthMm: {
                        min: min,
                        max: current.widthMm?.max ?? null,
                      },
                    }))
                  }
                />
                <DecimalInput
                  id="chassis-width-max"
                  label="Width max"
                  placeholder="Max"
                  value={draft.widthMm?.max}
                  onValue={(max) =>
                    setDraft((current) => ({
                      ...current,
                      widthMm: {
                        min: current.widthMm?.min ?? null,
                        max: max,
                      },
                    }))
                  }
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="chassis-height-min">Height (mm)</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="chassis-height-min"
                  label="Height min"
                  placeholder="Min"
                  value={draft.heightMm?.min}
                  onValue={(min) =>
                    setDraft((current) => ({
                      ...current,
                      heightMm: {
                        min: min,
                        max: current.heightMm?.max ?? null,
                      },
                    }))
                  }
                />
                <DecimalInput
                  id="chassis-height-max"
                  label="Height max"
                  placeholder="Max"
                  value={draft.heightMm?.max}
                  onValue={(max) =>
                    setDraft((current) => ({
                      ...current,
                      heightMm: {
                        min: current.heightMm?.min ?? null,
                        max: max,
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
                <DecimalInput
                  id="chassis-motherboard-max-width-min"
                  label="Motherboard max width min"
                  placeholder="Min"
                  value={draft.motherboardMaxWidthMm?.min}
                  onValue={(min) =>
                    setDraft((current) => ({
                      ...current,
                      motherboardMaxWidthMm: {
                        min: min,
                        max: current.motherboardMaxWidthMm?.max ?? null,
                      },
                    }))
                  }
                />
                <DecimalInput
                  id="chassis-motherboard-max-width-max"
                  label="Motherboard max width max"
                  placeholder="Max"
                  value={draft.motherboardMaxWidthMm?.max}
                  onValue={(max) =>
                    setDraft((current) => ({
                      ...current,
                      motherboardMaxWidthMm: {
                        min: current.motherboardMaxWidthMm?.min ?? null,
                        max: max,
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
                <DecimalInput
                  id="chassis-motherboard-max-height-min"
                  label="Motherboard max height min"
                  placeholder="Min"
                  value={draft.motherboardMaxHeightMm?.min}
                  onValue={(min) =>
                    setDraft((current) => ({
                      ...current,
                      motherboardMaxHeightMm: {
                        min: min,
                        max: current.motherboardMaxHeightMm?.max ?? null,
                      },
                    }))
                  }
                />
                <DecimalInput
                  id="chassis-motherboard-max-height-max"
                  label="Motherboard max height max"
                  placeholder="Max"
                  value={draft.motherboardMaxHeightMm?.max}
                  onValue={(max) =>
                    setDraft((current) => ({
                      ...current,
                      motherboardMaxHeightMm: {
                        min: current.motherboardMaxHeightMm?.min ?? null,
                        max: max,
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
                <DecimalInput
                  id="chassis-max-cpu-cooler-height-min"
                  label="Max CPU cooler height min"
                  placeholder="Min"
                  value={draft.maxCpuCoolerHeightMm?.min}
                  onValue={(min) =>
                    setDraft((current) => ({
                      ...current,
                      maxCpuCoolerHeightMm: {
                        min: min,
                        max: current.maxCpuCoolerHeightMm?.max ?? null,
                      },
                    }))
                  }
                />
                <DecimalInput
                  id="chassis-max-cpu-cooler-height-max"
                  label="Max CPU cooler height max"
                  placeholder="Max"
                  value={draft.maxCpuCoolerHeightMm?.max}
                  onValue={(max) =>
                    setDraft((current) => ({
                      ...current,
                      maxCpuCoolerHeightMm: {
                        min: current.maxCpuCoolerHeightMm?.min ?? null,
                        max: max,
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
                <DecimalInput
                  id="chassis-max-graphics-card-length-min"
                  label="Max graphics card length min"
                  placeholder="Min"
                  value={draft.maxGraphicsCardLengthMm?.min}
                  onValue={(min) =>
                    setDraft((current) => ({
                      ...current,
                      maxGraphicsCardLengthMm: {
                        min: min,
                        max: current.maxGraphicsCardLengthMm?.max ?? null,
                      },
                    }))
                  }
                />
                <DecimalInput
                  id="chassis-max-graphics-card-length-max"
                  label="Max graphics card length max"
                  placeholder="Max"
                  value={draft.maxGraphicsCardLengthMm?.max}
                  onValue={(max) =>
                    setDraft((current) => ({
                      ...current,
                      maxGraphicsCardLengthMm: {
                        min: current.maxGraphicsCardLengthMm?.min ?? null,
                        max: max,
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
                <DecimalInput
                  id="chassis-max-psu-length-min"
                  label="Max PSU length min"
                  placeholder="Min"
                  value={draft.maxPsuLengthMm?.min}
                  onValue={(min) =>
                    setDraft((current) => ({
                      ...current,
                      maxPsuLengthMm: {
                        min: min,
                        max: current.maxPsuLengthMm?.max ?? null,
                      },
                    }))
                  }
                />
                <DecimalInput
                  id="chassis-max-psu-length-max"
                  label="Max PSU length max"
                  placeholder="Max"
                  value={draft.maxPsuLengthMm?.max}
                  onValue={(max) =>
                    setDraft((current) => ({
                      ...current,
                      maxPsuLengthMm: {
                        min: current.maxPsuLengthMm?.min ?? null,
                        max: max,
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
            loadingMessage="Loading chassis…"
            emptyFilteredMessage="No chassis match these filters."
            emptyMessage="No chassis in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Chassis"
            newItemTo="/catalog/chassis/new"
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
          title="Edit Chassis"
          rows={editRows}
          columns={ChassisEditColumns(manufacturers)}
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
