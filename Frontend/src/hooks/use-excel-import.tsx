import { useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { isExcelFile } from "@/api/excel-file";
import { parseApiError } from "@/api/errors.ts";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";

type UseExcelImportOptions = {
  queryKey: QueryKey;
  importFile: (file: File) => Promise<unknown>;
};

export function useExcelImport({
  queryKey,
  importFile,
}: UseExcelImportOptions) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setFile(null);
      setError(null);
    }
  }

  function onFileChange(next: File | null) {
    setFile(next);
    setError(
      next && !isExcelFile(next) ? "Choose an .xls or .xlsx file." : null,
    );
  }

  async function onImport() {
    if (!file || importing) return;
    if (!isExcelFile(file)) {
      setError("Choose an .xls or .xlsx file.");
      return;
    }

    setImporting(true);
    setError(null);
    try {
      await importFile(file);
      await queryClient.invalidateQueries({ queryKey });
      onOpenChange(false);
    } catch (importError) {
      setError(parseApiError(importError).message);
    } finally {
      setImporting(false);
    }
  }

  const importDialog = (
    <ImportExcelDialog
      open={open}
      onOpenChange={onOpenChange}
      error={error}
      importing={importing}
      fileName={file?.name ?? null}
      onFileChange={onFileChange}
      onImport={() => void onImport()}
    />
  );

  return { openImport: () => setOpen(true), importDialog };
}
