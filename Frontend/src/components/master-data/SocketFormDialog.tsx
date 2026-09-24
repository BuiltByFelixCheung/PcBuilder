import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createSocket,
  deleteSocket,
  masterDataKeys,
  listManufacturersByProductType,
  updateSocket,
  type SocketOption,
} from "@/api/master-data";
import { PageStatus } from "@/components/PageStatus";
import { FormTextField } from "@/components/FormTextField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";
import { newMasterDataEditValue } from "@/lib/master-data-edit";
import { formSelectClassName } from "@/components/filters/ListFilters";

const socketFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters."),
  manufacturerId: z.string().min(1, "Manufacturer is required."),
});

type SocketFormValues = z.infer<typeof socketFormSchema>;

type SocketFormDialogProps = {
  editingId: string;
  sockets: readonly SocketOption[];
  socketsSettled: boolean;
  onClose: () => void;
};

export function SocketFormDialog({
  editingId,
  sockets,
  socketsSettled,
  onClose,
}: Readonly<SocketFormDialogProps>) {
  const isNew = editingId === newMasterDataEditValue;
  const socket = isNew
    ? undefined
    : sockets.find((item) => item.id === editingId);
  const missing = !isNew && socketsSettled && !socket;
  const loading = !isNew && !socketsSettled;

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
              <DialogTitle>Edit Socket</DialogTitle>
            </DialogHeader>
            <PageStatus>Loading Socket…</PageStatus>
          </>
        ) : null}
        {missing ? <MissingSocket onClose={onClose} /> : null}
        {isNew || socket ? (
          <SocketForm socket={socket} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MissingSocket({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Socket not found</DialogTitle>
        <DialogDescription>
          This socket is not in the current list.
        </DialogDescription>
      </DialogHeader>
      <DialogDescription>
        The socket you are trying to edit does not exist.
      </DialogDescription>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

function SocketForm({
  socket,
  onClose,
}: Readonly<{
  socket: SocketOption | undefined;
  onClose: () => void;
}>) {
  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("socket"),
    queryFn: () => listManufacturersByProductType("socket"),
  });

  if (manufacturers.isPending) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Edit Socket</DialogTitle>
        </DialogHeader>
        <PageStatus>Loading Socket…</PageStatus>
      </>
    );
  }

  if (manufacturers.error || !manufacturers.data) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Edit Socket</DialogTitle>
        </DialogHeader>
        <p className="form-error" role="alert">
          {parseApiError(manufacturers.error).message}
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <SocketFields
      socket={socket}
      manufacturers={manufacturers.data}
      onClose={onClose}
    />
  );
}

function SocketFields({
  socket,
  manufacturers,
  onClose,
}: Readonly<{
  socket: SocketOption | undefined;
  manufacturers: { id: string; name: string }[];
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  const form = useForm<SocketFormValues>({
    resolver: zodResolver(socketFormSchema),
    defaultValues: {
      name: socket?.name ?? "",
      manufacturerId: socket?.manufacturerId ?? "",
    },
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const busy = isSubmitting || isDeleting;

  async function onDelete() {
    if (!socket || !window.confirm(`Delete ${socket.name}?`)) return;
    setIsDeleting(true);
    try {
      await deleteSocket(socket.id);
      await queryClient.invalidateQueries({
        queryKey: masterDataKeys.sockets,
      });
      onClose();
    } catch (error) {
      applyApiFormError(setError, parseApiError(error));
      setIsDeleting(false);
    }
  }

  async function onSubmit(values: SocketFormValues) {
    try {
      if (socket) {
        await updateSocket(socket.id, values);
      } else {
        await createSocket(values);
      }
      await queryClient.invalidateQueries({
        queryKey: masterDataKeys.sockets,
      });
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      applyApiFieldErrors(setError, parsed.fieldErrors, ["name"]);
      applyApiFormError(setError, parsed);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>Edit Socket</DialogTitle>
      </DialogHeader>
      {errors.root?.message ? (
        <p className="form-error" role="alert">
          {errors.root.message}
        </p>
      ) : null}
      <FieldGroup>
        <FormTextField
          id="socket-edit-name"
          label="Name"
          required
          error={errors.name}
          registration={register("name")}
        />
        <Field data-invalid={errors.manufacturerId ? true : undefined}>
          <FieldLabel htmlFor="socket-edit-manufacturer">
            Manufacturer
          </FieldLabel>
          <select
            id="socket-edit-manufacturer"
            className={formSelectClassName}
            aria-invalid={errors.manufacturerId ? true : undefined}
            {...register("manufacturerId")}
          >
            <option value="">Select a manufacturer</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer.id} value={manufacturer.id}>
                {manufacturer.name}
              </option>
            ))}
          </select>
        </Field>
      </FieldGroup>
      <DialogFooter>
        {socket ? (
          <Button
            type="button"
            variant="destructive"
            className="sm:mr-auto"
            onClick={() => void onDelete()}
            disabled={busy}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
