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
import { ui } from "@/i18n/translate-enum";

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
          <DialogTitle>{ui.action("importFromExcel")}</DialogTitle>
        </DialogHeader>
        <input
          id={inputId}
          key={`${open}-${pickerKey}`}
          className="sr-only"
          type="file"
          accept={excelAccept}
          aria-label={ui.label("excelFile")}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <Attachment state={state} className="w-full">
          <AttachmentMedia>
            <FileSpreadsheetIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>
              {fileName ?? ui.label("chooseExcelFile")}
            </AttachmentTitle>
            <AttachmentDescription role={error ? "alert" : undefined}>
              {error ?? (fileName ? ui.label("excelWorkbook") : ui.label("excelExtensions"))}
            </AttachmentDescription>
          </AttachmentContent>
          {fileName ? (
            <AttachmentActions>
              <AttachmentAction
                aria-label={ui.message("removeNamed", { name: fileName })}
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
                  fileName ? ui.message("replaceNamed", { name: fileName }) : ui.label("chooseExcelFile")
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
            {importing ? ui.action("importing") : ui.action("import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
