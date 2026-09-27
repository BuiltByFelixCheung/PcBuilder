import type { BulkEditColumn } from "@/components/BulkEditDialog";
import { formSelectClassName } from "@/components/filters/ListFilters";
import { Input } from "@/components/ui/input";
import { toInteger, toOptionalNumber } from "@/api/helper";

type Named = { id: string; name: string };
type IdOption = { id: string; name: string };

type StringKey<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends string ? K : never;
}[keyof T];

type NumberKey<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends number ? K : never;
}[keyof T];

type ValueKey<T> = StringKey<T> | NumberKey<T>;

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

export function idSelectBulkColumn<T extends Named>(
  header: string,
  field: StringKey<T>,
  options: readonly IdOption[],
  blankLabel?: string,
): BulkEditColumn<T> {
  return {
    header,
    cell: (row, update) => (
      <select
        aria-label={`${header} for ${row.name}`}
        className={formSelectClassName}
        value={(row[field] as string | undefined) ?? ""}
        onChange={(event) =>
          update({ ...row, [field]: event.target.value } as T)
        }
      >
        {blankLabel == null ? null : <option value="">{blankLabel}</option>}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    ),
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
  field: ValueKey<T>,
  values: readonly V[],
  options?: EnumSelectOptions<V>,
): BulkEditColumn<T> {
  return {
    header,
    cell: (row, update) => {
      const current = row[field] as V | null | undefined;
      return (
        <select
          aria-label={`${header} for ${row.name}`}
          className={formSelectClassName}
          value={current == null ? "" : String(current)}
          onChange={(event) => {
            const next = event.target.value;
            const value =
              options?.empty === "null" && next === "" ? null : next;
            update({ ...row, [field]: value } as T);
          }}
        >
          {options?.empty == null ? null : (
            <option value="">{options.emptyLabel ?? ""}</option>
          )}
          {values.map((item) => (
            <option key={String(item)} value={String(item)}>
              {options?.label ? options.label(item) : String(item)}
            </option>
          ))}
        </select>
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
  field: NumberKey<T>,
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
  field: NumberKey<T>,
) {
  return numberBulkColumn(header, field, {
    parse: toOptionalNumber,
    fallback: 0,
    numeric: true,
    type: "number",
    min: 0,
  });
}

type IntegerColumnOptions = {
  type?: "number";
  min?: number;
  label?: string;
  fallback?: number | null | undefined;
};

export function integerColumn<T extends Named>(
  header: string,
  field: NumberKey<T>,
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
