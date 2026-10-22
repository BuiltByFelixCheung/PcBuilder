import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "../ui/select";
import { ui } from "@/i18n/translate-enum";

export const formSelectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function FilterActions({ onClear }: Readonly<{ onClear: () => void }>) {
  return (
    <div className="catalog-filter-actions">
      <Button type="submit">{ui.action("applyFilters")}</Button>
      <Button type="button" variant="outline" onClick={onClear}>
        {ui.action("clear")}
      </Button>
    </div>
  );
}

export function NameField({
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
      <FieldLabel htmlFor={id}>{ui.label("name")}</FieldLabel>
      <Input
        id={id}
        name={name}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

const emptyOption = "__any__";

export type SelectOption = {
  value: string;
  label: string;
};

export function SelectField({
  id,
  label,
  name,
  value,
  emptyLabel,
  options,
  onValueChange,
}: Readonly<{
  id: string;
  label: string;
  name?: string;
  value: string | undefined;
  emptyLabel?: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
}>) {
  const anyLabel = emptyLabel ?? ui.label("any");
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        name={name}
        value={value || emptyOption}
        onValueChange={(next) =>
          onValueChange(next === emptyOption ? "" : next)
        }
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={anyLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{label}</SelectLabel>
            <SelectItem value={emptyOption}>{anyLabel}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

export function IdSelectField({
  id,
  label,
  name,
  value,
  options,
  emptyLabel,
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
    <SelectField
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
