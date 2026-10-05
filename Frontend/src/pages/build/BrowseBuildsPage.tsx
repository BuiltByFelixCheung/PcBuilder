import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors";
import { catalogPagingFromSearch, setPageSearch } from "@/api/catalog/params/list-search";
import { builderViewHref } from "@/builds/types";
import { PageStatus } from "@/components/PageStatus";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePublicBuilds } from "@/hooks/use-public-builds";

const EMPTY_ITEMS: never[] = [];

function pageItems(pageIndex: number, pageCount: number) {
  const current = pageIndex + 1;
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pageCount - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < pageCount - 1) pages.push("ellipsis");
  pages.push(pageCount);
  return pages;
}

export function BrowseBuildPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const request = useMemo(
    () => catalogPagingFromSearch(searchParams),
    [searchParams],
  );
  const query = usePublicBuilds(request);
  const items = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / request.pageSize));
  const isInitialLoading = query.isLoading && !query.data;

  function onPageChange(pageIndex: number) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      setPageSearch(next, pageIndex);
      return next;
    });
  }

  return (
    <section className="catalog-page">
      <h1>Browse Builds</h1>
      <p className="catalog-lead">
        Public PC builds shared by members. Open one to inspect the parts list.
      </p>

      {isInitialLoading ? (
        <PageStatus>Loading builds…</PageStatus>
      ) : null}

      {query.isError ? (
        <PageStatus>{parseApiError(query.error).message}</PageStatus>
      ) : null}

      {!isInitialLoading && !query.isError && items.length === 0 ? (
        <PageStatus>
          No public builds yet.{" "}
          <Link to="/builds/current">Start a build</Link>
        </PageStatus>
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="browse-builds-grid">
            {items.map((build) => (
              <Card key={build.id} className="browse-builds-card">
                <CardHeader>
                  <CardTitle>
                    <Link to={builderViewHref(build.id)}>{build.name}</Link>
                  </CardTitle>
                  <CardDescription>
                    {build.userName ? `${build.userName} · ` : null}
                    {build.description?.trim() || "No description."}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="outline" size="sm">
                    <Link to={builderViewHref(build.id)}>View build</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {pageCount > 1 ? (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    disabled={request.pageIndex === 0}
                    onClick={() => onPageChange(request.pageIndex - 1)}
                  />
                </PaginationItem>
                {pageItems(request.pageIndex, pageCount).map((item, index) => (
                  <PaginationItem
                    key={item === "ellipsis" ? `ellipsis-${index}` : item}
                  >
                    {item === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        isActive={item === request.pageIndex + 1}
                        onClick={() => onPageChange(item - 1)}
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    disabled={request.pageIndex + 1 >= pageCount}
                    onClick={() => onPageChange(request.pageIndex + 1)}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
