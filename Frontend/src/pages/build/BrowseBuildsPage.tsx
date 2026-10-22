import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { parseApiError } from "@/api/errors";
import { catalogPagingFromSearch, setPageSearch } from "@/api/catalog/params/list-search";
import { builderViewHref } from "@/builds/types";
import { ListPagination } from "@/components/ListPagination";
import { PageStatus } from "@/components/PageStatus";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePublicBuilds } from "@/hooks/use-public-builds";
import { ui } from "@/i18n/translate-enum";

const EMPTY_ITEMS: never[] = [];

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
      <h1>{ui.page("browseBuilds")}</h1>
      <p className="catalog-lead">{ui.message("browseBuildsLead")}</p>

      {isInitialLoading ? (
        <PageStatus>{ui.empty("loading", { entity: ui.entity("builds") })}</PageStatus>
      ) : null}

      {query.isError ? (
        <PageStatus>{parseApiError(query.error).message}</PageStatus>
      ) : null}

      {!isInitialLoading && !query.isError && items.length === 0 ? (
        <PageStatus>
          {ui.empty("noPublicBuildsStart")}{" "}
          <Link to="/builds/current">{ui.action("startABuild")}</Link>
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
                    {build.description?.trim() || ui.label("noDescription")}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="outline" size="sm">
                    <Link to={builderViewHref(build.id)}>{ui.action("viewBuild")}</Link>
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
