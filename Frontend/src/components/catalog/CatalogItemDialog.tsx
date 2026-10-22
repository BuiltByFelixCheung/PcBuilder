import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ui } from "@/i18n/translate-enum";

export function CatalogItemDialog({
  title,
  error,
  saving,
  onClose,
  onSubmit,
  submitLabel,
  children,
}: Readonly<{
  title: string;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  children: ReactNode;
}>) {
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
        {children}
        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onClose}
          >
            {ui.action("cancel")}
          </Button>
          <Button type="button" disabled={saving} onClick={onSubmit}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
