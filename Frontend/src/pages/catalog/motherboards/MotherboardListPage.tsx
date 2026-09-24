import { useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteMotherboards } from "@/api/catalog/bulk-delete";
import {
  motherboardKeys,
  isMotherboardFilterActive,
  type MotherboardFilter,
  type MotherboardListItem,
} from "@/api/catalog/motherboards";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import { createSelectionColumn } from "@/components/ui/selection-column";
import { useAuth } from "@/auth/use-auth";
import { useMotherboardFilterOptions } from "@/hooks/use-motherboard-filter-options.ts";
import { useMotherboards } from "@/hooks/use-motherboards.ts";
import {
  emptyMotherboardFilter,
  motherboardListParamsFromSearch,
  motherboardListSearchFromParams,
} from "@/api/catalog/params/motherboard-list-params";
import { toInteger } from "@/api/helper";
import {
  DDR_GENERATIONS,
  MB_FORM_FACTORS,
  RAM_FORM_FACTORS,
  type DdrGeneration,
} from "@/api/enums";
import { usePcBuild } from "@/builds";
import { CatalogPagedResults } from "@/components/catalog/CatalogResults";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { importMotherboards } from "@/api/catalog/import-excel";
import { useExcelImport } from "@/hooks/use-excel-import";
import { catalogNameCell } from "@/components/catalog/CatalogNameCell";
import {
  CatalogFilterActions,
  CatalogNameField,
  CatalogCompatibleCheckbox,
  CatalogEnumField,
  CatalogIdSelectField,
  CatalogRangeField,
} from "@/components/catalog/CatalogFilterFields";

const EMPTY_ITEMS: MotherboardListItem[] = [];
const columnHelper = createColumnHelper<
  typeof dataTableFeatures,
  MotherboardListItem
>();
const selectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function optionalBooleanValue(value: boolean | undefined): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

