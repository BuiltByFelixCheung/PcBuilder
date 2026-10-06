import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createChipset,
  deleteChipset,
  listManufacturersByProductType,
  listSockets,
  masterDataKeys,
  updateChipset,
  type ChipsetOption,
  type SocketOption,
} from "@/api/master-data";
import { MasterDataEditorFrame } from "@/components/master-data/MasterDataEditorFrame";
import {
  MasterDataFormShell,
  MasterDataMissing,
  MasterDataOptions,
} from "@/components/master-data/MasterDataDialogShell";
import { FormTextField } from "@/components/FormTextField";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";
import { formSelectClassName } from "@/components/filters/ListFilters";
import { clearSocketFromAnotherManufacturer } from "@/lib/master-data-edit";
import { useState } from "react";

const chipsetFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters."),
  manufacturerId: z.string().min(1, "Manufacturer is required."),
  socketId: z.string().min(1, "Socket is required."),
});

type ChipsetFormValues = z.infer<typeof chipsetFormSchema>;

type ChipsetFormDialogProps = {
  editingId: string;
  chipsets: readonly ChipsetOption[];
  chipsetsSettled: boolean;
  onClose: () => void;
};

export function ChipsetFormDialog({
  editingId,
  chipsets,
  chipsetsSettled,
  onClose,
}: Readonly<ChipsetFormDialogProps>) {
  return (
    <MasterDataEditorFrame
      editingId={editingId}
      items={chipsets}
      settled={chipsetsSettled}
      onClose={onClose}
      editTitle="Edit chipset"
      loadingMessage="Loading chipset…"
      missing={
        <MasterDataMissing
          title="Chipset not found"
          description="This chipset is not in the current list."
          onClose={onClose}
        />
      }
    >
      {(chipset) => <ChipsetForm chipset={chipset} onClose={onClose} />}
    </MasterDataEditorFrame>
  );
}

function ChipsetForm({
  chipset,
  onClose,
}: Readonly<{ chipset: ChipsetOption | undefined; onClose: () => void }>) {
  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("chipset"),
    queryFn: () => listManufacturersByProductType("chipset"),
  });
  const sockets = useQuery({
    queryKey: masterDataKeys.sockets,
    queryFn: listSockets,
  });
  return (
    <MasterDataOptions
      title={chipset ? "Edit chipset" : "New chipset"}
      loadingMessage="Loading chipset…"
      onClose={onClose}
      queries={[manufacturers, sockets]}
    >
      {([manufacturerOptions, socketOptions]) => (
        <ChipsetFields
          chipset={chipset}
          manufacturers={manufacturerOptions}
          sockets={socketOptions}
          onClose={onClose}
        />
      )}
    </MasterDataOptions>
  );
}

function ChipsetFields({
  chipset,
  manufacturers,
  sockets,
  onClose,
}: Readonly<{
  chipset: ChipsetOption | undefined;
  manufacturers: { id: string; name: string }[];
  sockets: SocketOption[];
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  const form = useForm<ChipsetFormValues>({
    resolver: zodResolver(chipsetFormSchema),
    defaultValues: {
      name: chipset?.name ?? "",
      manufacturerId: chipset?.manufacturerId ?? "",
      socketId: chipset?.socketId ?? "",
    },
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const manufacturerId = useWatch({ control, name: "manufacturerId" });
  const socketOptions = sockets.filter(
    (item) => !manufacturerId || item.manufacturerId === manufacturerId,
  );
  const manufacturerRegistration = register("manufacturerId");

  async function onDelete() {
    if (!chipset || !window.confirm(`Delete ${chipset.name}?`)) return;
    setIsDeleting(true);
    try {
      await deleteChipset(chipset.id);
      await queryClient.invalidateQueries({
        queryKey: masterDataKeys.chipsets,
      });
      onClose();
    } catch (error) {
      applyApiFormError(setError, parseApiError(error));
      setIsDeleting(false);
    }
  }

  async function onSubmit(values: ChipsetFormValues) {
    try {
      if (chipset) {
        await updateChipset(chipset.id, values);
      } else {
        await createChipset(values);
      }
      await queryClient.invalidateQueries({
        queryKey: masterDataKeys.chipsets,
      });
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      applyApiFieldErrors(setError, parsed.fieldErrors, [
        "name",
        "manufacturerId",
        "socketId",
      ]);
      applyApiFormError(setError, parsed);
    }
  }

  return (
    <MasterDataFormShell
      title={chipset ? "Edit chipset" : "New chipset"}
      description={
        chipset
          ? "Update the name, manufacturer, and socket."
          : "Add a chipset to master data."
      }
      error={errors.root?.message}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      onDelete={chipset ? () => void onDelete() : undefined}
      deleteDisabled={isDeleting}
      deleting={isDeleting}
      cancelDisabled={isSubmitting}
      submitLabel={isSubmitting ? "Saving…" : "Save"}
      submitDisabled={isSubmitting}
    >
      <FormTextField
        id="chipset-edit-name"
        label="Name"
        required
        error={errors.name}
        registration={register("name")}
      />
      <Field data-invalid={errors.manufacturerId ? true : undefined}>
        <FieldLabel htmlFor="chipset-edit-manufacturer">
          Manufacturer
        </FieldLabel>
        <select
          id="chipset-edit-manufacturer"
          className={formSelectClassName}
          aria-invalid={errors.manufacturerId ? true : undefined}
          {...manufacturerRegistration}
          onChange={(event) => {
            void manufacturerRegistration.onChange(event);
            clearSocketFromAnotherManufacturer(
              event.target.value,
              sockets,
              getValues("socketId"),
              setValue,
            );
          }}
        >
          <option value="">Select a manufacturer</option>
          {manufacturers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <FieldError errors={[errors.manufacturerId]} />
      </Field>
      <Field data-invalid={errors.socketId ? true : undefined}>
        <FieldLabel htmlFor="chipset-edit-socket">Socket</FieldLabel>
        <select
          id="chipset-edit-socket"
          className={formSelectClassName}
          aria-invalid={errors.socketId ? true : undefined}
          {...register("socketId")}
        >
          <option value="">Select a socket</option>
          {socketOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <FieldError errors={[errors.socketId]} />
      </Field>
    </MasterDataFormShell>
  );
}
