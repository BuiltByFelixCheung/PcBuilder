import type { ReactNode } from "react";
import { toInteger } from "@/api/helper";
import { DecimalInput } from "@/components/catalog/DecimalInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Named = { id: string; name: string };
type IdOption = { id: string; name: string };
type FieldKey<T> = keyof T & string;

export type CatalogField<T> = {
  label: string;
  orientation?: "vertical" | "horizontal" | "responsive";
  half?: boolean;
  control: (item: T, update: (next: T) => void) => ReactNode;
};

export function nameField<T extends Named>(): CatalogField<T> {
  return {
    label: "Name",
    control: (item, update) => (
      <Input
        aria-label={`Name for ${item.name}`}
        value={item.name}
        onChange={(event) => update({ ...item, name: event.target.value })}
      />
    ),
  };
}

const emptyOption = "__blank__";

export function idSelectField<T extends Named>(
  label: string,
  field: FieldKey<T>,
  options: readonly IdOption[] | ((item: T) => readonly IdOption[]),
  blankLabel?: string,
): CatalogField<T> {
  return {
    label,
    half: true,
    control: (item, update) => {
      const choices = typeof options === "function" ? options(item) : options;
      const current = (item[field] as string | undefined) ?? "";
      const known =
        current !== "" && choices.some((option) => option.id === current);
      const showBlank = blankLabel != null || !known;
      return (
        <Select
          value={known ? current : emptyOption}
          onValueChange={(next) =>
            update({
              ...item,
              [field]: next === emptyOption ? "" : next,
            } as T)
          }
        >
          <SelectTrigger
            aria-label={item.name ? `${label} for ${item.name}` : label}
            className="w-full"
          >
            <SelectValue placeholder={blankLabel ?? ""} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{label}</SelectLabel>
              {showBlank ? (
                <SelectItem value={emptyOption}>{blankLabel ?? ""}</SelectItem>
              ) : null}
              {choices.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    },
  };
}

type EnumSelectOptions<V extends string | number> = {
  empty?: "keep" | "null";
  emptyLabel?: string;
  label?: (value: V) => string;
};

export function enumSelectField<T extends Named, V extends string | number>(
  label: string,
  field: FieldKey<T>,
  values: readonly V[],
  options?: EnumSelectOptions<V>,
): CatalogField<T> {
  return {
    label,
    half: true,
    control: (item, update) => {
      const current = item[field] as V | null | undefined;
      const currentValue = current == null ? "" : String(current);
      const known =
        currentValue !== "" &&
        values.some((entry) => String(entry) === currentValue);
      const showBlank = options?.empty != null || !known;
      return (
        <Select
          value={known ? currentValue : emptyOption}
          onValueChange={(next) => {
            if (next === emptyOption) {
              update({
                ...item,
                [field]: options?.empty === "null" ? null : "",
              } as T);
              return;
            }
            const match = values.find((entry) => String(entry) === next);
            update({ ...item, [field]: match ?? next } as T);
          }}
        >
          <SelectTrigger
            aria-label={item.name ? `${label} for ${item.name}` : label}
            className="w-full"
          >
            <SelectValue placeholder={options?.emptyLabel ?? ""} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{label}</SelectLabel>
              {showBlank ? (
                <SelectItem value={emptyOption}>
                  {options?.emptyLabel ?? ""}
                </SelectItem>
              ) : null}
              {values.map((entry) => (
                <SelectItem key={String(entry)} value={String(entry)}>
                  {options?.label ? options.label(entry) : String(entry)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    },
  };
}

type NumberFieldOptions = {
  parse: (value: string) => number | null | undefined;
  fallback: number | null | undefined;
  type?: "number";
  min?: number;
};

export function numberField<T extends Named>(
  label: string,
  field: FieldKey<T>,
  options: NumberFieldOptions,
): CatalogField<T> {
  return {
    label,
    half: true,
    control: (item, update) => {
      const current = item[field] as number | null | undefined;
      return (
        <Input
          aria-label={`${label} for ${item.name}`}
          type={options.type}
          min={options.min}
          value={current == null ? "" : String(current)}
          onChange={(event) =>
            update({
              ...item,
              [field]: options.parse(event.target.value) ?? options.fallback,
            } as T)
          }
        />
      );
    },
  };
}

type IntegerFieldOptions = {
  type?: "number";
  min?: number;
  fallback?: number | null;
};

export function integerField<T extends Named>(
  label: string,
  field: FieldKey<T>,
  options?: IntegerFieldOptions,
): CatalogField<T> {
  return numberField(label, field, {
    parse: toInteger,
    fallback: options && "fallback" in options ? options.fallback : 0,
    type: options?.type,
    min: options?.min,
  });
}

export function optionalNumberField<T extends Named>(
  label: string,
  field: FieldKey<T>,
): CatalogField<T> {
  return {
    label,
    half: true,
    control: (item, update) => (
      <DecimalInput
        label={item.name ? `${label} for ${item.name}` : label}
        value={item[field] as number | null | undefined}
        onValue={(next) => update({ ...item, [field]: next } as T)}
      />
    ),
  };
}

export function checkboxField<T extends Named>(
  label: string,
  field: FieldKey<T>,
): CatalogField<T> {
  return {
    label,
    orientation: "horizontal",
    control: (item, update) => (
      <Checkbox
        aria-label={label}
        checked={item[field] === true}
        onCheckedChange={(checked) =>
          update({ ...item, [field]: checked === true } as T)
        }
      />
    ),
  };
}
