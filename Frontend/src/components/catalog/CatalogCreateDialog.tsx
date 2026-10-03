import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import type { CatalogField } from "@/components/catalog/CatalogFields";
import { CatalogFieldRows } from "@/components/catalog/CatalogCreateForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";

type Identified = { id: string };

type CatalogCreateDialogProps<T extends Identified> = {
  title: string;
  item: T;
  fields: readonly CatalogField<T>[];
  queryKey: readonly unknown[];
  detailPath: (id: string) => string;
  onClose: () => void;
  create: (item: T) => Promise<{ id: string }>;
};

export function CatalogCreateDialog<T extends Identified>({
  title,
  item,
  fields,
  queryKey,
  detailPath,
  onClose,
  create,
}: Readonly<CatalogCreateDialogProps<T>>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<T>(() => ({ ...item }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const created = await create(draft);
      await queryClient.invalidateQueries({ queryKey });
      void navigate(detailPath(created.id));
    } catch (saveError) {
      setError(saveMessage(saveError));
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
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="form-error shrink-0" role="alert">
            {error}
          </p>
        ) : null}
        <FieldGroup className="min-h-0 flex-1 gap-3 overflow-y-auto">
          <CatalogFieldRows fields={fields} item={draft} onChange={setDraft} />
        </FieldGroup>
        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void submit()}>
            {saving ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function saveMessage(error: unknown) {
  if (error instanceof Error && !axios.isAxiosError(error))
    return error.message;
  return parseApiError(error).message;
}
