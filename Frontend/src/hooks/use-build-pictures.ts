import { useQuery } from "@tanstack/react-query";
import { buildPictureKeys, listBuildPictures } from "@/api/builds/pictures";

export function useBuildPictures(buildId: string) {
  return useQuery({
    queryKey: buildPictureKeys.list(buildId),
    queryFn: () => listBuildPictures(buildId),
    enabled: Boolean(buildId),
  });
}
