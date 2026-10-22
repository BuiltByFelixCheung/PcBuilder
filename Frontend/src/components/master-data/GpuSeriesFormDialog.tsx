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
import { ui } from "@/i18n/translate-enum";

function gpuSeriesFormSchema() {
  return z.object({
  name: z
    .string()
    .trim()
    .min(1, ui.message("nameRequired"))
    .max(100, ui.message("nameTooLong")),
  manufacturerId: z.string().min(1, ui.message("manufacturerRequired")),
});
}

type GpuSeriesFormValues = z.infer<ReturnType<typeof gpuSeriesFormSchema>>;

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
      editTitle={ui.dialog("editGpuSeries")}
      loadingMessage={ui.empty("loading", { entity: ui.entity("gpuSeries") })}
      missing={
        <MasterDataMissing
          title={ui.empty("gpuSeriesNotFound")}
          description={ui.message("notInListGpuSeries")}
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
      title={gpuSeries ? ui.dialog("editGpuSeriesForm") : ui.dialog("newGpuSeriesForm")}
      loadingMessage={ui.empty("loading", { entity: ui.entity("gpuSeries") })}
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
    resolver: zodResolver(gpuSeriesFormSchema()),
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
    if (!gpuSeries || !window.confirm(ui.message("deleteNamed", { name: gpuSeries.name }))) return;
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
      title={gpuSeries ? ui.dialog("editGpuSeriesForm") : ui.dialog("newGpuSeriesForm")}
      description={
        gpuSeries
          ? ui.message("updateNameManufacturer")
          : ui.message("addGpuSeries")
      }
      error={errors.root?.message}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      onDelete={gpuSeries ? () => void onDelete() : undefined}
      deleteDisabled={isDeleting}
      deleting={isDeleting}
      cancelLabel={ui.action("close")}
      cancelDisabled={isSubmitting}
      submitLabel={gpuSeries ? ui.action("update") : ui.action("create")}
      submitDisabled={isSubmitting}
    >
      <FormTextField
        id="gpu-series-edit-name"
        label={ui.label("name")}
        required
        error={errors.name}
        registration={register("name")}
      />
      <Field data-invalid={errors.manufacturerId ? true : undefined}>
        <FieldLabel htmlFor="gpu-series-edit-manufacturer">{ui.label("manufacturer")}</FieldLabel>
        <select
          id="gpu-series-edit-manufacturer"
          className={formSelectClassName}
          aria-invalid={errors.manufacturerId ? true : undefined}
          {...manufacturerRegistration}
          onChange={(event) => {
            void manufacturerRegistration.onChange(event);
          }}
        >
          <option value="">{ui.label("selectManufacturer")}</option>
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
