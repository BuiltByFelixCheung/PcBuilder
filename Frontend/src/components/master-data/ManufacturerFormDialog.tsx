import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createManufacturer,
  deleteManufacturer,
  MANUFACTURER_PRODUCT_TYPES,
  masterDataKeys,
  updateManufacturer,
  type Manufacturer,
  type ManufacturerProductType,
} from "@/api/master-data";
import { MasterDataEditorFrame } from "@/components/master-data/MasterDataEditorFrame";
import {
  MasterDataFormShell,
  MasterDataMissing,
} from "@/components/master-data/MasterDataDialogShell";
import { FormTextField } from "@/components/FormTextField";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";
import { useState } from "react";

const manufacturerProductTypeSchema = z.enum(
  MANUFACTURER_PRODUCT_TYPES.map((type) => type.value) as [
    ManufacturerProductType,
    ...ManufacturerProductType[],
  ],
);

const manufacturerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters."),
  productTypes: z.array(manufacturerProductTypeSchema),
});

type ManufacturerFormValues = z.infer<typeof manufacturerFormSchema>;

type ManufacturerFormDialogProps = {
  editingId: string;
  manufacturers: readonly Manufacturer[];
  manufacturersSettled: boolean;
  onClose: () => void;
};

export function ManufacturerFormDialog({
  editingId,
  manufacturers,
  manufacturersSettled,
  onClose,
}: Readonly<ManufacturerFormDialogProps>) {
  return (
    <MasterDataEditorFrame
      editingId={editingId}
      items={manufacturers}
      settled={manufacturersSettled}
      onClose={onClose}
      editTitle="Edit Manufacturer"
      loadingMessage="Loading Manufacturer…"
      missing={
        <MasterDataMissing
          title="Manufacturer not found"
          description="This manufacturer is not in the current list."
          onClose={onClose}
        />
      }
    >
      {(manufacturer) => (
        <ManufacturerFields manufacturer={manufacturer} onClose={onClose} />
      )}
    </MasterDataEditorFrame>
  );
}

function ManufacturerFields({
  manufacturer,
  onClose,
}: Readonly<{
  manufacturer: Manufacturer | undefined;
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  const form = useForm<ManufacturerFormValues>({
    resolver: zodResolver(manufacturerFormSchema),
    defaultValues: {
      name: manufacturer?.name ?? "",
      productTypes: manufacturer?.productTypes ?? [],
    },
  });
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const selectedProductTypes = watch("productTypes");
  const [isDeleting, setIsDeleting] = useState(false);
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

  async function onDelete() {
    if (!manufacturer || !window.confirm(`Delete ${manufacturer.name}?`))
      return;
    setIsDeleting(true);
    try {
      await deleteManufacturer(manufacturer.id);
      await queryClient.invalidateQueries({
        queryKey: masterDataKeys.manufacturers,
      });
      onClose();
    } catch (error) {
      applyApiFormError(setError, parseApiError(error));
      setIsDeleting(false);
    }
  }

  return (
    <MasterDataFormShell
      title={manufacturer ? "Edit Manufacturer" : "New Manufacturer"}
      error={errors.root?.message}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      onDelete={manufacturer ? () => void onDelete() : undefined}
      deleteDisabled={isDeleting}
      deleting={isDeleting}
      submitLabel={isSubmitting ? "Saving…" : "Save"}
      submitDisabled={isSubmitting}
    >
      <FormTextField
        id="manufacturer-edit-name"
        label="Name"
        required
        error={errors.name}
        registration={register("name")}
      />
      <FieldSet>
        <FieldLegend variant="label">Product lines</FieldLegend>
        <FieldDescription>
          Create forms offer this manufacturer only for the lines selected here.
        </FieldDescription>
        <div className="grid gap-2 sm:grid-cols-2">
          {MANUFACTURER_PRODUCT_TYPES.map((type) => {
            const checked = selectedProductTypes.includes(type.value);
            return (
              <label
                key={type.value}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) => {
                    const productTypes =
                      next === true
                        ? [...new Set([...selectedProductTypes, type.value])]
                        : selectedProductTypes.filter(
                            (value) => value !== type.value,
                          );
                    setValue("productTypes", productTypes, {
                      shouldDirty: true,
                    });
                  }}
                />
                {type.label}
              </label>
            );
          })}
        </div>
      </FieldSet>
    </MasterDataFormShell>
  );
}
