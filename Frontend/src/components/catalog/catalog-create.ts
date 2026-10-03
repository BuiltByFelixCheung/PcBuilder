import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/errors.ts";
import type { CollectionDraft } from "@/components/catalog/ChildCollectionDialog";

export function unsetCatalogItem<T>(item: unknown): T {
  return item as T;
}

export function collectionValues<T>(rows: readonly CollectionDraft<T>[]) {
  return rows.map((row) => row.value);
}

export function unwrapCollectionValues<T>(
  rows: readonly CollectionDraft<{ value: T }>[],
) {
  return rows.map((row) => row.value.value);
}

export function useCatalogCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(options: {
    queryKey: readonly unknown[];
    detailPath: (id: string) => string;
    create: () => Promise<{ id: string }>;
  }) {
    setSaving(true);
    setError(null);
    try {
      const created = await options.create();
      await queryClient.invalidateQueries({ queryKey: options.queryKey });
      navigate(options.detailPath(created.id));
    } catch (saveError) {
      setError(saveMessage(saveError));
      setSaving(false);
    }
  }

  return { saving, error, submit };
}

function saveMessage(error: unknown) {
  if (error instanceof Error && !axios.isAxiosError(error)) return error.message;
  return parseApiError(error).message;
}
