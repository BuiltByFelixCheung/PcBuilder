import { api } from "../client";
import {
  BUILD_PICTURE_EDIT_TOKEN_HEADER,
  buildPictureEditToken,
} from "./picture-edit-token";

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
    { headers: pictureEditHeaders(buildId) },
  );
  return data;
}

export async function deleteBuildPicture(id: string, buildId: string) {
  await api.delete(`/builds/pictures/${id}`, {
    headers: pictureEditHeaders(buildId),
  });
}

function pictureEditHeaders(
  buildId: string,
): { [BUILD_PICTURE_EDIT_TOKEN_HEADER]: string } | undefined {
  const token = buildPictureEditToken(buildId);
  return token
    ? { [BUILD_PICTURE_EDIT_TOKEN_HEADER]: token }
    : undefined;
}
