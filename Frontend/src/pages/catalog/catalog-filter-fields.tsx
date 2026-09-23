import { toOptionalNumber } from "@/api/helper";
import type { RangeFilter } from "@/api/paging";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { catalogSelectClassName } from "@/pages/catalog/catalog-ui.ts";

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
        className={catalogSelectClassName}
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

export function CatalogFilterActions({
  onClear,
}: Readonly<{ onClear: () => void }>) {
  return (
    <div className="catalog-filter-actions">
      <Button type="submit">Apply filters</Button>
      <Button type="button" variant="outline" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

export function CatalogNameField({
  id,
  name,
  value,
  onChange,
}: Readonly<{
  id: string;
  name?: string;
  value: string | undefined;
  onChange: (value: string) => void;
}>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>Name</FieldLabel>
      <Input
        id={id}
        name={name}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export type CatalogSelectOption = {
  value: string;
  label: string;
};

export function CatalogSelectField({
  id,
  label,
  name,
  value,
  emptyLabel = "Any",
  options,
  onValueChange,
}: Readonly<{
  id: string;
  label: string;
  name?: string;
  value: string | undefined;
  emptyLabel?: string;
  options: readonly CatalogSelectOption[];
  onValueChange: (value: string) => void;
}>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        name={name}
        className={catalogSelectClassName}
        value={value ?? ""}
        onChange={(event) => onValueChange(event.target.value)}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
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
    <CatalogSelectField
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

export function CatalogIdSelectField({
  id,
  label,
  name,
  value,
  options,
  emptyLabel = "Any",
  onChange,
}: Readonly<{
  id: string;
  label: string;
  name?: string;
  value: string | undefined;
  options: readonly { id: string; name: string }[];
  emptyLabel?: string;
  onChange: (value: string) => void;
}>) {
  return (
    <CatalogSelectField
      id={id}
      label={label}
      name={name}
      value={value}
      emptyLabel={emptyLabel}
      options={options.map((option) => ({
        value: option.id,
        label: option.name,
      }))}
      onValueChange={onChange}
    />
  );
}
