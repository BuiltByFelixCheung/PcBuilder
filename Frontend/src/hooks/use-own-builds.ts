import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listMyBuilds, pcBuildKeys } from "@/api/builds";
import type { PagedRequest } from "@/api/paging";

export function useOwnBuilds(request: PagedRequest) {
  return useQuery({
    queryKey: pcBuildKeys.myList(request),
    queryFn: () => listMyBuilds(request),
    placeholderData: keepPreviousData,
  });
}
