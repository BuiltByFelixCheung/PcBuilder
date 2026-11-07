import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { parseApiError } from "@/api/errors";
import {
  deleteProductPicture,
  productPictureContentUrl,
  productPictureKeys,
  uploadProductPicture,
  type ProductPicture,
  type ProductType,
} from "@/api/catalog/pictures";
import { useAuth } from "@/auth/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductPictures } from "@/hooks/use-product-pictures";
import { ui } from "@/i18n/translate-enum";

export function ProductPictures({
  productType,
  productId,
}: Readonly<{
  productType: ProductType;
  productId: string;
}>) {
  const { isAdmin } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const pictures = useProductPictures(productType, productId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listKey = productPictureKeys.list(productType, productId);

  const upload = useMutation({
    mutationFn: (file: File) => uploadProductPicture(productType, productId, file),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: listKey });
    },
    onError: (error) => setActionError(parseApiError(error).message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProductPicture(id),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: listKey });
    },
    onError: (error) => setActionError(parseApiError(error).message),
  });

  const items = pictures.data ?? [];

  return (
    <section className="product-pictures">
      <div className="catalog-detail-subtitle">
        <h2>{ui.section("pictures")}</h2>
      </div>
      {pictures.isPending ? (
        <p>{ui.empty("loading", { entity: ui.entity("pictures") })}</p>
      ) : null}
      {pictures.isError ? <p>{parseApiError(pictures.error).message}</p> : null}
      {!pictures.isPending && !pictures.isError && items.length === 0 ? (
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
                <img
                  src={productPictureContentUrl(picture.id)}
                  alt={ui.section("pictures")}
                />
              </button>
              {isAdmin ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(picture.id)}
                >
                  {ui.action("deletePicture")}
                </Button>
              ) : null}
            </figure>
          ))}
        </div>
      ) : null}
      {isAdmin ? (
        <div className="product-pictures-upload">
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            aria-label={ui.label("pictureFile")}
            disabled={upload.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) upload.mutate(file);
            }}
          />
          <Button
            type="button"
            disabled={upload.isPending}
            onClick={() => fileInput.current?.click()}
          >
            {upload.isPending
              ? ui.action("uploadingPicture")
              : ui.action("uploadPicture")}
          </Button>
        </div>
      ) : null}
      {actionError ? <p>{actionError}</p> : null}
      <ProductPictureViewer
        pictures={items}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onClose={() => setSelectedId(null)}
      />
    </section>
  );
}

function ProductPictureViewer({
  pictures,
  selectedId,
  onSelect,
  onClose,
}: Readonly<{
  pictures: ProductPicture[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
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
            <img
              src={productPictureContentUrl(selected.id)}
              alt={ui.section("pictures")}
            />
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
