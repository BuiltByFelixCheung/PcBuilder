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
import { MasterDataEditorFrame } from "@/components/master-data/MasterDataEditorFrame";
import {
  MasterDataFormShell,
  MasterDataMissing,
  MasterDataOptions,
} from "@/components/master-data/MasterDataDialogShell";
import { FormTextField } from "@/components/FormTextField";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";
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
  return (
    <MasterDataEditorFrame
      editingId={editingId}
      items={sockets}
      settled={socketsSettled}
      onClose={onClose}
      editTitle="Edit Socket"
      loadingMessage="Loading Socket…"
      missing={
        <MasterDataMissing
          title="Socket not found"
          description="This socket is not in the current list."
          onClose={onClose}
        />
      }
    >
      {(socket) => <SocketForm socket={socket} onClose={onClose} />}
    </MasterDataEditorFrame>
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

  return (
    <MasterDataOptions
      title="Edit Socket"
      loadingMessage="Loading Socket…"
      onClose={onClose}
      queries={[manufacturers]}
    >
      {([manufacturerOptions]) => (
        <SocketFields
          socket={socket}
          manufacturers={manufacturerOptions}
          onClose={onClose}
        />
      )}
    </MasterDataOptions>
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
    <MasterDataFormShell
      title="Edit Socket"
      error={errors.root?.message}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      onDelete={socket ? () => void onDelete() : undefined}
      deleteDisabled={busy}
      deleting={isDeleting}
      cancelDisabled={busy}
      submitLabel={isSubmitting ? "Saving…" : "Save"}
      submitDisabled={busy}
    >
      <FormTextField
        id="socket-edit-name"
        label="Name"
        required
        error={errors.name}
        registration={register("name")}
      />
      <Field data-invalid={errors.manufacturerId ? true : undefined}>
        <FieldLabel htmlFor="socket-edit-manufacturer">Manufacturer</FieldLabel>
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
    </MasterDataFormShell>
  );
}
