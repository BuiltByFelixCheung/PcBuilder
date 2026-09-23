import { useQuery } from "@tanstack/react-query";
import { getBuildById, pcBuildKeys } from "@/api/builds";

export function usePcBuildDetail(id: string | undefined) {
  return useQuery({
    queryKey: pcBuildKeys.detail(id ?? ""),
    queryFn: () => getBuildById(id!),
    enabled: Boolean(id),
  });
}
