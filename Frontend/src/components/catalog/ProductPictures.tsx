import {
  productPictureContentUrl,
  productPictureKeys,
  deleteProductPicture,
  uploadProductPicture,
  type ProductType,
} from "@/api/catalog/pictures";
import { useAuth } from "@/auth/use-auth";
import {
  PictureGallery,
  usePictureMutations,
} from "@/components/pictures/PictureGallery";
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
  const pictures = useProductPictures(productType, productId);
  const actions = usePictureMutations(
    productPictureKeys.list(productType, productId),
    (file) => uploadProductPicture(productType, productId, file),
    deleteProductPicture,
  );

  return (
    <PictureGallery
      query={pictures}
      canEdit={isAdmin}
      uploadPending={actions.upload.isPending}
      deletePending={actions.remove.isPending}
      actionError={actions.actionError}
      onUpload={(file) => actions.upload.mutate(file)}
      onDelete={(id) => actions.remove.mutate(id)}
      renderImage={(id) => (
        <img src={productPictureContentUrl(id)} alt={ui.section("pictures")} />
      )}
    />
  );
}