export function MotherboardListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => motherboardListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<MotherboardFilter>(() => params.filter);
  const { manufacturers, sockets, chipsets } = useMotherboardFilterOptions();
  const query = useMotherboards(params);
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
              `/catalog/motherboards/${info.row.original.id}`,
              info.getValue(),
            ),
        }),
        columnHelper.accessor("manufacturerName", { header: "Manufacturer" }),
        columnHelper.accessor("socketName", { header: "Socket" }),
        columnHelper.accessor("chipsetName", { header: "Chipset" }),
        columnHelper.accessor("formFactor", { header: "Form factor" }),
        columnHelper.accessor("ddrGeneration", {
          header: "DDR",
          cell: (info) => info.getValue().replace("Ddr", "DDR"),
        }),
        columnHelper.accessor("ramSlots", { header: "RAM slots" }),
        columnHelper.accessor("wifiEnabled", {
          header: "Wi-Fi",
          cell: (info) => (info.getValue() ? "Yes" : "No"),
        }),
      ]),
    [isAdmin],
  );
  const items = query.data?.items ?? EMPTY_ITEMS;
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: motherboardKeys.all,
    singular: "motherboard",
    plural: "motherboards",
    deleteByIds: deleteMotherboards,
  });
  const excelImport = useExcelImport({
    queryKey: motherboardKeys.all,
    importFile: importMotherboards,
  });
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isMotherboardFilterActive(params.filter);
  const chipsetOptions = draft.socketId
    ? chipsets.filter((item) => item.socketId === draft.socketId)
    : chipsets;
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(() =>
    Boolean(params.filter.chassisId),
  );

  function applyCompatibleFilter(checked: boolean) {
    const chassisId = checked ? currentBuild.chassisId : undefined;
    setShowOnlyCompatible(checked);
    setDraft((current) => ({ ...current, chassisId }));
    setSearchParams(
      motherboardListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: { ...params.filter, chassisId },
      }),
    );
  }

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      motherboardListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: draft,
      }),
    );
  }

  function clearFilters() {
    setShowOnlyCompatible(false);
    setDraft(emptyMotherboardFilter);
    setSearchParams(
      motherboardListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyMotherboardFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      motherboardListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>Motherboards</h1>
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
              id="motherboard-name"
              value={draft.name}
              onChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <CatalogIdSelectField
              id="motherboard-manufacturer"
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
              <FieldLabel htmlFor="motherboard-socket">Socket</FieldLabel>
              <select
                id="motherboard-socket"
                className={selectClassName}
                value={draft.socketId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    socketId: event.target.value || undefined,
                    chipsetId: undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {sockets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <CatalogIdSelectField
              id="motherboard-chipset"
              label="Chipset"
              value={draft.chipsetId}
              options={chipsetOptions}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  chipsetId: value || undefined,
                }))
              }
            />
            <CatalogEnumField
              id="motherboard-form-factor"
              label="Form factor"
              value={draft.formFactor}
              options={MB_FORM_FACTORS}
              onChange={(formFactor) =>
                setDraft((current) => ({ ...current, formFactor }))
              }
            />
            <Field>
              <FieldLabel htmlFor="motherboard-ddr">DDR</FieldLabel>
              <select
                id="motherboard-ddr"
                className={selectClassName}
                value={draft.ddrGeneration ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    ddrGeneration: (event.target.value || undefined) as
                      DdrGeneration | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {DDR_GENERATIONS.map((generation) => (
                  <option key={generation} value={generation}>
                    {generation.replace("Ddr", "DDR")}
                  </option>
                ))}
              </select>
            </Field>
            <CatalogEnumField
              id="motherboard-ram-form-factor"
              label="RAM form factor"
              value={draft.ramFormFactor}
              options={RAM_FORM_FACTORS}
              onChange={(ramFormFactor) =>
                setDraft((current) => ({ ...current, ramFormFactor }))
              }
            />
            <Field>
              <FieldLabel htmlFor="motherboard-wifi">Wi-Fi</FieldLabel>
              <select
                id="motherboard-wifi"
                className={selectClassName}
                value={optionalBooleanValue(draft.wifiEnabled)}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    wifiEnabled:
                      event.target.value === ""
                        ? undefined
                        : event.target.value === "true",
                  }))
                }
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="motherboard-bluetooth">Bluetooth</FieldLabel>
              <select
                id="motherboard-bluetooth"
                className={selectClassName}
                value={optionalBooleanValue(draft.bluetoothEnabled)}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    bluetoothEnabled:
                      event.target.value === ""
                        ? undefined
                        : event.target.value === "true",
                  }))
                }
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="motherboard-ram-slots">RAM slots</FieldLabel>
              <Input
                id="motherboard-ram-slots"
                type="number"
                min={0}
                value={draft.ramSlots ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    ramSlots: toInteger(event.target.value),
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="motherboard-max-memory">
                Max memory (GB)
              </FieldLabel>
              <Input
                id="motherboard-max-memory"
                type="number"
                min={0}
                value={draft.maxMemoryGb ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maxMemoryGb: toInteger(event.target.value),
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="motherboard-max-dimm">
                Max DIMM size (GB)
              </FieldLabel>
              <Input
                id="motherboard-max-dimm"
                type="number"
                min={0}
                value={draft.maxDimmSizeGb ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maxDimmSizeGb: toInteger(event.target.value),
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="motherboard-sata-ports">
                SATA ports
              </FieldLabel>
              <Input
                id="motherboard-sata-ports"
                type="number"
                min={0}
                value={draft.sataPorts ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sataPorts: toInteger(event.target.value),
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="motherboard-fan-connectors">
                Fan connectors
              </FieldLabel>
              <Input
                id="motherboard-fan-connectors"
                type="number"
                min={0}
                value={draft.fanConnectors ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    fanConnectors: toInteger(event.target.value),
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="motherboard-eps-connectors">
                EPS connectors
              </FieldLabel>
              <Input
                id="motherboard-eps-connectors"
                type="number"
                min={0}
                value={draft.epsConnectors ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    epsConnectors: toInteger(event.target.value),
                  }))
                }
              />
            </Field>
            <CatalogRangeField
              id="motherboard-width"
              label="Width (mm)"
              maxAriaLabel="Width max"
              range={draft.widthMm}
              onChange={(widthMm) =>
                setDraft((current) => ({ ...current, widthMm }))
              }
            />
            <CatalogRangeField
              id="motherboard-height"
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
            loadingMessage="Loading motherboards…"
            emptyFilteredMessage="No motherboards match these filters."
            emptyMessage="No motherboards in the catalog yet."
            isAdmin={isAdmin}
            newItemLabel="New Motherboard"
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
            countLabel="motherboards"
            onPageChange={goToPage}
          />
        </div>
      </div>
      {excelImport.importDialog}
    </section>
  );
}
