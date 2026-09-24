import { toOptionalNumber } from "@/api/helper";
import type { RangeFilter } from "@/api/paging";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  formSelectClassName,
  IdSelectField,
  FilterActions,
  NameField,
  SelectField,
} from "@/components/filters/ListFilters";

export {
  FilterActions as CatalogFilterActions,
  NameField as CatalogNameField,
  SelectField as CatalogSelectField,
  IdSelectField as CatalogIdSelectField,
};

export function CatalogCompatibleCheckbox({
  checked,
  onCheckedChange,
}: Readonly<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}>) {
  return (
    <Field orientation="horizontal">
      <input
        id="show-only-compatible"
        type="checkbox"
        className="size-4 shrink-0"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <FieldLabel htmlFor="show-only-compatible">
        Show only compatible
      </FieldLabel>
    </Field>
  );
}

export function CatalogRangeField({
  id,
  label,
  maxAriaLabel,
  range,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  maxAriaLabel: string;
  range: RangeFilter | undefined;
  onChange: (range: RangeFilter) => void;
}>) {
  return (
    <Field>
      <FieldLabel htmlFor={`${id}-min`}>{label}</FieldLabel>
      <div className="flex gap-2">
        <Input
          id={`${id}-min`}
          type="number"
          min={0}
          placeholder="Min"
          value={range?.min ?? ""}
          onChange={(event) =>
            onChange({
              min: toOptionalNumber(event.target.value),
              max: range?.max ?? null,
            })
          }
        />
        <Input
          id={`${id}-max`}
          type="number"
          min={0}
          placeholder="Max"
          aria-label={maxAriaLabel}
          value={range?.max ?? ""}
          onChange={(event) =>
            onChange({
              min: range?.min ?? null,
              max: toOptionalNumber(event.target.value),
            })
          }
        />
      </div>
    </Field>
  );
}

export function CatalogOptionalBooleanField({
  id,
  label,
  value,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
}>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        className={formSelectClassName}
        value={value == null ? "" : String(value)}
        onChange={(event) => {
          if (event.target.value === "true") onChange(true);
          else if (event.target.value === "false") onChange(false);
          else onChange(undefined);
        }}
      >
        <option value="">Any</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </Field>
  );
}

export function CatalogEnumField<T extends string>({
  id,
  label,
  value,
  options,
  emptyLabel = "Any",
  formatOption = (option) => option,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: T | undefined;
  options: readonly T[];
  emptyLabel?: string;
  formatOption?: (option: T) => string;
  onChange: (value: T | undefined) => void;
}>) {
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      emptyLabel={emptyLabel}
      options={options.map((option) => ({
        value: option,
        label: formatOption(option),
      }))}
      onValueChange={(next) => onChange((next || undefined) as T | undefined)}
    />
  );
}

