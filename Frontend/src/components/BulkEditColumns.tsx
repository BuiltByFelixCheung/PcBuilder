import type { BulkEditColumn } from "@/components/BulkEditDialog";
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
import { toInteger } from "@/api/helper";
import { DecimalInput } from "@/components/catalog/DecimalInput";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Field } from "./ui/field";

type Named = { id: string; name: string };
type IdOption = { id: string; name: string };
type FieldKey<T> = keyof T & string;

export function nameBulkColumn<T extends Named>(): BulkEditColumn<T> {
  return {
    header: "Name",
    cell: (row, update) => (
      <Input
        aria-label={`Name for ${row.name}`}
        value={row.name}
        onChange={(event) => update({ ...row, name: event.target.value })}
      />
    ),
  };
}

const emptyOption = "__blank__";

export function idSelectBulkColumn<T extends Named>(
  header: string,
  field: FieldKey<T>,
  options: readonly IdOption[] | ((row: T) => readonly IdOption[]),
  blankLabel?: string,
): BulkEditColumn<T> {
  return {
    header,
    cell: (row, update) => {
      const choices = typeof options === "function" ? options(row) : options;
      const current = (row[field] as string | undefined) ?? "";
      const known =
        current !== "" && choices.some((option) => option.id === current);
      const showBlank = blankLabel != null || !known;
      return (
        <Select
          value={known ? current : emptyOption}
          onValueChange={(next) =>
            update({
              ...row,
              [field]: next === emptyOption ? "" : next,
            } as T)
          }
        >
          <SelectTrigger
            aria-label={`${header} for ${row.name}`}
            className="w-full"
          >
            <SelectValue placeholder={blankLabel ?? ""} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{header}</SelectLabel>
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

export function enumSelectBulkColumn<
  T extends Named,
  V extends string | number,
>(
  header: string,
  field: FieldKey<T>,
  values: readonly V[],
  options?: EnumSelectOptions<V>,
): BulkEditColumn<T> {
  return {
    header,
    cell: (row, update) => {
      const current = row[field] as V | null | undefined;
      const currentValue = current == null ? "" : String(current);
      const known =
        currentValue !== "" &&
        values.some((item) => String(item) === currentValue);
      const showBlank = options?.empty != null || !known;
      return (
        <Select
          value={known ? currentValue : emptyOption}
          onValueChange={(next) => {
            if (next === emptyOption) {
              update({
                ...row,
                [field]: options?.empty === "null" ? null : "",
              } as T);
              return;
            }
            const match = values.find((item) => String(item) === next);
            update({ ...row, [field]: match ?? next } as T);
          }}
        >
          <SelectTrigger
            aria-label={`${header} for ${row.name}`}
            className="w-full"
          >
            <SelectValue placeholder={options?.emptyLabel ?? ""} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{header}</SelectLabel>
              {showBlank ? (
                <SelectItem value={emptyOption}>
                  {options?.emptyLabel ?? ""}
                </SelectItem>
              ) : null}
              {values.map((item) => (
                <SelectItem key={String(item)} value={String(item)}>
                  {options?.label ? options.label(item) : String(item)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    },
  };
}

type NumberColumnOptions = {
  parse: (value: string) => number | null | undefined;
  fallback: number | null | undefined;
  numeric?: boolean;
  type?: "number";
  min?: number;
  label?: string;
};

export function numberBulkColumn<T extends Named>(
  header: string,
  field: FieldKey<T>,
  options: NumberColumnOptions,
): BulkEditColumn<T> {
  const label = options.label ?? header;
  return {
    header,
    numeric: options.numeric,
    cell: (row, update) => {
      const current = row[field] as number | null | undefined;
      return (
        <Input
          aria-label={`${label} for ${row.name}`}
          type={options.type}
          min={options.min}
          value={current == null ? "" : String(current)}
          onChange={(event) =>
            update({
              ...row,
              [field]: options.parse(event.target.value) ?? options.fallback,
            } as T)
          }
        />
      );
    },
  };
}

export function optionalNumberColumn<T extends Named>(
  header: string,
  field: FieldKey<T>,
): BulkEditColumn<T> {
  return {
    header,
    numeric: true,
    cell: (row, update) => (
      <DecimalInput
        label={`${header} for ${row.name}`}
        value={row[field] as number | null | undefined}
        onValue={(next) => update({ ...row, [field]: next } as T)}
      />
    ),
  };
}

type IntegerColumnOptions = {
  type?: "number";
  min?: number;
  label?: string;
  fallback?: number | null;
};

export function checkboxBulkColumn<T extends Named>(
  header: string,
  field: FieldKey<T>,
): BulkEditColumn<T> {
  return {
    header,
    cell: (row, update) => (
      <Checkbox
        aria-label={`${header} for ${row.name}`}
        checked={row[field] === true}
        onCheckedChange={(checked) =>
          update({ ...row, [field]: checked === true } as T)
        }
      />
    ),
  };
}

export function switchBulkColumn<T extends Named>(
  header: string,
  field: FieldKey<T>,
  checkedLabel: string,
  uncheckedLabel: string,
): BulkEditColumn<T> {
  return {
    header,
    cell: (row, update) => (
      <Field orientation="horizontal">
        <Switch
          aria-label={`${header} for ${row.name}`}
          checked={row[field] === true}
          onCheckedChange={(checked) =>
            update({ ...row, [field]: checked === true } as T)
          }
        />
        <Label htmlFor={`${header}-${field}`}>
          {row[field] ? checkedLabel : uncheckedLabel}
        </Label>
      </Field>
    ),
  };
}

export function integerColumn<T extends Named>(
  header: string,
  field: FieldKey<T>,
  options?: IntegerColumnOptions,
) {
  return numberBulkColumn(header, field, {
    parse: toInteger,
    fallback: options && "fallback" in options ? options.fallback : 0,
    type: options?.type,
    min: options?.min,
    label: options?.label,
  });
}
