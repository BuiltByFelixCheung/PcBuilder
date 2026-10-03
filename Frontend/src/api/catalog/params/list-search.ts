import { hasCompleteRange, type RangeFilter } from "../../paging";
import { setSearchValue, toInteger } from "../../helper";

export const CATALOG_PAGE_SIZE = 10;

export function catalogSortFromSearch(search: URLSearchParams) {
  const sortBy = search.get("sort")?.trim() || "name";
  return {
    sortBy,
    sortDirection: search.get("dir") === "desc" ? ("desc" as const) : ("asc" as const),
  };
}

export function catalogPagingFromSearch(search: URLSearchParams) {
  return {
    pageIndex: Math.max(0, toInteger(search.get("page")) ?? 0),
    pageSize: CATALOG_PAGE_SIZE,
    ...catalogSortFromSearch(search),
  };
}

export function setCatalogSortSearch(
  search: URLSearchParams,
  params: { sortBy?: string; sortDirection?: "asc" | "desc" },
) {
  const sortBy = params.sortBy?.trim() || "name";
  const descending = params.sortDirection === "desc";
  if (sortBy === "name" && !descending) return;
  search.set("sort", sortBy);
  if (descending) search.set("dir", "desc");
}

export function setSearchRange(
  search: URLSearchParams,
  range: RangeFilter | undefined,
  minKey: string,
  maxKey: string,
) {
  if (!hasCompleteRange(range)) return;
  search.set(minKey, String(range.min));
  search.set(maxKey, String(range.max));
}

export function setPageSearch(search: URLSearchParams, pageIndex: number) {
  setSearchValue(search, "page", pageIndex > 0 ? pageIndex : undefined);
}
