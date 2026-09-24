import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ChildCollectionDialog,
  type ChildCollectionColumn,
} from "@/components/catalog/ChildCollectionDialog.tsx";
import { Input } from "@/components/ui/input.tsx";

type Cable = { label: string };

const columns: ChildCollectionColumn<Cable>[] = [
  {
    header: "Label",
    cell: (row, update) => (
      <Input
        aria-label={`Label for ${row.label || "new row"}`}
        value={row.label}
        onChange={(event) => update({ label: event.target.value })}
      />
    ),
  },
];

describe("ChildCollectionDialog", () => {
  it("saves the remaining rows after a removal and an addition", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ChildCollectionDialog
        title="PSU cables"
        rows={[{ label: "ATX" }, { label: "PCIe" }]}
        columns={columns}
        createRow={() => ({ label: "" })}
        onClose={onClose}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove row 1" }));
    await user.click(screen.getByRole("button", { name: "Add row" }));
    await user.type(
      screen.getByRole("textbox", { name: "Label for new row" }),
      "SATA",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith([{ label: "PCIe" }, { label: "SATA" }]);
    expect(onClose).toHaveBeenCalled();
  });
});
