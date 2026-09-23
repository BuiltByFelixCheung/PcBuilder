import { hasCompleteRange, type RangeFilter } from "../../paging";
import { setSearchValue, toInteger } from "../../helper";

export const CATALOG_PAGE_SIZE = 10;

export function catalogPagingFromSearch(search: URLSearchParams) {
  return {
    pageIndex: Math.max(0, toInteger(search.get("page")) ?? 0),
    pageSize: CATALOG_PAGE_SIZE,
    sortBy: "name" as const,
    sortDirection: "asc" as const,
  };
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
