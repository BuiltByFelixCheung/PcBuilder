import { useState } from "react";
import axios from "axios";
import { parseApiError } from "@/api/errors";
import type { CpuCoolerSocket } from "@/api/catalog/cpu-coolers";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  socketsByManufacturer,
  type SocketChoice,
} from "@/pages/catalog/cpu-coolers/socketGroups";

export function SocketCheckboxGroup({
  sockets,
  selectedIds,
  disabled = false,
  onChange,
}: Readonly<{
  sockets: readonly SocketChoice[];
  selectedIds: readonly string[];
  disabled?: boolean;
  onChange: (ids: string[]) => void;
}>) {
  if (sockets.length === 0) {
    return <p className="catalog-empty">No sockets.</p>;
  }

  return (
    <fieldset className="grid gap-4" disabled={disabled}>
      <legend className="sr-only">Sockets</legend>
      {socketsByManufacturer(sockets).map(([manufacturer, choices]) => (
        <div key={manufacturer || "unknown"} className="grid gap-2">
          <p className="text-sm font-medium">{manufacturer || "—"}</p>
          {choices.map((socket) => {
            const checked = selectedIds.includes(socket.id);
            return (
              <label
                key={socket.id}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) =>
                    onChange(
                      next === true
                        ? selectedIds.includes(socket.id)
                          ? [...selectedIds]
                          : [...selectedIds, socket.id]
                        : selectedIds.filter((id) => id !== socket.id),
                    )
                  }
                />
                {socket.name}
              </label>
            );
          })}
        </div>
      ))}
    </fieldset>
  );
}

function selectedSockets(
  sockets: readonly SocketChoice[],
  selectedIds: readonly string[],
): CpuCoolerSocket[] {
  return sockets
    .filter((socket) => selectedIds.includes(socket.id))
    .map((socket) => ({ socketId: socket.id, socketName: socket.name }));
}

export function EditSocketsDialog({
  sockets,
  selected,
  onClose,
  onSave,
}: Readonly<{
  sockets: readonly SocketChoice[];
  selected: readonly CpuCoolerSocket[];
  onClose: () => void;
  onSave: (sockets: CpuCoolerSocket[]) => Promise<void>;
}>) {
  const options = socketOptions(sockets, selected);
  const [selectedIds, setSelectedIds] = useState(() =>
    selected.map((socket) => socket.socketId),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(selectedSockets(options, selectedIds));
      onClose();
    } catch (saveError) {
      setError(saveMessage(saveError));
    } finally {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit sockets</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <SocketCheckboxGroup
          sockets={options}
          selectedIds={selectedIds}
          disabled={saving}
          onChange={setSelectedIds}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function socketOptions(
  sockets: readonly SocketChoice[],
  selected: readonly CpuCoolerSocket[],
) {
  const options = [...sockets];
  for (const socket of selected) {
    if (!options.some((option) => option.id === socket.socketId)) {
      options.push({
        id: socket.socketId,
        name: socket.socketName || socket.socketId,
      });
    }
  }
  return options;
}

function saveMessage(error: unknown) {
  if (error instanceof Error && !axios.isAxiosError(error)) return error.message;
  return parseApiError(error).message;
}
