import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isMemoryFilterActive,
  type MemoryFilter,
  type MemoryDetail,
} from "@/api/catalog/memories";
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
import { useMemories } from "@/hooks/use-memories";
import {
  memoryListParamsFromSearch,
  memoryListSearchFromParams,
  emptyMemoryFilter,
} from "@/api/catalog/params/memory-list-params";
import { toInteger, toOptionalNumber } from "@/api/helper";
import {
  DDR4_MODULE_SIZE_GB,
  DDR5_MODULE_SIZE_GB,
  DDR4_KIT_SIZE_GB,
  DDR5_KIT_SIZE_GB,
  DDR4_SPEED_MT_S,
  DDR5_SPEED_MT_S,
  DDR_GENERATIONS,
  RAM_FORM_FACTORS,
  RAM_RANKS,
  type DdrGeneration,
  type RamFormFactor,
  type RamRank,
  MODULES_COUNT,
} from "@/api/enums";
import {
  listManufacturersByProductType,
  masterDataKeys,
} from "@/api/master-data";
import { useQuery } from "@tanstack/react-query";

const EMPTY_ITEMS: MemoryDetail[] = [];
const selectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function optionsForDdr<T>(
  ddrGeneration: DdrGeneration | undefined,
  ddr4: readonly T[],
  ddr5: readonly T[],
): readonly T[] {
  if (ddrGeneration === "Ddr4") return ddr4;
  if (ddrGeneration === "Ddr5") return ddr5;
  return [];
}

export function RamListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(
    () => memoryListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<MemoryFilter>(() => params.filter);
  const query = useMemories(params);
  const items = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isMemoryFilterActive(params.filter);

  const moduleSizeOptions = optionsForDdr(
    draft.ddrGeneration,
    DDR4_MODULE_SIZE_GB,
    DDR5_MODULE_SIZE_GB,
  );
  const kitSizeOptions = optionsForDdr(
    draft.ddrGeneration,
    DDR4_KIT_SIZE_GB,
    DDR5_KIT_SIZE_GB,
  );
  const speedOptions = optionsForDdr(
    draft.ddrGeneration,
    DDR4_SPEED_MT_S,
    DDR5_SPEED_MT_S,
  );

  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("ram"),
    queryFn: () => listManufacturersByProductType("ram"),
  });
  const manufacturerOptions = useMemo(
    () =>
      manufacturers.data?.map((manufacturer) => ({
        value: manufacturer.id,
        label: manufacturer.name,
      })) ?? [],
    [manufacturers.data],
  );

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      memoryListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: draft,
      }),
    );
  }

  function clearFilters() {
    setDraft(emptyMemoryFilter);
    setSearchParams(
      memoryListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyMemoryFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      memoryListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>Memory</h1>
      <p className="catalog-lead">
        Browse the catalog, then apply filters when you need a narrower set.
      </p>
      <div className="catalog-layout">
      <form className="catalog-filters" onSubmit={applyFilters}>
        <FieldGroup className="catalog-filter-grid">
          <Field>
            <FieldLabel htmlFor="memory-name">Name</FieldLabel>
            <Input
              id="memory-name"
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
            <FieldLabel htmlFor="memory-manufacturer">Manufacturer</FieldLabel>
            <select
              id="memory-manufacturer"
              className={selectClassName}
              value={draft.manufacturerId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  manufacturerId: event.target.value,
                }))
              }
            >
              <option value="">All</option>
              {manufacturerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="memory-ddr-generation">
              DDR Generation
            </FieldLabel>
            <select
              id="memory-ddr-generation"
              className={selectClassName}
              value={draft.ddrGeneration ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  ddrGeneration: event.target.value as DdrGeneration,
                }))
              }
            >
              <option value="">All</option>
              {DDR_GENERATIONS.map((generation) => (
                <option key={generation} value={generation}>
                  {generation}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="memory-ram-form-factor">
              RAM Form Factor
            </FieldLabel>
            <select
              id="memory-ram-form-factor"
              className={selectClassName}
              value={draft.ramFormFactor ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  ramFormFactor: event.target.value as RamFormFactor,
                }))
              }
            >
              <option value="">All</option>
              {RAM_FORM_FACTORS.map((factor) => (
                <option key={factor} value={factor}>
                  {factor}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="memory-ram-rank">RAM Rank</FieldLabel>
            <select
              id="memory-ram-rank"
              className={selectClassName}
              value={draft.ramRank ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  ramRank: event.target.value as RamRank,
                }))
              }
            >
              <option value="">All</option>
              {RAM_RANKS.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="memory-module-size">Module Size</FieldLabel>
            <select
              id="memory-module-size"
              className={selectClassName}
              value={draft.memorySizePerStickGb ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  memorySizePerStickGb:
                    toInteger(event.target.value) ?? undefined,
                }))
              }
            >
              <option value="">All</option>
              {moduleSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} GB
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="memory-kit-size">Kit Size</FieldLabel>
            <select
              id="memory-kit-size"
              className={selectClassName}
              value={draft.totalMemorySizeGb ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  totalMemorySizeGb: toInteger(event.target.value) ?? undefined,
                }))
              }
            >
              <option value="">All</option>
              {kitSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} GB
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="memory-speed">Speed</FieldLabel>
            <select
              id="memory-speed"
              className={selectClassName}
              value={draft.maxMemorySpeedMts ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  maxMemorySpeedMts: toInteger(event.target.value) ?? undefined,
                }))
              }
            >
              <option value="">All</option>
              {speedOptions.map((speed) => (
                <option key={speed} value={speed}>
                  {speed} MT/s
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="memory-modules-count">
              Modules Count
            </FieldLabel>
            <select
              id="memory-modules-count"
              className={selectClassName}
              value={draft.modulesCount ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  modulesCount: toInteger(event.target.value) ?? undefined,
                }))
              }
            >
              <option value="">All</option>
              {MODULES_COUNT.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="memory-height-min">Height</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="memory-height-min"
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
                id="memory-height-max"
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
      return <PageStatus>Loading memories…</PageStatus>;
    }

    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }

    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No memories match these filters."
            : "No memories in the catalog yet."}
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
              <TableHead>DDR Generation</TableHead>
              <TableHead>RAM Form Factor</TableHead>
              <TableHead>RAM Rank</TableHead>
              <TableHead>Module Size</TableHead>
              <TableHead>Kit Size</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Modules Count</TableHead>
              <TableHead>Height</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link to={`/catalog/memories/${item.id}`}>{item.name}</Link>
                </TableCell>
                <TableCell>{item.manufacturerName}</TableCell>
                <TableCell>{item.ddrGeneration}</TableCell>
                <TableCell>{item.ramFormFactor}</TableCell>
                <TableCell>{item.ramRank}</TableCell>
                <TableCell>{item.memorySizePerStickGb} GB</TableCell>
                <TableCell>{item.totalMemorySizeGb} GB</TableCell>
                <TableCell>{item.maxMemorySpeedMts} MT/s</TableCell>
                <TableCell>{item.modulesCount}</TableCell>
                <TableCell>{item.heightMm} mm</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
