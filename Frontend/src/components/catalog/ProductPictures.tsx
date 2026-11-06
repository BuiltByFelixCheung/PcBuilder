import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors";
import {
  deleteProductPicture,
  productPictureContentUrl,
  productPictureKeys,
  uploadProductPicture,
  type ProductType,
} from "@/api/catalog/pictures";
import { useAuth } from "@/auth/use-auth";
import { Button } from "@/components/ui/button";
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
              <img
                src={productPictureContentUrl(picture.id)}
                alt={ui.section("pictures")}
              />
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
    </section>
  );
}
