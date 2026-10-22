import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { enumText, ui } from "@/i18n/translate-enum";

type DetailQuery = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data?: unknown;
};

export function CatalogDetailFrame({
  query,
  loadingEntity,
  backTo,
  backLabel,
  notFoundMessage,
  title,
  actions,
  children,
}: Readonly<{
  query: DetailQuery;
  loadingEntity: string;
  backTo: string;
  backLabel: string;
  notFoundMessage: string;
  title?: string;
  actions?: ReactNode;
  children?: ReactNode;
}>) {
  if (query.isPending) {
    return (
      <PageStatus>
        {ui.empty("loading", { entity: ui.entity(loadingEntity) })}
      </PageStatus>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="catalog-page">
        <p>
          <Link to={backTo}>{backLabel}</Link>
        </p>
        <PageStatus>
          {query.isError
            ? parseApiError(query.error).message
            : notFoundMessage}
        </PageStatus>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <p>
        <Link to={backTo}>{backLabel}</Link>
      </p>
      <div className="catalog-detail-title">
        <h1>{title}</h1>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function SpecTable({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div>
      <div className="catalog-detail-subtitle">
        <h2>{title}</h2>
      </div>
      <Table>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

export function SpecRow({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <TableRow>
      <TableHead className="table-stub" scope="row">
        {label}
      </TableHead>
      <TableCell>{children}</TableCell>
    </TableRow>
  );
}

export function UsbInterfaceRows({
  usbVersion,
  usbType,
}: Readonly<{
  usbVersion?: string | null;
  usbType?: string | null;
}>) {
  return (
    <>
      <SpecRow label={ui.label("usbVersion")}>
        {usbVersion ? enumText.usbVersion(usbVersion) : "—"}
      </SpecRow>
      <SpecRow label={ui.label("usbType")}>
        {usbType ? enumText.usbType(usbType) : "—"}
      </SpecRow>
    </>
  );
}
