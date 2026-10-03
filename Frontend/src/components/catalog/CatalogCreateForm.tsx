import { type ReactNode, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import type { CatalogField } from "@/components/catalog/CatalogFields";
import {
  EditableCollectionTable,
  type ChildCollectionColumn,
  type CollectionDraft,
} from "@/components/catalog/ChildCollectionDialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type Identified = { id: string };

export function CatalogCreateForm({
  title,
  backTo,
  backLabel,
  saving,
  error,
  onSubmit,
  children,
}: Readonly<{
  title: string;
  backTo: string;
  backLabel: string;
  saving: boolean;
  error: string | null;
  onSubmit: () => void;
  children: ReactNode;
}>) {
  function submit(event: SubmitEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="catalog-page">
      <div className="catalog-detail-title">
        <h1>{title}</h1>
      </div>
      <p>
        <Link to={backTo}>{backLabel}</Link>
      </p>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <form className="grid min-w-0 gap-8 *:min-w-0" onSubmit={submit}>
        {children}
        <div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create"}
          </Button>
        </div>
      </form>
    </section>
  );
}

type FieldRun<T> =
  | { kind: "single"; field: CatalogField<T> }
  | { kind: "half"; fields: CatalogField<T>[] };

function fieldRuns<T>(fields: readonly CatalogField<T>[]): FieldRun<T>[] {
  const runs: FieldRun<T>[] = [];
  for (const field of fields) {
    const last = runs.at(-1);
    if (field.half && last?.kind === "half") {
      last.fields.push(field);
    } else if (field.half) {
      runs.push({ kind: "half", fields: [field] });
    } else {
      runs.push({ kind: "single", field });
    }
  }
  return runs;
}

export function CatalogScalarFields<T extends Identified>({
  fields,
  item,
  onChange,
}: Readonly<{
  fields: readonly CatalogField<T>[];
  item: T;
  onChange: (item: T) => void;
}>) {
  return (
    <FieldGroup className="w-full max-w-full gap-3">
      {fieldRuns(fields).map((run) =>
        run.kind === "half" ? (
          <div
            key={run.fields.map((field) => field.label).join("\0")}
            className="grid min-w-0 grid-cols-2 gap-3"
          >
            {run.fields.map((field) => (
              <CatalogFieldRow
                key={field.label}
                field={field}
                item={item}
                onChange={onChange}
              />
            ))}
          </div>
        ) : (
          <CatalogFieldRow
            key={run.field.label}
            field={run.field}
            item={item}
            onChange={onChange}
          />
        ),
      )}
    </FieldGroup>
  );
}

function CatalogFieldRow<T extends Identified>({
  field,
  item,
  onChange,
}: Readonly<{
  field: CatalogField<T>;
  item: T;
  onChange: (item: T) => void;
}>) {
  const control = field.control(item, onChange);
  const label = <FieldLabel>{field.label}</FieldLabel>;
  return (
    <Field orientation={field.orientation}>
      {field.orientation === "horizontal" ? (
        <>
          {control}
          {label}
        </>
      ) : (
        <>
          {label}
          {control}
        </>
      )}
    </Field>
  );
}

export function CatalogFieldRows<T extends Identified>({
  fields,
  item,
  onChange,
}: Readonly<{
  fields: readonly CatalogField<T>[];
  item: T;
  onChange: (item: T) => void;
}>) {
  return fields.map((field) => (
    <CatalogFieldRow
      key={field.label}
      field={field}
      item={item}
      onChange={onChange}
    />
  ));
}

export function CatalogCollectionEditor<T>({
  title,
  columns,
  rows,
  createRow,
  onChange,
  disabled = false,
}: Readonly<{
  title: string;
  columns: readonly ChildCollectionColumn<T>[];
  rows: readonly CollectionDraft<T>[];
  createRow: () => T;
  onChange: (rows: CollectionDraft<T>[]) => void;
  disabled?: boolean;
}>) {
  return (
    <Card className="catalog-collection-card min-w-0 max-w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full [&_select]:w-auto [&_select]:min-w-24 [&_table]:w-max [&_table]:min-w-full">
        <EditableCollectionTable
          rows={rows}
          columns={columns}
          disabled={disabled}
          addLabel={`Add ${title}`}
          createRow={createRow}
          onChange={onChange}
        />
      </CardContent>
    </Card>
  );
}
