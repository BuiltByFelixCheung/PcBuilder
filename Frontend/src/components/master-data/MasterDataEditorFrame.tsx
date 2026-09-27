import type { ReactNode } from "react";
import { PageStatus } from "@/components/PageStatus";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { newMasterDataEditValue } from "@/lib/master-data-edit";

type Identified = { id: string };

type MasterDataEditorFrameProps<T extends Identified> = {
  editingId: string;
  items: readonly T[];
  settled: boolean;
  onClose: () => void;
  editTitle: string;
  loadingMessage: string;
  missing: ReactNode;
  children: (item: T | undefined) => ReactNode;
};

export function MasterDataEditorFrame<T extends Identified>({
  editingId,
  items,
  settled,
  onClose,
  editTitle,
  loadingMessage,
  missing,
  children,
}: Readonly<MasterDataEditorFrameProps<T>>) {
  const isNew = editingId === newMasterDataEditValue;
  const item = isNew ? undefined : items.find((entry) => entry.id === editingId);
  const isMissing = !isNew && settled && !item;
  const loading = !isNew && !settled;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {loading ? (
          <>
            <DialogHeader>
              <DialogTitle>{editTitle}</DialogTitle>
            </DialogHeader>
            <PageStatus>{loadingMessage}</PageStatus>
          </>
        ) : null}
        {isMissing ? missing : null}
        {isNew || item ? children(item) : null}
      </DialogContent>
    </Dialog>
  );
}
