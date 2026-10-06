import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createGpu,
  deleteGpu,
  listGpuSeries,
  listManufacturersByProductType,
  masterDataKeys,
  updateGpu,
  type GpuOption,
  type GpuSeriesOption,
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
import { useState } from "react";

const gpuFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters."),
  manufacturerId: z.string().min(1, "Manufacturer is required."),
  gpuSeriesId: z.string().min(1, "Series is required."),
});

type GpuFormValues = z.infer<typeof gpuFormSchema>;

type GpuFormDialogProps = {
  editingId: string;
  gpus: readonly GpuOption[];
  gpusSettled: boolean;
  onClose: () => void;
};

export function GpuFormDialog({
  editingId,
  gpus,
  gpusSettled,
  onClose,
}: Readonly<GpuFormDialogProps>) {
  return (
    <MasterDataEditorFrame
      editingId={editingId}
      items={gpus}
      settled={gpusSettled}
      onClose={onClose}
      editTitle="Edit GPU"
      loadingMessage="Loading GPU…"
      missing={
        <MasterDataMissing
          title="GPU not found"
          description="This GPU is not in the current list."
          onClose={onClose}
        />
      }
    >
      {(gpu) => <GpuForm gpu={gpu} onClose={onClose} />}
    </MasterDataEditorFrame>
  );
}

function GpuForm({
  gpu,
  onClose,
}: Readonly<{ gpu: GpuOption | undefined; onClose: () => void }>) {
  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("gpu"),
    queryFn: () => listManufacturersByProductType("gpu"),
  });
  const series = useQuery({
    queryKey: masterDataKeys.gpuSeries,
    queryFn: () => listGpuSeries(),
  });
  return (
    <MasterDataOptions
      title={gpu ? "Edit GPU" : "New GPU"}
      loadingMessage="Loading GPU…"
      onClose={onClose}
      queries={[manufacturers, series]}
    >
      {([manufacturerOptions, seriesOptions]) => (
        <GpuFields
          gpu={gpu}
          manufacturers={manufacturerOptions}
          series={seriesOptions}
          onClose={onClose}
        />
      )}
    </MasterDataOptions>
  );
}

function GpuFields({
  gpu,
  manufacturers,
  series,
  onClose,
}: Readonly<{
  gpu: GpuOption | undefined;
  manufacturers: { id: string; name: string }[];
  series: GpuSeriesOption[];
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  const form = useForm<GpuFormValues>({
    resolver: zodResolver(gpuFormSchema),
    defaultValues: {
      name: gpu?.name ?? "",
      manufacturerId: gpu?.manufacturerId ?? "",
      gpuSeriesId: gpu?.gpuSeriesId ?? "",
    },
  });
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const manufacturerId = useWatch({ control, name: "manufacturerId" });
  const seriesOptions = series.filter(
    (item) => !manufacturerId || item.manufacturerId === manufacturerId,
  );
  const manufacturerRegistration = register("manufacturerId");
  const [isDeleting, setIsDeleting] = useState(false);

  async function onSubmit(values: GpuFormValues) {
    try {
      if (gpu) {
        await updateGpu(gpu.id, values);
      } else {
        await createGpu(values);
      }
      await queryClient.invalidateQueries({ queryKey: masterDataKeys.gpus });
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      applyApiFieldErrors(setError, parsed.fieldErrors, [
        "name",
        "manufacturerId",
        "gpuSeriesId",
      ]);
      applyApiFormError(setError, parsed);
    }
  }

  async function onDelete() {
    if (!gpu || !window.confirm(`Delete ${gpu.name}?`)) return;
    setIsDeleting(true);
    try {
      await deleteGpu(gpu.id);
      await queryClient.invalidateQueries({ queryKey: masterDataKeys.gpus });
      onClose();
    } catch (error) {
      applyApiFormError(setError, parseApiError(error));
      setIsDeleting(false);
    }
  }

  return (
    <MasterDataFormShell
      title={gpu ? "Edit GPU" : "New GPU"}
      description={
        gpu
          ? "Update the name, manufacturer, and series."
          : "Add a GPU to master data."
      }
      error={errors.root?.message}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      onDelete={gpu ? () => void onDelete() : undefined}
      deleteDisabled={isDeleting}
      deleting={isDeleting}
      submitLabel={isSubmitting ? "Saving…" : "Save"}
      submitDisabled={isSubmitting}
    >
      <FormTextField
        id="gpu-edit-name"
        label="Name"
        required
        error={errors.name}
        registration={register("name")}
      />
      <Field data-invalid={errors.manufacturerId ? true : undefined}>
        <FieldLabel>Manufacturer</FieldLabel>
        <select
          id="gpu-edit-manufacturer"
          className={formSelectClassName}
          aria-invalid={errors.manufacturerId ? true : undefined}
          {...manufacturerRegistration}
          onChange={(event) => {
            void manufacturerRegistration.onChange(event);
          }}
        >
          <option value="">Select a manufacturer</option>
          {manufacturers.map((manufacturer) => (
            <option key={manufacturer.id} value={manufacturer.id}>
              {manufacturer.name}
            </option>
          ))}
        </select>
      </Field>
      <Field data-invalid={errors.gpuSeriesId ? true : undefined}>
        <FieldLabel>Series</FieldLabel>
        <select
          id="gpu-edit-series"
          className={formSelectClassName}
          aria-invalid={errors.gpuSeriesId ? true : undefined}
          {...register("gpuSeriesId")}
        >
          <option value="">Select a series</option>
          {seriesOptions.map((series) => (
            <option key={series.id} value={series.id}>
              {series.name}
            </option>
          ))}
        </select>
        <FieldError errors={[errors.gpuSeriesId]} />
      </Field>
    </MasterDataFormShell>
  );
}
