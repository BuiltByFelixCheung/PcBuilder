import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createGpuSeries,
  deleteGpuSeries,
  listManufacturersByProductType,
  masterDataKeys,
  updateGpuSeries,
  type GpuSeriesOption,
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
import { useState } from "react";

const gpuSeriesFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters."),
  manufacturerId: z.string().min(1, "Manufacturer is required."),
});

type GpuSeriesFormValues = z.infer<typeof gpuSeriesFormSchema>;

type GpuSeriesFormDialogProps = {
  editingId: string;
  gpuSeries: readonly GpuSeriesOption[];
  gpuSeriesSettled: boolean;
  onClose: () => void;
};

export function GpuSeriesFormDialog({
  editingId,
  gpuSeries,
  gpuSeriesSettled,
  onClose,
}: Readonly<GpuSeriesFormDialogProps>) {
  return (
    <MasterDataEditorFrame
      editingId={editingId}
      items={gpuSeries}
      settled={gpuSeriesSettled}
      onClose={onClose}
      editTitle="Edit GPU series"
      loadingMessage="Loading GPU series…"
      missing={
        <MasterDataMissing
          title="GPU series not found"
          description="This GPU series is not in the current list."
          onClose={onClose}
        />
      }
    >
      {(editing) => <GpuSeriesForm gpuSeries={editing} onClose={onClose} />}
    </MasterDataEditorFrame>
  );
}

function GpuSeriesForm({
  gpuSeries,
  onClose,
}: Readonly<{ gpuSeries: GpuSeriesOption | undefined; onClose: () => void }>) {
  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("gpu"),
    queryFn: () => listManufacturersByProductType("gpu"),
  });
  return (
    <MasterDataOptions
      title={gpuSeries ? "Edit GPU series" : "New GPU series"}
      loadingMessage="Loading GPU series…"
      onClose={onClose}
      queries={[manufacturers]}
    >
      {([manufacturerOptions]) => (
        <GpuSeriesFields
          gpuSeries={gpuSeries}
          manufacturers={manufacturerOptions}
          onClose={onClose}
        />
      )}
    </MasterDataOptions>
  );
}

function GpuSeriesFields({
  gpuSeries,
  manufacturers,
  onClose,
}: Readonly<{
  gpuSeries: GpuSeriesOption | undefined;
  manufacturers: { id: string; name: string }[];
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  const form = useForm<GpuSeriesFormValues>({
    resolver: zodResolver(gpuSeriesFormSchema),
    defaultValues: {
      name: gpuSeries?.name ?? "",
      manufacturerId: gpuSeries?.manufacturerId ?? "",
    },
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const manufacturerRegistration = register("manufacturerId");

  async function onSubmit(values: GpuSeriesFormValues) {
    try {
      if (gpuSeries) {
        await updateGpuSeries(gpuSeries.id, values);
      } else {
        await createGpuSeries(values);
      }
      await queryClient.invalidateQueries({
        queryKey: masterDataKeys.gpuSeries,
      });
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      applyApiFieldErrors(setError, parsed.fieldErrors, [
        "name",
        "manufacturerId",
      ]);
      applyApiFormError(setError, parsed);
    }
  }

  async function onDelete() {
    if (!gpuSeries || !window.confirm(`Delete ${gpuSeries.name}?`)) return;
    setIsDeleting(true);
    try {
      await deleteGpuSeries(gpuSeries.id);
      await queryClient.invalidateQueries({
        queryKey: masterDataKeys.gpuSeries,
      });
      onClose();
    } catch (error) {
      applyApiFormError(setError, parseApiError(error));
      setIsDeleting(false);
    }
  }

  return (
    <MasterDataFormShell
      title={gpuSeries ? "Edit GPU series" : "New GPU series"}
      description={
        gpuSeries
          ? "Update the name and manufacturer."
          : "Add a GPU series to master data."
      }
      error={errors.root?.message}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      onDelete={gpuSeries ? () => void onDelete() : undefined}
      deleteDisabled={isDeleting}
      deleting={isDeleting}
      cancelLabel="Close"
      cancelDisabled={isSubmitting}
      submitLabel={gpuSeries ? "Update" : "Create"}
      submitDisabled={isSubmitting}
    >
      <FormTextField
        id="gpu-series-edit-name"
        label="Name"
        required
        error={errors.name}
        registration={register("name")}
      />
      <Field data-invalid={errors.manufacturerId ? true : undefined}>
        <FieldLabel htmlFor="gpu-series-edit-manufacturer">
          Manufacturer
        </FieldLabel>
        <select
          id="gpu-series-edit-manufacturer"
          className={formSelectClassName}
          aria-invalid={errors.manufacturerId ? true : undefined}
          {...manufacturerRegistration}
          onChange={(event) => {
            void manufacturerRegistration.onChange(event);
          }}
        >
          <option value="">Select a manufacturer</option>
          {manufacturers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>
    </MasterDataFormShell>
  );
}
