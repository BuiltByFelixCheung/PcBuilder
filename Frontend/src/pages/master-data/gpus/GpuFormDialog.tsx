import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createGpu,
  listGpuSeries,
  listManufacturersByProductType,
  masterDataKeys,
  updateGpu,
  type GpuOption,
  type GpuSeriesOption,
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
import { newMasterDataEditValue } from "@/pages/master-data/master-data-edit";

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
  const isNew = editingId === newMasterDataEditValue;
  const gpu = isNew
    ? undefined
    : gpus.find((item) => item.id === editingId);
  const missing = !isNew && gpusSettled && !gpu;
  const loading = !isNew && !gpusSettled;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}>
      <DialogContent className="sm:max-w-md">
        {loading ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit GPU</DialogTitle>
            </DialogHeader>
            <PageStatus>Loading GPU…</PageStatus>
          </>
        ) : null}
        {missing ? <MissingGpu onClose={onClose} /> : null}
        {isNew || gpu ? <GpuForm gpu={gpu} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function MissingGpu({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>GPU not found</DialogTitle>
        <DialogDescription>
          This GPU is not in the current list.
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
  const optionsError = manufacturers.error ?? series.error;
  
  if (manufacturers.isPending || series.isPending) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{gpu ? "Edit GPU" : "New GPU"}</DialogTitle>
        </DialogHeader>
        <PageStatus>Loading GPU…</PageStatus>
      </>
    );
  }

  if (optionsError || !manufacturers.data || !series.data) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{gpu ? "Edit GPU" : "New GPU"}</DialogTitle>
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
    <GpuFields
      gpu={gpu}
      manufacturers={manufacturers.data}
      series={series.data}
      onClose={onClose}
    />
  );
}

function GpuFields({
  gpu,
  manufacturers,
  series,
  onClose,
}: Readonly<{ 
    gpu: GpuOption | undefined; 
    manufacturers: { id: string, name: string }[]; 
    series: GpuSeriesOption[]; 
    onClose: () => void 
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
      applyApiFieldErrors(setError, parsed.fieldErrors, ["name", "manufacturerId", "gpuSeriesId"]);
      applyApiFormError(setError, parsed);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>{gpu ? "Edit GPU" : "New GPU"}</DialogTitle>
        <DialogDescription>
            {gpu ? "Update the name, manufacturer, and series." : "Add a GPU to master data."}
        </DialogDescription>
      </DialogHeader>
      {errors.root?.message ? (
        <p className="form-error" role="alert">
          {errors.root.message}
        </p>
      ) : null}
      <FieldGroup>
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
            className={catalogSelectClassName}
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
            className={catalogSelectClassName}
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