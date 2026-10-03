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

export const formSelectClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function FilterActions({ onClear }: Readonly<{ onClear: () => void }>) {
  return (
    <div className="catalog-filter-actions">
      <Button type="submit">Apply filters</Button>
      <Button type="button" variant="outline" onClick={onClear}>
        Clear
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
  emptyLabel = "Any",
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
          <SelectValue placeholder={emptyLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{label}</SelectLabel>
            <SelectItem value={emptyOption}>{emptyLabel}</SelectItem>
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
