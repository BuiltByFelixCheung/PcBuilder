import { useId, useState } from "react";
import { FileSpreadsheetIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const excelAccept =
  ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function attachmentState(
  error: string | null,
  importing: boolean,
  fileName: string | null,
) {
  if (error) return "error";
  if (importing) return "uploading";
  if (fileName) return "done";
  return "idle";
}

type ImportExcelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string | null;
  importing: boolean;
  fileName: string | null;
  onFileChange: (file: File | null) => void;
  onImport: () => void;
};

export function ImportExcelDialog({
  open,
  onOpenChange,
  error,
  importing,
  fileName,
  onFileChange,
  onImport,
}: Readonly<ImportExcelDialogProps>) {
  const inputId = useId();
  const [pickerKey, setPickerKey] = useState(0);
  const state = attachmentState(error, importing, fileName);

  function clearFile() {
    onFileChange(null);
    setPickerKey((key) => key + 1);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Excel</DialogTitle>
        </DialogHeader>
        <input
          id={inputId}
          key={`${open}-${pickerKey}`}
          className="sr-only"
          type="file"
          accept={excelAccept}
          aria-label="Excel file"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <Attachment state={state} className="w-full">
          <AttachmentMedia>
            <FileSpreadsheetIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>
              {fileName ?? "Choose an Excel file"}
            </AttachmentTitle>
            <AttachmentDescription role={error ? "alert" : undefined}>
              {error ?? (fileName ? "Excel workbook" : ".xls or .xlsx")}
            </AttachmentDescription>
          </AttachmentContent>
          {fileName ? (
            <AttachmentActions>
              <AttachmentAction
                aria-label={`Remove ${fileName}`}
                disabled={importing}
                onClick={clearFile}
              >
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          ) : null}
          {importing ? null : (
            <AttachmentTrigger asChild>
              <label
                htmlFor={inputId}
                aria-label={
                  fileName ? `Replace ${fileName}` : "Choose an Excel file"
                }
              />
            </AttachmentTrigger>
          )}
        </Attachment>
        <DialogFooter>
          <Button
            type="button"
            disabled={fileName === null || importing}
            onClick={onImport}
          >
            {importing ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
