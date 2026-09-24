import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SocketOption } from "@/api/master-data.ts";
import { masterDataKeys } from "@/api/master-data.ts";
import { SocketFormDialog } from "@/components/master-data/SocketFormDialog.tsx";
import { newMasterDataEditValue } from "@/lib/master-data-edit.ts";
import { renderWithQuery } from "../helpers/query.tsx";

const listManufacturersByProductType = vi.fn();
const deleteSocket = vi.fn();

vi.mock("@/api/master-data.ts", async () => {
  const actual = await vi.importActual<typeof import("@/api/master-data.ts")>(
    "@/api/master-data.ts",
  );
  return {
    ...actual,
    listManufacturersByProductType: (...args: unknown[]) =>
      listManufacturersByProductType(...args),
    deleteSocket: (...args: unknown[]) => deleteSocket(...args),
  };
});

const socket: SocketOption = {
  id: "am5",
  name: "AM5",
  manufacturerId: "amd",
  manufacturerName: "AMD",
};

describe("SocketFormDialog", () => {
  beforeEach(() => {
    listManufacturersByProductType
      .mockReset()
      .mockResolvedValue([{ id: "amd", name: "AMD" }]);
    deleteSocket.mockReset();
    vi.spyOn(window, "confirm").mockReset();
  });

  it("hides delete when creating a socket", async () => {
    renderWithQuery(
      <SocketFormDialog
        editingId={newMasterDataEditValue}
        sockets={[]}
        socketsSettled
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByLabelText("Name")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("deletes the open socket after confirmation", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    deleteSocket.mockResolvedValue(undefined);
    const onClose = vi.fn();
    const { queryClient } = renderWithQuery(
      <SocketFormDialog
        editingId={socket.id}
        sockets={[socket]}
        socketsSettled
        onClose={onClose}
      />,
    );
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalledWith("Delete AM5?");
    expect(deleteSocket).toHaveBeenCalledWith("am5");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: masterDataKeys.sockets,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the dialog open when deletion is cancelled", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithQuery(
      <SocketFormDialog
        editingId={socket.id}
        sockets={[socket]}
        socketsSettled
        onClose={onClose}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    expect(deleteSocket).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("shows the API error when deletion fails", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    const error = new AxiosError("fail");
    error.response = {
      status: 404,
      data: { detail: "Socket was not found." },
      statusText: "Not Found",
      headers: {},
      config: {} as never,
    };
    deleteSocket.mockRejectedValue(error);
    const user = userEvent.setup();
    renderWithQuery(
      <SocketFormDialog
        editingId={socket.id}
        sockets={[socket]}
        socketsSettled
        onClose={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Socket was not found.",
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });
});
