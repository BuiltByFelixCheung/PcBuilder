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
import { NamedSelect } from "@/components/master-data/NamedSelect";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";
import { clearSocketFromAnotherManufacturer } from "@/lib/master-data-edit";
import { useState } from "react";
import { ui } from "@/i18n/translate-enum";

function chipsetFormSchema() {
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

type ChipsetFormValues = z.infer<ReturnType<typeof chipsetFormSchema>>;

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
      editTitle={ui.dialog("editChipset")}
      loadingMessage={ui.empty("loading", { entity: ui.entity("chipset") })}
      missing={
        <MasterDataMissing
          title={ui.empty("notFoundEntity", { entity: ui.entity("chipset") })}
          description={ui.message("notInListChipset")}
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
      title={chipset ? ui.dialog("editChipset") : ui.dialog("newChipset")}
      loadingMessage={ui.empty("loading", { entity: ui.entity("chipset") })}
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
    resolver: zodResolver(chipsetFormSchema()),
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
    if (!chipset || !window.confirm(ui.message("deleteNamed", { name: chipset.name }))) return;
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
      title={chipset ? ui.dialog("editChipset") : ui.dialog("newChipset")}
      description={
        chipset
          ? ui.message("updateNameManufacturerSocket")
          : ui.message("addChipset")
      }
      error={errors.root?.message}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      onDelete={chipset ? () => void onDelete() : undefined}
      deleteDisabled={isDeleting}
      deleting={isDeleting}
      cancelDisabled={isSubmitting}
      submitLabel={isSubmitting ? ui.action("saving") : ui.action("save")}
      submitDisabled={isSubmitting}
    >
      <FormTextField
        id="chipset-edit-name"
        label={ui.label("name")}
        required
        error={errors.name}
        registration={register("name")}
      />
      <NamedSelect
        id="chipset-edit-manufacturer"
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
        id="chipset-edit-socket"
        label={ui.label("socket")}
        error={errors.socketId}
        registration={register("socketId")}
        placeholder={ui.label("selectSocket")}
        options={socketOptions}
      />
    </MasterDataFormShell>
  );
}
