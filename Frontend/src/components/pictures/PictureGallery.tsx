import { useRef, useState, type ReactNode } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { parseApiError } from "@/api/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ui } from "@/i18n/translate-enum";

type PictureQuery = {
  data?: { id: string }[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
};

export function usePictureMutations(
  listKey: QueryKey,
  uploadFile: (file: File) => Promise<unknown>,
  deleteFile: (id: string) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: (file: File) => uploadFile(file),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: listKey });
    },
    onError: (error) => setActionError(parseApiError(error).message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFile(id),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: listKey });
    },
    onError: (error) => setActionError(parseApiError(error).message),
  });

  return { actionError, upload, remove };
}

export function PictureGallery({
  query,
  canEdit,
  uploadPending,
  deletePending,
  actionError,
  onUpload,
  onDelete,
  renderImage,
}: Readonly<{
  query: PictureQuery;
  canEdit: boolean;
  uploadPending: boolean;
  deletePending: boolean;
  actionError: string | null;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  renderImage: (id: string) => ReactNode;
}>) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = query.data ?? [];

  return (
    <section className="product-pictures">
      <div className="catalog-detail-subtitle">
        <h2>{ui.section("pictures")}</h2>
      </div>
      {query.isPending ? (
        <p>{ui.empty("loading", { entity: ui.entity("pictures") })}</p>
      ) : null}
      {query.isError ? <p>{parseApiError(query.error).message}</p> : null}
      {!query.isPending && !query.isError && items.length === 0 ? (
        <p className="catalog-empty">
          {ui.empty("noneYet", { entity: ui.entity("pictures") })}
        </p>
      ) : null}
      {items.length > 0 ? (
        <div className="product-pictures-grid">
          {items.map((picture) => (
            <figure className="product-picture" key={picture.id}>
              <button
                type="button"
                className="product-picture-open"
                aria-label={ui.action("viewPicture")}
                onClick={() => setSelectedId(picture.id)}
              >
                {renderImage(picture.id)}
              </button>
              {canEdit ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deletePending}
                  onClick={() => onDelete(picture.id)}
                >
                  {ui.action("deletePicture")}
                </Button>
              ) : null}
            </figure>
          ))}
        </div>
      ) : null}
      {canEdit ? (
        <div className="product-pictures-upload">
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            aria-label={ui.label("pictureFile")}
            disabled={uploadPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onUpload(file);
            }}
          />
          <Button
            type="button"
            disabled={uploadPending}
            onClick={() => fileInput.current?.click()}
          >
            {uploadPending
              ? ui.action("uploadingPicture")
              : ui.action("uploadPicture")}
          </Button>
        </div>
      ) : null}
      {actionError ? <p>{actionError}</p> : null}
      <PictureViewer
        pictures={items}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onClose={() => setSelectedId(null)}
        renderImage={renderImage}
      />
    </section>
  );
}

function PictureViewer({
  pictures,
  selectedId,
  onSelect,
  onClose,
  renderImage,
}: Readonly<{
  pictures: { id: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  renderImage: (id: string) => ReactNode;
}>) {
  const selectedIndex = pictures.findIndex((picture) => picture.id === selectedId);
  const selected = selectedIndex >= 0 ? pictures[selectedIndex] : null;
  const hasNeighbors = pictures.length > 1;

  function showOffset(offset: number) {
    if (!hasNeighbors || selectedIndex < 0) return;
    const next = (selectedIndex + offset + pictures.length) % pictures.length;
    onSelect(pictures[next].id);
  }

  return (
    <Dialog
      open={selected !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-3 overflow-hidden sm:max-w-4xl"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            showOffset(-1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            showOffset(1);
          }
        }}
      >
        <DialogHeader className="pr-8">
          <DialogTitle>{ui.section("pictures")}</DialogTitle>
        </DialogHeader>
        {selected ? (
          <div className="product-picture-viewer">
            {hasNeighbors ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={ui.action("previous")}
                onClick={() => showOffset(-1)}
              >
                <ChevronLeftIcon />
              </Button>
            ) : null}
            {renderImage(selected.id)}
            {hasNeighbors ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={ui.action("next")}
                onClick={() => showOffset(1)}
              >
                <ChevronRightIcon />
              </Button>
            ) : null}
          </div>
        ) : null}
        {hasNeighbors && selected ? (
          <p className="text-center text-muted-foreground">
            {selectedIndex + 1} / {pictures.length}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
