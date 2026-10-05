import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listPublicBuilds, pcBuildKeys } from "@/api/builds";
import type { PagedRequest } from "@/api/paging";

export function usePublicBuilds(request: PagedRequest) {
  return useQuery({
    queryKey: pcBuildKeys.publicList(request),
    queryFn: () => listPublicBuilds(request),
    placeholderData: keepPreviousData,
  });
}
