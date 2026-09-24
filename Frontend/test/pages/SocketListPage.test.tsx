import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SocketOption } from "@/api/master-data";

const listSockets = vi.fn();
const deleteSockets = vi.fn();
const updateSockets = vi.fn();

vi.mock("@/api/master-data", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/master-data")>(
      "@/api/master-data",
    );
  return {
    ...actual,
    listSockets: () => listSockets(),
    deleteSockets: (...args: unknown[]) => deleteSockets(...args),
    updateSockets: (...args: unknown[]) => updateSockets(...args),
  };
});

import { SocketListPage } from "@/pages/master-data/sockets/SocketListPage.tsx";
import { renderWithQuery } from "../helpers/query.tsx";

const am5: SocketOption = {
  id: "am5",
  name: "AM5",
  manufacturerId: "amd",
  manufacturerName: "AMD",
};
const lga1851: SocketOption = {
  id: "lga1851",
  name: "LGA1851",
  manufacturerId: "intel",
  manufacturerName: "Intel",
};

describe("SocketListPage bulk delete", () => {
  beforeEach(() => {
    listSockets.mockReset().mockResolvedValue([am5, lga1851]);
    deleteSockets.mockReset().mockResolvedValue(undefined);
    updateSockets.mockReset().mockResolvedValue([am5]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("deletes the selected sockets and clears the selection", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SocketListPage />);

    const checkboxes = await screen.findAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Delete Selected" }));

    await waitFor(() => {
      expect(deleteSockets).toHaveBeenCalledWith({ ids: ["am5"] });
    });
    expect(window.confirm).toHaveBeenCalledWith("Delete 1 socket?");
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("leaves the selection in place when delete is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderWithQuery(<SocketListPage />);

    const checkboxes = await screen.findAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Delete Selected" }));

    expect(deleteSockets).not.toHaveBeenCalled();
    expect(checkboxes[1]).toBeChecked();
  });

  it("shows the API error and keeps the selection", async () => {
    deleteSockets.mockRejectedValue(new Error("nope"));
    const user = userEvent.setup();
    renderWithQuery(<SocketListPage />);

    const checkboxes = await screen.findAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Delete Selected" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Something went wrong. Try again.");
    expect(checkboxes[1]).toBeChecked();
  });

  it("saves edited names for the selected sockets", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SocketListPage />);

    const checkboxes = await screen.findAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Edit Selected" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit sockets" });
    const name = within(dialog).getByRole("textbox", { name: "Name for AM5" });
    await user.clear(name);
    await user.type(name, "AM5+");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateSockets).toHaveBeenCalledWith([
        {
          id: "am5",
          name: "AM5+",
          manufacturerId: "amd",
          manufacturerName: "AMD",
        },
      ]);
    });
    expect(screen.getByRole("link", { name: "AM5" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });
});
