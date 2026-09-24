import { useState, type ReactNode } from "react";
import axios from "axios";
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

type DraftRow<T> = {
  key: string;
  value: T;
};

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

  function updateRow(key: string, next: T) {
    setDrafts((current) =>
      current.map((row) => (row.key === key ? { key, value: next } : row)),
    );
  }

  function addRow() {
    setDrafts((current) => [
      ...current,
      { key: newRowKey(), value: createRow() },
    ]);
  }

  function removeRow(key: string) {
    setDrafts((current) => current.filter((row) => row.key !== key));
  }

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.header}>{column.header}</TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((row, index) => (
              <TableRow key={row.key}>
                {columns.map((column) => (
                  <TableCell key={column.header}>
                    {column.cell(row.value, (next) => updateRow(row.key, next))}
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
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
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={addRow}>
            Add row
          </Button>
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
