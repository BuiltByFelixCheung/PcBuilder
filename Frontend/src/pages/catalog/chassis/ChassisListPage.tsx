import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isChassisFilterActive,
  type ChassisFilter,
  type ChassisListItem,
} from "@/api/catalog/chassis";
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

import { useChassis } from "@/hooks/use-chassis.ts";
import {
  chassisListParamsFromSearch,
  chassisListSearchFromParams,
  emptyChassisFilter,
} from "@/api/catalog/params/chassis-list-params";
import { toOptionalNumber } from "@/api/helper";
import { MB_FORM_FACTORS } from "@/api/enums";
import {
  listManufacturersByProductType,
  masterDataKeys,
} from "@/api/master-data";
import { useQuery } from "@tanstack/react-query";

const EMPTY_ITEMS: ChassisListItem[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  ChassisListItem
>();
const selectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ChassisListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => chassisListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<ChassisFilter>(() => params.filter);
  const query = useChassis(params);
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
        columnHelper.accessor("maxPsuLengthMm", { header: "Max PSU Length (mm)" }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isChassisFilterActive(params.filter);
  const manufacturerQuery = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("chassis"),
    queryFn: () => listManufacturersByProductType("chassis"),
  });
  const manufacturers = manufacturerQuery.data ?? [];

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

  return (
    <section className="catalog-page">
      <h1>Chassis</h1>
      <p className="catalog-lead">
        Browse the catalog, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
      <form className="catalog-filters" onSubmit={applyFilters}>
        <FieldGroup className="catalog-filter-grid">
          <Field>
            <FieldLabel htmlFor="chassis-name">Name</FieldLabel>
            <Input
              id="chassis-name"
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
            <FieldLabel htmlFor="chassis-manufacturer">Manufacturer</FieldLabel>
            <select
              id="chassis-manufacturer"
              className={selectClassName}
              value={draft.manufacturerId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  manufacturerId: event.target.value,
                }))
              }
            >
              <option value="">Any</option>
              {manufacturers.map((manufacturer) => (
                <option key={manufacturer.id} value={manufacturer.id}>
                  {manufacturer.name}
                </option>
              ))}
            </select>
          </Field>
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
      return <PageStatus>Loading chassis…</PageStatus>;
    }

    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }

    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No chassis match these filters."
            : "No chassis in the catalog yet."}
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
            <Button>New Chassis</Button>
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
            Page {pageIndex + 1} of {pageCount} ({totalCount} CPUs)
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
  info: CellContext<typeof dataTableFeatures, ChassisListItem, string>,
) {
  return (
    <Link to={`/catalog/chassis/${info.row.original.id}`}>
      {info.getValue()}
    </Link>
  );
}
