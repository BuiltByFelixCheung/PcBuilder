import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createManufacturer,
  masterDataKeys,
  updateManufacturer,
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
import { FieldGroup } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";
import { newMasterDataEditValue } from "@/pages/master-data/master-data-edit";

const manufacturerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters."),
});

type ManufacturerFormValues = z.infer<typeof manufacturerFormSchema>;

type ManufacturerFormDialogProps = {
  editingId: string;
  manufacturers: readonly { id: string; name: string }[];
  manufacturersSettled: boolean;
  onClose: () => void;
};

export function ManufacturerFormDialog({
  editingId,
  manufacturers,
  manufacturersSettled,
  onClose,
}: Readonly<ManufacturerFormDialogProps>) {
  const isNew = editingId === newMasterDataEditValue;
  const manufacturer = isNew
    ? undefined
    : manufacturers.find((item) => item.id === editingId);
  const missing = !isNew && manufacturersSettled && !manufacturer;
  const loading = !isNew && !manufacturersSettled;

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
              <DialogTitle>Edit Manufacturer</DialogTitle>
            </DialogHeader>
            <PageStatus>Loading Manufacturer…</PageStatus>
          </>
        ) : null}
        {missing ? <MissingManufacturer onClose={onClose} /> : null}
        {isNew || manufacturer ? (
          <ManufacturerForm manufacturer={manufacturer} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MissingManufacturer({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Manufacturer not found</DialogTitle>
        <DialogDescription>
          This manufacturer is not in the current list.
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

function ManufacturerForm({
  manufacturer,
  onClose,
}: Readonly<{
  manufacturer: { id: string; name: string } | undefined;
  onClose: () => void;
}>) {
  return <ManufacturerFields manufacturer={manufacturer} onClose={onClose} />;
}

function ManufacturerFields({
  manufacturer,
  onClose,
}: Readonly<{
  manufacturer: { id: string; name: string } | undefined;
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  const form = useForm<ManufacturerFormValues>({
    resolver: zodResolver(manufacturerFormSchema),
    defaultValues: {
      name: manufacturer?.name ?? "",
    },
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: ManufacturerFormValues) {
    try {
      if (manufacturer) {
        await updateManufacturer(manufacturer.id, values);
      } else {
        await createManufacturer(values);
      }
      await queryClient.invalidateQueries({
        queryKey: masterDataKeys.manufacturers,
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
        <DialogTitle>
          {manufacturer ? "Edit Manufacturer" : "New Manufacturer"}
        </DialogTitle>
      </DialogHeader>
      {errors.root?.message ? (
        <p className="form-error" role="alert">
          {errors.root.message}
        </p>
      ) : null}
      <FieldGroup>
        <FormTextField
          id="manufacturer-edit-name"
          label="Name"
          required
          error={errors.name}
          registration={register("name")}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
