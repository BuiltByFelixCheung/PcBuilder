import type { ReactNode } from "react";
import { toInteger } from "@/api/helper";
import { DecimalInput } from "@/components/catalog/DecimalInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChoiceSelect, emptyChoice } from "@/components/ChoiceSelect";
import { ui } from "@/i18n/translate-enum";

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
    label: ui.label("name"),
    control: (item, update) => (
      <Input
        aria-label={ui.message("fieldFor", { field: ui.label("name"), name: item.name })}
        value={item.name}
        onChange={(event) => update({ ...item, name: event.target.value })}
      />
    ),
  };
}

const emptyOption = emptyChoice;

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
        <ChoiceSelect
          label={label}
          ariaLabel={
            item.name
              ? ui.message("fieldFor", { field: label, name: item.name })
              : label
          }
          value={known ? current : emptyChoice}
          blankLabel={blankLabel}
          showBlank={showBlank}
          options={choices.map((option) => ({
            value: option.id,
            label: option.name,
          }))}
          onValueChange={(next) =>
            update({
              ...item,
              [field]: next === emptyChoice ? "" : next,
            } as T)
          }
        />
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
        <ChoiceSelect
          label={label}
          ariaLabel={
            item.name
              ? ui.message("fieldFor", { field: label, name: item.name })
              : label
          }
          value={known ? currentValue : emptyOption}
          blankLabel={options?.emptyLabel}
          showBlank={showBlank}
          options={values.map((entry) => ({
            value: String(entry),
            label: options?.label ? options.label(entry) : String(entry),
          }))}
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
        />
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
          aria-label={ui.message("fieldFor", { field: label, name: item.name })}
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
        label={item.name ? ui.message("fieldFor", { field: label, name: item.name }) : label}
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
