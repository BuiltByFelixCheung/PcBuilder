import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import { parseApiError } from "@/api/errors";
import { deletePcBuild, deletePcBuilds, pcBuildKeys } from "@/api/builds";
import {
  catalogPagingFromSearch,
  setPageSearch,
} from "@/api/catalog/params/list-search";
import { builderHref } from "@/builds/types";
import { PageStatus } from "@/components/PageStatus";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardAction,
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
import { useOwnBuilds } from "@/hooks/use-own-builds";
import { selectedVisibleIds, useBulkDelete } from "@/hooks/use-bulk-delete";

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

export function ManageBuildsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const request = useMemo(
    () => catalogPagingFromSearch(searchParams),
    [searchParams],
  );
  const query = useOwnBuilds(request);
  const queryClient = useQueryClient();
  const items = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / request.pageSize));
  const isInitialLoading = query.isLoading && !query.data;
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const bulkDelete = useBulkDelete({
    items,
    rowSelection,
    setRowSelection,
    queryKey: pcBuildKeys.lists(),
    singular: "build",
    plural: "builds",
    deleteByIds: (ids) => deletePcBuilds({ ids }),
  });
  const hasSelection = selectedVisibleIds(rowSelection, items).length > 0;
  const deleteMutation = useMutation({
    mutationFn: deletePcBuild,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pcBuildKeys.lists() });
    },
  });

  function onPageChange(pageIndex: number) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      setPageSearch(next, pageIndex);
      return next;
    });
  }

  return (
    <section className="catalog-page">
      <h1>My Builds</h1>
      <p className="catalog-lead">
        Your saved PC builds. Edit or delete them as needed.
      </p>

      {isInitialLoading ? <PageStatus>Loading builds…</PageStatus> : null}

      {query.isError ? (
        <PageStatus>{parseApiError(query.error).message}</PageStatus>
      ) : null}

      {!isInitialLoading && !query.isError && items.length === 0 ? (
        <PageStatus>
          No public builds yet. <Link to="/builds/current">Start a build</Link>
        </PageStatus>
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasSelection || bulkDelete.isDeleting}
              onClick={() => void bulkDelete.onDeleteSelected()}
            >
              {bulkDelete.isDeleting ? "Deleting…" : "Delete selected"}
            </Button>
            {bulkDelete.deleteError ? (
              <p className="text-sm text-destructive">{bulkDelete.deleteError}</p>
            ) : null}
          </div>
          <div className="browse-builds-grid">
            {items.map((build) => (
              <Card key={build.id} className="browse-builds-card">
                <CardHeader>
                  <CardTitle>
                    <Link to={builderHref(build.id)}>{build.name}</Link>
                  </CardTitle>
                  <CardDescription>
                    {build.description?.trim() || "No description."}
                  </CardDescription>
                  <CardAction>
                    <Checkbox
                      aria-label={`Select ${build.name}`}
                      checked={Boolean(rowSelection[build.id])}
                      onCheckedChange={(checked) =>
                        setRowSelection((current) => {
                          if (checked === true) {
                            return { ...current, [build.id]: true };
                          }
                          const next = { ...current };
                          delete next[build.id];
                          return next;
                        })
                      }
                    />
                  </CardAction>
                </CardHeader>
                <CardFooter className="gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={builderHref(build.id)}>Edit build</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(build.id)}
                  >
                    Delete build
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
