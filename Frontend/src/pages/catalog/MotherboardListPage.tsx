import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isMotherboardFilterActive,
  type MotherboardFilter,
  type MotherboardListItem,
} from "@/api/catalog/motherboards";
import { PageStatus } from "@/components/PageStatus.tsx";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMotherboardFilterOptions } from "@/hooks/use-motherboard-filter-options.ts";
import { useMotherboards } from "@/hooks/use-motherboards.ts";
import {
  emptyMotherboardFilter,
  motherboardListParamsFromSearch,
  motherboardListSearchFromParams,
} from "@/api/catalog/params/motherboard-list-params";
import { toInteger, toOptionalNumber } from "@/api/helper";
import {
  DDR_GENERATIONS,
  MB_FORM_FACTORS,
  RAM_FORM_FACTORS,
  type DdrGeneration,
  type MbFormFactor,
  type RamFormFactor,
} from "@/api/enums";

const EMPTY_ITEMS: MotherboardListItem[] = [];
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
  const items = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isMotherboardFilterActive(params.filter);
  const chipsetOptions = draft.socketId
    ? chipsets.filter((item) => item.socketId === draft.socketId)
    : chipsets;

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
            <Field>
              <FieldLabel htmlFor="motherboard-name">Name</FieldLabel>
              <Input
                id="motherboard-name"
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
              <FieldLabel htmlFor="motherboard-manufacturer">
                Manufacturer
              </FieldLabel>
              <select
                id="motherboard-manufacturer"
                className={selectClassName}
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
            <Field>
              <FieldLabel htmlFor="motherboard-chipset">Chipset</FieldLabel>
              <select
                id="motherboard-chipset"
                className={selectClassName}
                value={draft.chipsetId ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    chipsetId: event.target.value || undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {chipsetOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="motherboard-form-factor">
                Form factor
              </FieldLabel>
              <select
                id="motherboard-form-factor"
                className={selectClassName}
                value={draft.formFactor ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    formFactor: (event.target.value ||
                      undefined) as MbFormFactor | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {MB_FORM_FACTORS.map((formFactor) => (
                  <option key={formFactor} value={formFactor}>
                    {formFactor}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="motherboard-ddr">DDR</FieldLabel>
              <select
                id="motherboard-ddr"
                className={selectClassName}
                value={draft.ddrGeneration ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    ddrGeneration: (event.target.value ||
                      undefined) as DdrGeneration | undefined,
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
            <Field>
              <FieldLabel htmlFor="motherboard-ram-form-factor">
                RAM form factor
              </FieldLabel>
              <select
                id="motherboard-ram-form-factor"
                className={selectClassName}
                value={draft.ramFormFactor ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    ramFormFactor: (event.target.value ||
                      undefined) as RamFormFactor | undefined,
                  }))
                }
              >
                <option value="">Any</option>
                {RAM_FORM_FACTORS.map((formFactor) => (
                  <option key={formFactor} value={formFactor}>
                    {formFactor}
                  </option>
                ))}
              </select>
            </Field>
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
              <FieldLabel htmlFor="motherboard-width-min">Width (mm)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="motherboard-width-min"
                  type="number"
                  min={0}
                  placeholder="Min"
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
                  id="motherboard-width-max"
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
              <FieldLabel htmlFor="motherboard-height-min">
                Height (mm)
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="motherboard-height-min"
                  type="number"
                  min={0}
                  placeholder="Min"
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
                  id="motherboard-height-max"
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
      return <PageStatus>Loading motherboards…</PageStatus>;
    }

    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }

    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No motherboards match these filters."
            : "No motherboards in the catalog yet."}
        </PageStatus>
      );
    }

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Socket</TableHead>
              <TableHead>Chipset</TableHead>
              <TableHead>Form factor</TableHead>
              <TableHead>DDR</TableHead>
              <TableHead>RAM slots</TableHead>
              <TableHead>Wi-Fi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link to={`/catalog/motherboards/${item.id}`}>{item.name}</Link>
                </TableCell>
                <TableCell>{item.manufacturerName}</TableCell>
                <TableCell>{item.socketName}</TableCell>
                <TableCell>{item.chipsetName}</TableCell>
                <TableCell>{item.formFactor}</TableCell>
                <TableCell>{item.ddrGeneration.replace("Ddr", "DDR")}</TableCell>
                <TableCell>{item.ramSlots}</TableCell>
                <TableCell>{item.wifiEnabled ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="catalog-pagination">
          <p>
            Page {pageIndex + 1} of {pageCount} ({totalCount} motherboards)
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
