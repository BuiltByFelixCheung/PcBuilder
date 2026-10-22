import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import type { CatalogField } from "@/components/catalog/CatalogFields";
import { CatalogFieldRows } from "@/components/catalog/CatalogCreateForm";
import { CatalogItemDialog } from "@/components/catalog/CatalogItemDialog";
import { FieldGroup } from "@/components/ui/field";
import { ui } from "@/i18n/translate-enum";

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
    <CatalogItemDialog
      title={title}
      error={error}
      saving={saving}
      onClose={onClose}
      onSubmit={() => void submit()}
      submitLabel={saving ? ui.action("saving") : ui.action("create")}
    >
      <FieldGroup className="min-h-0 flex-1 gap-3 overflow-y-auto">
        <CatalogFieldRows fields={fields} item={draft} onChange={setDraft} />
      </FieldGroup>
    </CatalogItemDialog>
  );
}

function saveMessage(error: unknown) {
  if (error instanceof Error && !axios.isAxiosError(error))
    return error.message;
  return parseApiError(error).message;
}
