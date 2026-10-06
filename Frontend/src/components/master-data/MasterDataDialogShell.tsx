import type { ReactNode, SubmitEventHandler } from "react";
import { parseApiError } from "@/api/errors.ts";
import { PageStatus } from "@/components/PageStatus";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";

type SettledQuery<T> = {
  isPending: boolean;
  error: unknown;
  data: T | undefined;
};

type MasterDataMissingProps = {
  title: string;
  description: string;
  onClose: () => void;
};

export function MasterDataMissing({
  title,
  description,
  onClose,
}: Readonly<MasterDataMissingProps>) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

type MasterDataOptionsProps<T extends readonly unknown[]> = {
  title: string;
  loadingMessage: string;
  onClose: () => void;
  queries: { [K in keyof T]: SettledQuery<T[K]> };
  children: (data: T) => ReactNode;
};

export function MasterDataOptions<T extends readonly unknown[]>({
  title,
  loadingMessage,
  onClose,
  queries,
  children,
}: Readonly<MasterDataOptionsProps<T>>) {
  if (queries.some((query) => query.isPending)) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <PageStatus>{loadingMessage}</PageStatus>
      </>
    );
  }

  const failed = queries.find((query) => query.error || query.data == null);
  if (failed) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="form-error" role="alert">
          {parseApiError(failed.error).message}
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </>
    );
  }

  return children(queries.map((query) => query.data) as unknown as T);
}

type MasterDataFormShellProps = {
  title: string;
  description?: string;
  error?: string;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  onClose: () => void;
  children: ReactNode;
  cancelLabel?: string;
  cancelDisabled?: boolean;
  submitLabel: string;
  submitDisabled?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  deleting?: boolean;
};

export function MasterDataFormShell({
  title,
  description,
  error,
  onSubmit,
  onClose,
  children,
  cancelLabel = "Cancel",
  cancelDisabled = false,
  submitLabel,
  submitDisabled = false,
  onDelete,
  deleteDisabled = false,
  deleting = false,
}: Readonly<MasterDataFormShellProps>) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription>{description}</DialogDescription>
        ) : null}
      </DialogHeader>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <FieldGroup>{children}</FieldGroup>
      <DialogFooter>
        {onDelete ? (
          <Button
            type="button"
            variant="destructive"
            className="sm:mr-auto"
            onClick={onDelete}
            disabled={deleteDisabled}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={cancelDisabled}
        >
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={submitDisabled}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
