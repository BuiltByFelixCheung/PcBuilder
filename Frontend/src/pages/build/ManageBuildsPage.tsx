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
import { ListPagination } from "@/components/ListPagination";
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
import { useOwnBuilds } from "@/hooks/use-own-builds";
import { selectedVisibleIds, useBulkDelete } from "@/hooks/use-bulk-delete";

const EMPTY_ITEMS: never[] = [];

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

          <ListPagination
            pageIndex={request.pageIndex}
            pageCount={pageCount}
            onPageChange={onPageChange}
          />
        </>
      ) : null}
    </section>
  );
}
