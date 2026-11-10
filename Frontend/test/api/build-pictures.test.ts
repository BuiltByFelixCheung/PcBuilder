import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const remove = vi.fn();

vi.mock("@/api/client", () => ({
  api: {
    post: (...args: unknown[]) => post(...args),
    delete: (...args: unknown[]) => remove(...args),
  },
}));

import {
  BUILD_PICTURE_EDIT_TOKEN_HEADER,
  BUILD_PICTURE_EDIT_TOKEN_STORAGE_KEY,
  rememberBuildPictureEditToken,
} from "@/api/builds/picture-edit-token";
import { deleteBuildPicture, uploadBuildPicture } from "@/api/builds/pictures";

describe("build picture requests", () => {
  beforeEach(() => {
    post.mockReset();
    remove.mockReset();
    localStorage.removeItem(BUILD_PICTURE_EDIT_TOKEN_STORAGE_KEY);
    post.mockResolvedValue({ data: { id: "picture-1", buildId: "build-1" } });
    remove.mockResolvedValue({});
  });

  it("sends the guest token for the build this browser saved", async () => {
    rememberBuildPictureEditToken("build-1", "secret");
    const file = new File(["a"], "build.jpg", { type: "image/jpeg" });

    await uploadBuildPicture("build-1", file);
    await deleteBuildPicture("picture-1", "build-1");

    expect(post).toHaveBeenCalledWith(
      "/builds/build-1/pictures",
      expect.any(FormData),
      { headers: { [BUILD_PICTURE_EDIT_TOKEN_HEADER]: "secret" } },
    );
    expect(remove).toHaveBeenCalledWith("/builds/pictures/picture-1", {
      headers: { [BUILD_PICTURE_EDIT_TOKEN_HEADER]: "secret" },
    });
  });

  it("omits the token when this browser did not save the build", async () => {
    const file = new File(["a"], "build.jpg", { type: "image/jpeg" });

    await uploadBuildPicture("build-2", file);

    expect(post).toHaveBeenCalledWith(
      "/builds/build-2/pictures",
      expect.any(FormData),
      { headers: undefined },
    );
  });
});
