import { useState, type ReactNode } from "react";
import axios from "axios";
import { cn } from "cn";
import { parseApiError } from "@/api/errors.ts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ChildCollectionColumn<T> = {
  header: string;
  cell: (row: T, update: (next: T) => void) => ReactNode;
};

type ChildCollectionDialogProps<T> = {
  title: string;
  rows: readonly T[];
  columns: readonly ChildCollectionColumn<T>[];
  createRow: () => T;
  onClose: () => void;
  onSave: (rows: T[]) => Promise<void>;
};

export type CollectionDraft<T> = {
  key: string;
  value: T;
};

type DraftRow<T> = CollectionDraft<T>;

export function EditableCollectionTable<T>({
  rows,
  columns,
  disabled = false,
  addLabel = "Add row",
  scrollable = false,
  createRow,
  onChange,
}: Readonly<{
  rows: readonly CollectionDraft<T>[];
  columns: readonly ChildCollectionColumn<T>[];
  disabled?: boolean;
  addLabel?: string;
  scrollable?: boolean;
  createRow: () => T;
  onChange: (rows: CollectionDraft<T>[]) => void;
}>) {
  function updateRow(key: string, next: T) {
    onChange(rows.map((row) => (row.key === key ? { key, value: next } : row)));
  }

  function addRow() {
    onChange([...rows, { key: newRowKey(), value: createRow() }]);
  }

  function removeRow(key: string) {
    onChange(rows.filter((row) => row.key !== key));
  }

  return (
    <div
      className={cn(
        "grid gap-3",
        scrollable &&
          "min-h-0 min-w-0 flex-1 overflow-y-auto **:data-[slot=table-container]:min-w-0 [&_select]:w-auto [&_select]:min-w-24",
      )}
    >
      <Table className={scrollable ? "w-max min-w-full" : undefined}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.header}>{column.header}</TableHead>
            ))}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.key}>
              {columns.map((column) => (
                <TableCell key={column.header} data-label={column.header}>
                  {column.cell(row.value, (next) => updateRow(row.key, next))}
                </TableCell>
              ))}
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  aria-label={`Remove row ${index + 1}`}
                  onClick={() => removeRow(row.key)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div>
        <Button type="button" variant="outline" disabled={disabled} onClick={addRow}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

export function ChildCollectionDialog<T>({
  title,
  rows,
  columns,
  createRow,
  onClose,
  onSave,
}: Readonly<ChildCollectionDialogProps<T>>) {
  const [drafts, setDrafts] = useState<DraftRow<T>[]>(() =>
    rows.map((row) => ({ key: newRowKey(), value: structuredClone(row) })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(drafts.map((row) => row.value));
      onClose();
    } catch (saveError) {
      setError(saveMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-full min-w-0 max-w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="form-error shrink-0" role="alert">
            {error}
          </p>
        ) : null}
        <EditableCollectionTable
          rows={drafts}
          columns={columns}
          disabled={saving}
          scrollable
          createRow={createRow}
          onChange={setDrafts}
        />
        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function newRowKey() {
  return crypto.randomUUID();
}

function saveMessage(error: unknown) {
  if (error instanceof Error && !axios.isAxiosError(error)) return error.message;
  return parseApiError(error).message;
}
