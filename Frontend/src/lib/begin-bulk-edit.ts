import type { RowSelectionState } from "@tanstack/react-table";

export function beginBulkEdit<T extends { id: string }>(
  items: readonly T[],
  rowSelection: RowSelectionState,
  setEditRows: (rows: T[]) => void,
) {
  const selected = items.filter((item) => rowSelection[item.id]);
  if (selected.length === 0) return;
  setEditRows(selected);
}
