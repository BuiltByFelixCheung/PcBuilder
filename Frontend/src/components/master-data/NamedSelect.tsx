import type { ChangeEvent } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { formSelectClassName } from "@/components/filters/ListFilters";
import { Field, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";

type NamedOption = { id: string; name: string };

export function NamedSelect({
  id,
  label,
  error,
  registration,
  placeholder,
  options,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  placeholder: string;
  options: readonly NamedOption[];
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}>) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        className={formSelectClassName}
        aria-invalid={error ? true : undefined}
        {...registration}
        onChange={(event) => {
          void registration.onChange(event);
          onChange?.(event);
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      {error ? <FieldErrorMessage errors={[error]} /> : null}
    </Field>
  );
}
