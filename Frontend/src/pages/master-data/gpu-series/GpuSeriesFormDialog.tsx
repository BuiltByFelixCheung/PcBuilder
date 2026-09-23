import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createGpuSeries,
  listManufacturersByProductType,
  masterDataKeys,
  updateGpuSeries,
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";
import { newMasterDataEditValue } from "@/pages/master-data/master-data-edit";

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
  const isNew = editingId === newMasterDataEditValue;
  const editing = isNew
    ? undefined
    : gpuSeries.find((item) => item.id === editingId);
  const missing = !isNew && gpuSeriesSettled && !editing;
  const loading = !isNew && !gpuSeriesSettled;

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
              <DialogTitle>Edit GPU series</DialogTitle>
            </DialogHeader>
            <PageStatus>Loading GPU series…</PageStatus>
          </>
        ) : null}
        {missing ? <MissingGpuSeries onClose={onClose} /> : null}
        {isNew || editing ? (
          <GpuSeriesForm gpuSeries={editing} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MissingGpuSeries({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <div className="flex flex-col gap-2">
      <PageStatus>GPU series not found.</PageStatus>
      <Button onClick={onClose}>Close</Button>
    </div>
  );
}

function GpuSeriesForm({
  gpuSeries,
  onClose,
}: Readonly<{ gpuSeries: GpuSeriesOption | undefined; onClose: () => void }>) {
  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType('gpu'),
    queryFn: () => listManufacturersByProductType('gpu'),
  });
  const optionsError = manufacturers.error;

  if (manufacturers.isPending) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {gpuSeries ? "Edit GPU series" : "New GPU series"}
          </DialogTitle>
        </DialogHeader>
        <PageStatus>Loading GPU series…</PageStatus>
      </>
    );
  }

  if (optionsError || !manufacturers.data) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {gpuSeries ? "Edit GPU series" : "New GPU series"}
          </DialogTitle>
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
    <GpuSeriesFields
      gpuSeries={gpuSeries}
      manufacturers={manufacturers.data}
      onClose={onClose}
    />
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

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>
          {gpuSeries ? "Edit GPU series" : "New GPU series"}
        </DialogTitle>
        <DialogDescription>
          {gpuSeries
            ? "Update the name and manufacturer."
            : "Add a GPU series to master data."}
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
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
            className={catalogSelectClassName}
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
      </FieldGroup>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Close
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {gpuSeries ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}
