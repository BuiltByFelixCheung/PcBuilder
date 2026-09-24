import { useEffect, useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import { parseApiError } from "@/api/errors.ts";

type Identified = { id: string };

type SetRowSelection = (
  selection:
    | RowSelectionState
    | ((current: RowSelectionState) => RowSelectionState),
) => void;

type UseBulkDeleteOptions = {
  items: readonly Identified[];
  rowSelection: RowSelectionState;
  setRowSelection: SetRowSelection;
  queryKey: QueryKey;
  singular: string;
  plural: string;
  deleteByIds: (ids: string[]) => Promise<unknown>;
};

export function selectedVisibleIds(
  rowSelection: RowSelectionState,
  items: readonly Identified[],
) {
  const visible = new Set(items.map((item) => item.id));
  return Object.entries(rowSelection)
    .filter(([id, selected]) => selected && visible.has(id))
    .map(([id]) => id);
}

export function useBulkDelete({
  items,
  rowSelection,
  setRowSelection,
  queryKey,
  singular,
  plural,
  deleteByIds,
}: UseBulkDeleteOptions) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const visible = new Set(items.map((item) => item.id));
    setRowSelection((current) => {
      const entries = Object.entries(current).filter(
        ([id, selected]) => selected && visible.has(id),
      );
      if (entries.length === Object.keys(current).length) return current;
      return Object.fromEntries(entries);
    });
  }, [items, setRowSelection]);

  async function onDeleteSelected() {
    const ids = selectedVisibleIds(rowSelection, items);
    if (ids.length === 0 || isDeleting) return;
    const label = ids.length === 1 ? singular : plural;
    if (!window.confirm(`Delete ${ids.length} ${label}?`)) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteByIds(ids);
      await queryClient.invalidateQueries({ queryKey });
      setRowSelection({});
    } catch (error) {
      setDeleteError(parseApiError(error).message);
    } finally {
      setIsDeleting(false);
    }
  }

  return { onDeleteSelected, isDeleting, deleteError };
}
