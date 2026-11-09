import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BuildPicture } from "@/api/builds/pictures";

const listBuildPictures = vi.fn();
const uploadBuildPicture = vi.fn();
const deleteBuildPicture = vi.fn();
const apiGet = vi.fn();

vi.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
  },
}));

vi.mock("@/api/builds/pictures", async () => {
  const actual = await vi.importActual<typeof import("@/api/builds/pictures")>(
    "@/api/builds/pictures",
  );
  return {
    ...actual,
    listBuildPictures: (...args: unknown[]) => listBuildPictures(...args),
    uploadBuildPicture: (...args: unknown[]) => uploadBuildPicture(...args),
    deleteBuildPicture: (...args: unknown[]) => deleteBuildPicture(...args),
  };
});

import { BuildPictures } from "@/components/build/BuildPictures";
import { renderWithQuery } from "../helpers/query";

const picture: BuildPicture = {
  id: "picture-1",
  buildId: "build-1",
};

function renderPictures(canEdit = false) {
  return renderWithQuery(
    <BuildPictures buildId="build-1" canEdit={canEdit} />,
  );
}

describe("BuildPictures", () => {
  beforeEach(() => {
    listBuildPictures.mockReset();
    uploadBuildPicture.mockReset();
    deleteBuildPicture.mockReset();
    apiGet.mockReset();
    listBuildPictures.mockResolvedValue([picture]);
    uploadBuildPicture.mockResolvedValue(picture);
    deleteBuildPicture.mockResolvedValue(undefined);
    apiGet.mockResolvedValue({
      data: new Blob([Uint8Array.from([1, 2, 3])], { type: "image/jpeg" }),
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:picture");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("shows pictures without upload or delete controls for a visitor", async () => {
    renderPictures(false);

    expect(await screen.findByRole("img", { name: "Pictures" })).toHaveAttribute(
      "src",
      "blob:picture",
    );
    expect(apiGet).toHaveBeenCalledWith(
      "/builds/pictures/picture-1/content",
      expect.objectContaining({ responseType: "blob" }),
    );
    expect(screen.queryByLabelText("Picture file")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete picture" }),
    ).not.toBeInTheDocument();
  });

  it("lets the owner upload and delete a picture", async () => {
    const user = userEvent.setup();
    renderPictures(true);

    expect(
      await screen.findByRole("button", { name: "Delete picture" }),
    ).toBeInTheDocument();

    const file = new File([new Uint8Array([1, 2, 3])], "build.jpg", {
      type: "image/jpeg",
    });
    await user.upload(screen.getByLabelText("Picture file"), file);

    await waitFor(() => {
      expect(uploadBuildPicture).toHaveBeenCalledWith("build-1", file);
    });

    await user.click(screen.getByRole("button", { name: "Delete picture" }));

    await waitFor(() => {
      expect(deleteBuildPicture).toHaveBeenCalledWith("picture-1");
    });
  });

  it("opens an enlarged picture and moves to the next one", async () => {
    listBuildPictures.mockResolvedValue([
      picture,
      { ...picture, id: "picture-2" },
    ]);
    const user = userEvent.setup();
    renderPictures(false);

    const [first] = await screen.findAllByRole("button", { name: "View picture" });
    await user.click(first);

    const dialog = await screen.findByRole("dialog", { name: "Pictures" });
    expect(within(dialog).getAllByRole("img", { name: "Pictures" }).length).toBeGreaterThan(0);
    await user.click(within(dialog).getByRole("button", { name: "Next" }));
    expect(within(dialog).getByText("2 / 2")).toBeInTheDocument();
  });
});
