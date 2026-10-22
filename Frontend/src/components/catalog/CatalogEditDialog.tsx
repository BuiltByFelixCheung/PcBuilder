import { useState } from "react";
import axios from "axios";
import { parseApiError } from "@/api/errors.ts";
import type { CatalogField } from "@/components/catalog/CatalogFields";
import { CatalogFieldRows } from "@/components/catalog/CatalogCreateForm";
import { CatalogItemDialog } from "@/components/catalog/CatalogItemDialog";
import { FieldGroup } from "@/components/ui/field";
import { ui } from "@/i18n/translate-enum";

type Identified = { id: string };

type CatalogEditDialogProps<T extends Identified> = {
  title: string;
  item: T;
  fields: readonly CatalogField<T>[];
  onClose: () => void;
  onSave: (item: T) => Promise<void>;
};

export function CatalogEditDialog<T extends Identified>({
  title,
  item,
  fields,
  onClose,
  onSave,
}: Readonly<CatalogEditDialogProps<T>>) {
  const [draft, setDraft] = useState<T>(() => ({ ...item }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      onClose();
    } catch (saveError) {
      setError(saveMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CatalogItemDialog
      title={title}
      error={error}
      saving={saving}
      onClose={onClose}
      onSubmit={() => void save()}
      submitLabel={saving ? ui.action("saving") : ui.action("save")}
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
