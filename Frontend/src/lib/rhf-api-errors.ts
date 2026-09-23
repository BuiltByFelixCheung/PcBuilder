import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { firstError, type ApiError } from "../api/errors.ts";

export function applyApiFieldErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  fieldErrors: Record<string, string[]>,
  fields: readonly Path<TFieldValues>[],
): void {
  for (const field of fields) {
    const message = firstError(fieldErrors, String(field));
    if (message) {
      setError(field, { type: "server", message });
    }
  }
}

export function applyApiFormError<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  parsed: Pick<ApiError, "status" | "message" | "fieldErrors">,
): void {
  const identityError = firstError(parsed.fieldErrors, "identity");
  if (parsed.status === 400 && !identityError) return;
  setError("root", { message: identityError ?? parsed.message });
}
