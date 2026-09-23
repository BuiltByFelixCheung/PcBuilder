import { useQuery } from "@tanstack/react-query";
import {
  checkPcBuildCompatibility,
  pcBuildKeys,
  type PcBuildDraft,
} from "@/api/builds";

export function usePcBuildCompatibility(draft: PcBuildDraft, enabled: boolean) {
  return useQuery({
    queryKey: pcBuildKeys.compatibility(draft),
    queryFn: () => checkPcBuildCompatibility(draft),
    enabled,
    refetchOnMount: "always",
  });
}
