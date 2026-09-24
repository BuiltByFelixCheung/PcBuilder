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

type Identified = { id: string };

export type BulkEditColumn<T extends Identified> = {
  header: string;
  cell: (row: T, update: (next: T) => void) => ReactNode;
};

type BulkEditDialogProps<T extends Identified> = {
  title: string;
  rows: readonly T[];
  columns: readonly BulkEditColumn<T>[];
  onClose: () => void;
  onSave: (rows: T[]) => Promise<void>;
};

export function BulkEditDialog<T extends Identified>({
  title,
  rows,
  columns,
  onClose,
  onSave,
}: Readonly<BulkEditDialogProps<T>>) {
  const [drafts, setDrafts] = useState<T[]>(() =>
    rows.map((row) => ({ ...row })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(id: string, next: T) {
    setDrafts((current) =>
      current.map((row) => (row.id === id ? next : row)),
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(drafts);
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={column.header}>
                    {column.cell(row, (next) => updateRow(row.id, next))}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter>
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

function saveMessage(error: unknown) {
  if (error instanceof Error && !axios.isAxiosError(error)) return error.message;
  return parseApiError(error).message;
}
