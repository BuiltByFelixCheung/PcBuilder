import type { ComponentProps } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError as FieldErrorMessage,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type FormTextFieldProps = Omit<ComponentProps<typeof Input>, "aria-invalid"> & {
  id: string;
  label: string;
  hint?: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
};

export function FormTextField({
  id,
  label,
  hint,
  error,
  registration,
  ...inputProps
}: Readonly<FormTextFieldProps>) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        {...inputProps}
        {...registration}
      />
      {hint && !error ? <FieldDescription>{hint}</FieldDescription> : null}
      <FieldErrorMessage errors={[error]} />
    </Field>
  );
}
