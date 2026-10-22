import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createCpuSeries,
  deleteCpuSeries,
  listManufacturersByProductType,
  listSockets,
  masterDataKeys,
  updateCpuSeries,
  type CpuSeriesOption,
  type SocketOption,
} from "@/api/master-data";
import { MasterDataEditorFrame } from "@/components/master-data/MasterDataEditorFrame";
import {
  MasterDataFormShell,
  MasterDataMissing,
  MasterDataOptions,
} from "@/components/master-data/MasterDataDialogShell";
import { FormTextField } from "@/components/FormTextField";
import { NamedSelect } from "@/components/master-data/NamedSelect";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";
import { clearSocketFromAnotherManufacturer } from "@/lib/master-data-edit";
import { useState } from "react";
import { ui } from "@/i18n/translate-enum";

function cpuSeriesFormSchema() {
  return z.object({
  name: z
    .string()
    .trim()
    .min(1, ui.message("nameRequired"))
    .max(100, ui.message("nameTooLong")),
  manufacturerId: z.string().min(1, ui.message("manufacturerRequired")),
  socketId: z.string().min(1, ui.message("socketRequired")),
});
}

type CpuSeriesFormValues = z.infer<ReturnType<typeof cpuSeriesFormSchema>>;

type CpuSeriesFormDialogProps = {
  editingId: string;
  cpuSeries: readonly CpuSeriesOption[];
  cpuSeriesSettled: boolean;
  onClose: () => void;
};

export function CpuSeriesFormDialog({
  editingId,
  cpuSeries,
  cpuSeriesSettled,
  onClose,
}: Readonly<CpuSeriesFormDialogProps>) {
  return (
    <MasterDataEditorFrame
      editingId={editingId}
      items={cpuSeries}
      settled={cpuSeriesSettled}
      onClose={onClose}
      editTitle={ui.dialog("editCpuSeries")}
      loadingMessage={ui.empty("loading", { entity: ui.entity("cpuSeries") })}
      missing={
        <MasterDataMissing
          title={ui.empty("cpuSeriesNotFound")}
          description={ui.message("notInListCpuSeries")}
          onClose={onClose}
        />
      }
    >
      {(editing) => <CpuSeriesForm cpuSeries={editing} onClose={onClose} />}
    </MasterDataEditorFrame>
  );
}

function CpuSeriesForm({
  cpuSeries,
  onClose,
}: Readonly<{ cpuSeries: CpuSeriesOption | undefined; onClose: () => void }>) {
  const manufacturers = useQuery({
    queryKey: masterDataKeys.manufacturersByProductType("cpuseries"),
    queryFn: () => listManufacturersByProductType("cpuseries"),
  });
  const sockets = useQuery({
    queryKey: masterDataKeys.sockets,
    queryFn: listSockets,
  });
  return (
    <MasterDataOptions
      title={cpuSeries ? ui.dialog("editCpuSeries") : ui.dialog("newCpuSeries")}
      loadingMessage={ui.empty("loading", { entity: ui.entity("cpuSeries") })}
      onClose={onClose}
      queries={[manufacturers, sockets]}
    >
      {([manufacturerOptions, socketOptions]) => (
        <CpuSeriesFields
          cpuSeries={cpuSeries}
          manufacturers={manufacturerOptions}
          sockets={socketOptions}
          onClose={onClose}
        />
      )}
    </MasterDataOptions>
  );
}

function CpuSeriesFields({
  cpuSeries,
  manufacturers,
  sockets,
  onClose,
}: Readonly<{
  cpuSeries: CpuSeriesOption | undefined;
  manufacturers: { id: string; name: string }[];
  sockets: SocketOption[];
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  const form = useForm<CpuSeriesFormValues>({
    resolver: zodResolver(cpuSeriesFormSchema()),
    defaultValues: {
      name: cpuSeries?.name ?? "",
      manufacturerId: cpuSeries?.manufacturerId ?? "",
      socketId: cpuSeries?.socketId ?? "",
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
    if (!cpuSeries || !window.confirm(ui.message("deleteNamed", { name: cpuSeries.name }))) return;
    setIsDeleting(true);
    try {
      await deleteCpuSeries(cpuSeries.id);
      await queryClient.invalidateQueries({
        queryKey: masterDataKeys.cpuSeries,
      });
      onClose();
    } catch (error) {
      applyApiFormError(setError, parseApiError(error));
      setIsDeleting(false);
    }
  }

  async function onSubmit(values: CpuSeriesFormValues) {
    try {
      if (cpuSeries) {
        await updateCpuSeries(cpuSeries.id, values);
      } else {
        await createCpuSeries(values);
      }
      await queryClient.invalidateQueries({
        queryKey: masterDataKeys.cpuSeries,
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
      title={cpuSeries ? ui.dialog("editCpuSeries") : ui.dialog("newCpuSeries")}
      description={
        cpuSeries
          ? ui.message("updateNameManufacturerSocket")
          : ui.message("addCpuSeries")
      }
      error={errors.root?.message}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      onDelete={cpuSeries ? () => void onDelete() : undefined}
      deleteDisabled={isDeleting}
      deleting={isDeleting}
      cancelLabel={ui.action("close")}
      cancelDisabled={isSubmitting}
      submitLabel={cpuSeries ? ui.action("update") : ui.action("create")}
      submitDisabled={isSubmitting}
    >
      <FormTextField
        id="cpu-series-edit-name"
        label={ui.label("name")}
        required
        error={errors.name}
        registration={register("name")}
      />
      <NamedSelect
        id="cpu-series-edit-manufacturer"
        label={ui.label("manufacturer")}
        error={errors.manufacturerId}
        registration={manufacturerRegistration}
        placeholder={ui.label("selectManufacturer")}
        options={manufacturers}
        onChange={(event) =>
          clearSocketFromAnotherManufacturer(
            event.target.value,
            sockets,
            getValues("socketId"),
            setValue,
          )
        }
      />
      <NamedSelect
        id="cpu-series-edit-socket"
        label={ui.label("socket")}
        error={errors.socketId}
        registration={register("socketId")}
        placeholder={ui.label("selectSocket")}
        options={socketOptions}
      />
    </MasterDataFormShell>
  );
}
