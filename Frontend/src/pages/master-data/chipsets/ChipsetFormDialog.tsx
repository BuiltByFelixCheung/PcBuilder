import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createChipset,
  listManufacturersByProductType,
  listSockets,
  masterDataKeys,
  updateChipset,
  type ChipsetOption,
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";
import { clearSocketFromAnotherManufacturer, newMasterDataEditValue } from "@/pages/master-data/master-data-edit";

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
  const isNew = editingId === newMasterDataEditValue;
  const chipset = isNew
    ? undefined
    : chipsets.find((item) => item.id === editingId);
  const missing = !isNew && chipsetsSettled && !chipset;
  const loading = !isNew && !chipsetsSettled;

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
              <DialogTitle>Edit chipset</DialogTitle>
            </DialogHeader>
            <PageStatus>Loading chipset…</PageStatus>
          </>
        ) : null}
        {missing ? <MissingChipset onClose={onClose} /> : null}
        {isNew || chipset ? (
          <ChipsetForm chipset={chipset} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MissingChipset({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Chipset not found</DialogTitle>
        <DialogDescription>
          This chipset is not in the current list.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
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
  const optionsError = manufacturers.error ?? sockets.error;

  if (manufacturers.isPending || sockets.isPending) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{chipset ? "Edit chipset" : "New chipset"}</DialogTitle>
        </DialogHeader>
        <PageStatus>Loading chipset…</PageStatus>
      </>
    );
  }

  if (optionsError || !manufacturers.data || !sockets.data) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{chipset ? "Edit chipset" : "New chipset"}</DialogTitle>
        </DialogHeader>
        <p className="form-error" role="alert">
          {parseApiError(optionsError).message}
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
    <ChipsetFields
      chipset={chipset}
      manufacturers={manufacturers.data}
      sockets={sockets.data}
      onClose={onClose}
    />
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

  async function onSubmit(values: ChipsetFormValues) {
    try {
      if (chipset) {
        await updateChipset(chipset.id, values);
      } else {
        await createChipset(values);
      }
      await queryClient.invalidateQueries({ queryKey: masterDataKeys.chipsets });
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
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>{chipset ? "Edit chipset" : "New chipset"}</DialogTitle>
        <DialogDescription>
          {chipset
            ? "Update the name, manufacturer, and socket."
            : "Add a chipset to master data."}
        </DialogDescription>
      </DialogHeader>
      {errors.root?.message ? (
        <p className="form-error" role="alert">
          {errors.root.message}
        </p>
      ) : null}
      <FieldGroup>
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
            className={catalogSelectClassName}
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
            className={catalogSelectClassName}
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
      </FieldGroup>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}


