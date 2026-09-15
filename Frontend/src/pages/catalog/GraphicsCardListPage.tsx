import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import {
  isGraphicsCardFilterActive,
  type GraphicsCardFilter,
  type GraphicsCardListItem,
} from "@/api/catalog/graphics-cards";
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
import { useGraphicsCardFilterOptions } from "@/hooks/use-graphics-card-filter-options";
import { useGraphicsCards } from "@/hooks/use-graphics-cards";
import {
  graphicsCardListParamsFromSearch,
  graphicsCardListSearchFromParams,
  emptyGraphicsCardFilter,
} from "@/api/catalog/params/graphics-card-list-params";
import { toInteger } from "@/api/helper";
import {
  PCIE_GENERATIONS,
  PCIE_SLOTS_USED,
  VIDEO_MEMORY_GB,
  type PcieGeneration,
} from "@/api/enums";

const EMPTY_ITEMS: GraphicsCardListItem[] = [];
const selectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function GraphicsCardListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gpuManufacturerId, setGpuManufacturerId] = useState<
    string | undefined
  >(undefined);
  const [gpuSeriesId, setGpuSeriesId] = useState<string | undefined>(undefined);

  const params = useMemo(
    () => graphicsCardListParamsFromSearch(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState<GraphicsCardFilter>(() => params.filter);
  const { manufacturers, gpus, gpuSeries, gpuManufacturers } =
    useGraphicsCardFilterOptions();
  const query = useGraphicsCards(params);
  const items = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.totalCount ?? 0;
  const pageIndex = params.pageIndex;
  const pageSize = params.pageSize;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const filtering = isGraphicsCardFilterActive(params.filter);
  const gpuSeriesOptions = gpuManufacturerId
    ? gpuSeries.filter((item) => item.manufacturerId === gpuManufacturerId)
    : gpuSeries;
  const gpuOptions = gpus.filter((item) => {
    if (gpuManufacturerId && item.manufacturerId !== gpuManufacturerId)
      return false;
    if (gpuSeriesId && item.gpuSeriesId !== gpuSeriesId) return false;
    return true;
  });

  function applyFilters(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchParams(
      graphicsCardListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: draft,
      }),
    );
  }

  function clearFilters() {
    setDraft(emptyGraphicsCardFilter);
    setGpuManufacturerId(undefined);
    setGpuSeriesId(undefined);
    setSearchParams(
      graphicsCardListSearchFromParams({
        ...params,
        pageIndex: 0,
        filter: emptyGraphicsCardFilter,
      }),
    );
  }

  function goToPage(nextIndex: number) {
    setSearchParams(
      graphicsCardListSearchFromParams({ ...params, pageIndex: nextIndex }),
    );
  }

  return (
    <section className="catalog-page">
      <h1>Graphics Cards</h1>
      <p className="catalog-lead">
        Browse the catalog, then apply filters when you need a narrower set.
      </p>

      <div className="catalog-layout">
      <form className="catalog-filters" onSubmit={applyFilters}>
        <FieldGroup className="catalog-filter-grid">
          <Field>
            <FieldLabel htmlFor="graphics-card-name">Name</FieldLabel>
            <Input
              id="graphics-card-name"
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
            <FieldLabel htmlFor="graphics-card-manufacturer">
              Manufacturer
            </FieldLabel>
            <select
              id="graphics-card-manufacturer"
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
            <FieldLabel htmlFor="graphics-card-gpu-manufacturer">
              GPU Manufacturer
            </FieldLabel>
            <select
              id="graphics-card-gpu-manufacturer"
              className={selectClassName}
              value={gpuManufacturerId ?? ""}
              onChange={(event) => {
                setGpuManufacturerId(event.target.value || undefined);
                setGpuSeriesId(undefined);
                setDraft((current) => ({ ...current, gpuId: undefined }));
              }}
            >
              <option value="">Any</option>
              {gpuManufacturers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="graphics-card-gpu-series">
              GPU Series
            </FieldLabel>
            <select
              id="graphics-card-gpu-series"
              className={selectClassName}
              value={gpuSeriesId ?? ""}
              onChange={(event) => {
                setGpuSeriesId(event.target.value || undefined);
                setDraft((current) => ({ ...current, gpuId: undefined }));
              }}
            >
              <option value="">Any</option>
              {gpuSeriesOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="graphics-card-gpu-id">GPU</FieldLabel>
            <select
              id="graphics-card-gpu-id"
              className={selectClassName}
              value={draft.gpuId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  gpuId: event.target.value || undefined,
                }))
              }
            >
              <option value="">Any</option>
              {gpuOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="graphics-card-video-memory">
              Video Memory
            </FieldLabel>
            <select
              id="graphics-card-video-memory"
              className={selectClassName}
              value={draft.videoMemoryGb ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  videoMemoryGb: toInteger(event.target.value) ?? undefined,
                }))
              }
            >
              <option value="">Any</option>
              {VIDEO_MEMORY_GB.map((memory) => (
                <option key={memory} value={memory}>
                  {memory} GB
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="graphics-card-pcie-slots-used">
              Pcie Slots Used
            </FieldLabel>
            <select
              id="graphics-card-pcie-slots-used"
              className={selectClassName}
              value={draft.pcieSlotsUsed ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  pcieSlotsUsed: toInteger(event.target.value) ?? undefined,
                }))
              }
            >
              <option value="">Any</option>
              {PCIE_SLOTS_USED.map((slots) => (
                <option key={slots} value={slots}>
                  {slots}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="graphics-card-pcie-generation">
              PCIe Generation
            </FieldLabel>
            <select
              id="graphics-card-pcie-generation"
              className={selectClassName}
              value={draft.pcieGeneration ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  pcieGeneration: (event.target.value || undefined) as
                    | PcieGeneration
                    | undefined,
                }))
              }
            >
              <option value="">Any</option>
              {PCIE_GENERATIONS.map((generation) => (
                <option key={generation} value={generation}>
                  {generation.replace("Gen", "PCIe ")}
                </option>
              ))}
            </select>
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
      return <PageStatus>Loading graphics cards…</PageStatus>;
    }

    if (query.isError) {
      return <PageStatus>{parseApiError(query.error).message}</PageStatus>;
    }

    if (items.length === 0) {
      return (
        <PageStatus>
          {filtering
            ? "No graphics cards match these filters."
            : "No graphics cards in the catalog yet."}
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
              <TableHead>GPU</TableHead>
              <TableHead>Video Memory</TableHead>
              <TableHead>Pcie Slots Used</TableHead>
              <TableHead>Pcie Generation</TableHead>
              <TableHead>Is Low Profile</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Width</TableHead>
              <TableHead>Height</TableHead>
              <TableHead>Power Consumption</TableHead>
              <TableHead>Power Connector Type</TableHead>
              <TableHead>Power Connector Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link to={`/catalog/graphics-cards/${item.id}`}>
                    {item.name}
                  </Link>
                </TableCell>
                <TableCell>{item.manufacturerName}</TableCell>
                <TableCell>{item.gpuName}</TableCell>
                <TableCell>{item.videoMemoryGb} GB</TableCell>
                <TableCell>{item.pcieSlotsUsed}</TableCell>
                <TableCell>{item.pcieGeneration}</TableCell>
                <TableCell>{item.isLowProfile ? "Yes" : "No"}</TableCell>
                <TableCell>{item.lengthMm} mm</TableCell>
                <TableCell>{item.widthMm} mm</TableCell>
                <TableCell>{item.heightMm} mm</TableCell>
                <TableCell>{item.powerConsumptionWatts} W</TableCell>
                <TableCell>{item.powerConnectorType}</TableCell>
                <TableCell>{item.powerConnectorCount}</TableCell>
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
