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
import { CatalogListResults } from "@/components/catalog/CatalogResults";
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
import { enumText, ui } from "@/i18n/translate-enum";

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
        columnHelper.accessor("lengthMm", { header: ui.header("lengthMm") }),
        columnHelper.accessor("widthMm", { header: ui.header("widthMm") }),
        columnHelper.accessor("heightMm", { header: ui.header("heightMm") }),
        columnHelper.accessor("motherboardMaxWidthMm", {
          header: ui.header("motherboardMaxWidthMm"),
        }),
        columnHelper.accessor("motherboardMaxHeightMm", {
          header: ui.header("motherboardMaxHeightMm"),
        }),
        columnHelper.accessor("maxCpuCoolerHeightMm", {
          header: ui.header("maxCpuCoolerHeightMm"),
        }),
        columnHelper.accessor("maxGraphicsCardLengthMm", {
          header: ui.header("maxGraphicsCardLengthMm"),
        }),
        columnHelper.accessor("maxPsuLengthMm", {
          header: ui.header("maxPsuLengthMm"),
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
    singular: ui.label("nChassis"),
    plural: ui.label("nChassis"),
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
      <h1>{ui.nav("products.chassis")}</h1>
      <p className="catalog-lead">{ui.message("browseCatalogLead")}</p>
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
              label={ui.label("manufacturer")}
              value={draft.manufacturerId}
              options={manufacturers}
              onChange={(value) =>
                setDraft((current) => ({ ...current, manufacturerId: value }))
              }
            />
            <Field>
              <FieldLabel htmlFor="chassis-length-min">{ui.label("lengthMm")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="chassis-length-min"
                  label={ui.label("lengthMin")}
                  placeholder={ui.label("min")}
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
                  label={ui.label("lengthMax")}
                  placeholder={ui.label("max")}
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
              <FieldLabel htmlFor="chassis-width-min">{ui.label("widthMm")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="chassis-width-min"
                  label={ui.label("widthMin")}
                  placeholder={ui.label("min")}
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
                  label={ui.label("widthMax")}
                  placeholder={ui.label("max")}
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
              <FieldLabel htmlFor="chassis-height-min">{ui.label("heightMm")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="chassis-height-min"
                  label={ui.label("heightMin")}
                  placeholder={ui.label("min")}
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
                  label={ui.label("heightMax")}
                  placeholder={ui.label("max")}
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
              <FieldLabel htmlFor="chassis-motherboard-max-width-min">{ui.label("motherboardMaxWidthMm")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="chassis-motherboard-max-width-min"
                  label={ui.label("motherboardMaxWidthMin")}
                  placeholder={ui.label("min")}
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
                  label={ui.label("motherboardMaxWidthMax")}
                  placeholder={ui.label("max")}
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
              <FieldLabel htmlFor="chassis-motherboard-max-height-min">{ui.label("motherboardMaxHeightMm")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="chassis-motherboard-max-height-min"
                  label={ui.label("motherboardMaxHeightMin")}
                  placeholder={ui.label("min")}
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
                  label={ui.label("motherboardMaxHeightMax")}
                  placeholder={ui.label("max")}
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
              <FieldLabel htmlFor="chassis-max-cpu-cooler-height-min">{ui.label("maxCpuCoolerHeightMm")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="chassis-max-cpu-cooler-height-min"
                  label={ui.label("maxCpuCoolerHeightMin")}
                  placeholder={ui.label("min")}
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
                  label={ui.label("maxCpuCoolerHeightMax")}
                  placeholder={ui.label("max")}
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
              <FieldLabel htmlFor="chassis-max-graphics-card-length-min">{ui.label("maxGraphicsCardLengthMm")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="chassis-max-graphics-card-length-min"
                  label={ui.label("maxGraphicsCardLengthMin")}
                  placeholder={ui.label("min")}
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
                  label={ui.label("maxGraphicsCardLengthMax")}
                  placeholder={ui.label("max")}
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
              <FieldLabel htmlFor="chassis-max-psu-length-min">{ui.label("maxPsuLengthMm")}</FieldLabel>
              <div className="flex gap-2">
                <DecimalInput
                  id="chassis-max-psu-length-min"
                  label={ui.label("maxPsuLengthMin")}
                  placeholder={ui.label("min")}
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
                  label={ui.label("maxPsuLengthMax")}
                  placeholder={ui.label("max")}
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
              <FieldLabel>{ui.label("supportedMbFormFactors")}</FieldLabel>
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
                      {enumText.mbFormFactor(formFactor)}
                    </label>
                  );
                })}
              </div>
            </Field>
          </CatalogFilterGroup>
          <CatalogFilterActions onClear={clearFilters} />
        </form>
        <CatalogListResults
          entity="chassis"
          query={query}
          items={items}
          filtering={filtering}
          columns={columns}
          isAdmin={isAdmin}
          newItemLabel={ui.action("newChassis")}
          newItemTo="/catalog/chassis/new"
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          bulkDelete={bulkDelete}
          onImport={excelImport.openImport}
          onEditSelected={startEditing}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={goToPage}
        />
      </div>
      {editRows ? (
        <BulkEditDialog
          title={ui.dialog("editChassis")}
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
