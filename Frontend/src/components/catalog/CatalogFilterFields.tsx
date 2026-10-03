import { Children, isValidElement, useState, type ReactNode } from "react";
import { ChevronsUpDown } from "lucide-react";
import { DecimalInput } from "@/components/catalog/DecimalInput";
import type { RangeFilter } from "@/api/paging";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { formSelectClassName, SelectField } from "@/components/filters/ListFilters";

export {
  FilterActions as CatalogFilterActions,
  NameField as CatalogNameField,
  SelectField as CatalogSelectField,
  IdSelectField as CatalogIdSelectField,
} from "@/components/filters/ListFilters";

export function CatalogCompatibleCheckbox({
  checked,
  onCheckedChange,
}: Readonly<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}>) {
  return (
    <Field orientation="horizontal">
      <Checkbox
        id="show-only-compatible"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
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
        <DecimalInput
          id={`${id}-min`}
          placeholder="Min"
          value={range?.min}
          onValue={(min) =>
            onChange({
              min,
              max: range?.max ?? null,
            })
          }
        />
        <DecimalInput
          label={maxAriaLabel}
          placeholder="Max"
          value={range?.max}
          onValue={(max) =>
            onChange({
              min: range?.min ?? null,
              max,
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

const VISIBLE_FILTER_COUNT = 3;

export function CatalogFilterGroup({
  children,
}: Readonly<{ children: ReactNode }>) {
  const fields = Children.toArray(children).filter((child) =>
    isValidElement(child),
  );
  const visible = fields.slice(0, VISIBLE_FILTER_COUNT);
  const extra = fields.slice(VISIBLE_FILTER_COUNT);
  const [open, setOpen] = useState(false);

  return (
    <>
      <FieldGroup className="catalog-filter-grid">{visible}</FieldGroup>
      {extra.length > 0 ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleContent className="catalog-filter-more-fields">
            <FieldGroup className="catalog-filter-grid">{extra}</FieldGroup>
          </CollapsibleContent>
          <CollapsibleTrigger className="catalog-filter-more">
            {open ? "Fewer filters" : "More filters"}
            <ChevronsUpDown />
          </CollapsibleTrigger>
        </Collapsible>
      ) : null}
    </>
  );
}

