import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { parseApiError } from "@/api/errors.ts";
import {
  createCpuSeries,
  listManufacturersByProductType,
  listSockets,
  masterDataKeys,
  updateCpuSeries,
  type CpuSeriesOption,
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";
import {
  clearSocketFromAnotherManufacturer,
  newMasterDataEditValue,
} from "@/pages/master-data/master-data-edit";

const cpuSeriesFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters."),
  manufacturerId: z.string().min(1, "Manufacturer is required."),
  socketId: z.string().min(1, "Socket is required."),
});

type CpuSeriesFormValues = z.infer<typeof cpuSeriesFormSchema>;

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
  const isNew = editingId === newMasterDataEditValue;
  const editing = isNew
    ? undefined
    : cpuSeries.find((item) => item.id === editingId);
  const missing = !isNew && cpuSeriesSettled && !editing;
  const loading = !isNew && !cpuSeriesSettled;

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
              <DialogTitle>Edit CPU Series</DialogTitle>
            </DialogHeader>
            <PageStatus>Loading CPU Series…</PageStatus>
          </>
        ) : null}
        {missing ? <MissingCpuSeries onClose={onClose} /> : null}
        {isNew || editing ? (
          <CpuSeriesForm cpuSeries={editing} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MissingCpuSeries({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <div className="flex flex-col gap-2">
      <PageStatus>CPU Series not found.</PageStatus>
      <Button onClick={onClose}>Close</Button>
    </div>
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
  const optionsError = manufacturers.error ?? sockets.error;

  if (manufacturers.isPending || sockets.isPending) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {cpuSeries ? "Edit CPU Series" : "New CPU Series"}
          </DialogTitle>
        </DialogHeader>
        <PageStatus>Loading CPU Series…</PageStatus>
      </>
    );
  }

  if (optionsError || !manufacturers.data || !sockets.data) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {cpuSeries ? "Edit CPU Series" : "New CPU Series"}
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
    <CpuSeriesFields
      cpuSeries={cpuSeries}
      manufacturers={manufacturers.data}
      sockets={sockets.data}
      onClose={onClose}
    />
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
    resolver: zodResolver(cpuSeriesFormSchema),
    defaultValues: {
      name: cpuSeries?.name ?? "",
      manufacturerId: cpuSeries?.manufacturerId ?? "",
      socketId: cpuSeries?.socketId ?? "",
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
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>
          {cpuSeries ? "Edit CPU Series" : "New CPU Series"}
        </DialogTitle>
        <DialogDescription>
          {cpuSeries
            ? "Update the name, manufacturer, and socket."
            : "Add a CPU Series to master data."}
        </DialogDescription>
      </DialogHeader>
      {errors.root?.message ? (
        <p className="form-error" role="alert">
          {errors.root.message}
        </p>
      ) : null}
      <FieldGroup>
        <FormTextField
          id="cpu-series-edit-name"
          label="Name"
          required
          error={errors.name}
          registration={register("name")}
        />
        <Field data-invalid={errors.manufacturerId ? true : undefined}>
          <FieldLabel htmlFor="cpu-series-edit-manufacturer">
            Manufacturer
          </FieldLabel>
          <select
            id="cpu-series-edit-manufacturer"
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
        </Field>
        <Field data-invalid={errors.socketId ? true : undefined}>
          <FieldLabel htmlFor="cpu-series-edit-socket">Socket</FieldLabel>
          <select
            id="cpu-series-edit-socket"
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
          {cpuSeries ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}
