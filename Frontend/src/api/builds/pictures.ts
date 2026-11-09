import { api } from "../client";

export type BuildPicture = {
  id: string;
  buildId: string;
};

export const buildPictureKeys = {
  list: (buildId: string) => ["build-pictures", buildId] as const,
};

export function buildPictureContentPath(id: string) {
  return `/builds/pictures/${id}/content`;
}

export async function listBuildPictures(buildId: string) {
  const { data } = await api.get<BuildPicture[]>(`/builds/${buildId}/pictures`);
  return data;
}

export async function uploadBuildPicture(buildId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<BuildPicture>(
    `/builds/${buildId}/pictures`,
    body,
  );
  return data;
}

export async function deleteBuildPicture(id: string) {
  await api.delete(`/builds/pictures/${id}`);
}
