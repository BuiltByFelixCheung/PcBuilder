import { useEffect, useState } from "react";
import { api } from "@/api/client";
import {
  buildPictureContentPath,
  buildPictureKeys,
  deleteBuildPicture,
  uploadBuildPicture,
} from "@/api/builds/pictures";
import {
  PictureGallery,
  usePictureMutations,
} from "@/components/pictures/PictureGallery";
import { useBuildPictures } from "@/hooks/use-build-pictures";
import { ui } from "@/i18n/translate-enum";

export function BuildPictures({
  buildId,
  canEdit,
}: Readonly<{
  buildId: string;
  canEdit: boolean;
}>) {
  const pictures = useBuildPictures(buildId);
  const actions = usePictureMutations(
    buildPictureKeys.list(buildId),
    (file) => uploadBuildPicture(buildId, file),
    (id) => deleteBuildPicture(id, buildId),
  );

  return (
    <PictureGallery
      query={pictures}
      canEdit={canEdit}
      uploadPending={actions.upload.isPending}
      deletePending={actions.remove.isPending}
      actionError={actions.actionError}
      onUpload={(file) => actions.upload.mutate(file)}
      onDelete={(id) => actions.remove.mutate(id)}
      renderImage={(id) => <BuildPictureImage id={id} />}
    />
  );
}

function BuildPictureImage({ id }: Readonly<{ id: string }>) {
  const src = useBuildPictureObjectUrl(id);
  if (!src) return null;
  return <img src={src} alt={ui.section("pictures")} />;
}

function useBuildPictureObjectUrl(id: string) {
  const [picture, setPicture] = useState<{
    id: string;
    src: string;
  } | null>(null);

  if (picture !== null && picture.id !== id) {
    setPicture(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;
    let active = true;

    api
      .get<Blob>(buildPictureContentPath(id), {
        responseType: "blob",
        signal: controller.signal,
      })
      .then((response) => {
        const nextUrl = URL.createObjectURL(response.data);
        if (!active) {
          URL.revokeObjectURL(nextUrl);
          return;
        }
        objectUrl = nextUrl;
        setPicture({ id, src: nextUrl });
      })
      .catch(() => {
        if (active) setPicture(null);
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return picture?.id === id ? picture.src : null;
}
