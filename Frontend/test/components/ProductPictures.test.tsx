import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductPicture } from "@/api/catalog/pictures";

const listProductPictures = vi.fn();
const uploadProductPicture = vi.fn();
const deleteProductPicture = vi.fn();

vi.mock("@/api/catalog/pictures", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/catalog/pictures")>(
      "@/api/catalog/pictures",
    );
  return {
    ...actual,
    listProductPictures: (...args: unknown[]) => listProductPictures(...args),
    uploadProductPicture: (...args: unknown[]) => uploadProductPicture(...args),
    deleteProductPicture: (...args: unknown[]) => deleteProductPicture(...args),
  };
});

import { ProductPictures } from "@/components/catalog/ProductPictures";
import { renderWithQuery } from "../helpers/query";

const picture: ProductPicture = {
  id: "picture-1",
  productType: "Cpu",
  productId: "cpu-1",
};

function renderPictures(isAdmin = false) {
  return renderWithQuery(
    <ProductPictures productType="Cpu" productId="cpu-1" />,
    { isAdmin },
  );
}

describe("ProductPictures", () => {
  beforeEach(() => {
    listProductPictures.mockReset();
    uploadProductPicture.mockReset();
    deleteProductPicture.mockReset();
    listProductPictures.mockResolvedValue([picture]);
    uploadProductPicture.mockResolvedValue(picture);
    deleteProductPicture.mockResolvedValue(undefined);
  });

  it("shows pictures without upload or delete controls for a guest", async () => {
    renderPictures(false);

    expect(await screen.findByRole("img", { name: "Pictures" })).toHaveAttribute(
      "src",
      "/api/catalog/pictures/picture-1/content",
    );
    expect(screen.queryByLabelText("Picture file")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete picture" }),
    ).not.toBeInTheDocument();
  });

  it("lets an admin upload and delete a picture", async () => {
    const user = userEvent.setup();
    renderPictures(true);

    expect(
      await screen.findByRole("button", { name: "Delete picture" }),
    ).toBeInTheDocument();

    const file = new File([new Uint8Array([1, 2, 3])], "cpu.jpg", {
      type: "image/jpeg",
    });
    await user.upload(screen.getByLabelText("Picture file"), file);

    await waitFor(() => {
      expect(uploadProductPicture).toHaveBeenCalledWith("Cpu", "cpu-1", file);
    });

    await user.click(screen.getByRole("button", { name: "Delete picture" }));

    await waitFor(() => {
      expect(deleteProductPicture).toHaveBeenCalledWith("picture-1");
    });
  });
});
