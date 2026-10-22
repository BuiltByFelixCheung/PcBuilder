import type { ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { FormTextField } from "@/components/FormTextField";
import { Button } from "@/components/ui/button";
import { ui } from "@/i18n/translate-enum";

type PasswordControl = {
  id: string;
  label: string;
  autoComplete: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  hint?: string;
};

export function PasswordControlField({
  id,
  label,
  autoComplete,
  error,
  registration,
  hint,
}: Readonly<PasswordControl>) {
  return (
    <FormTextField
      id={id}
      label={label}
      type="password"
      autoComplete={autoComplete}
      required
      hint={hint}
      error={error}
      registration={registration}
    />
  );
}

export function AuthSubmitButton({
  pending,
  pendingLabel,
  label,
}: Readonly<{
  pending: boolean;
  pendingLabel: string;
  label: ReactNode;
}>) {
  return (
    <Button
      type="submit"
      size="lg"
      className="mt-6 h-10 w-full"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function AuthSuccessDialog({
  open,
  titleId,
  title,
  message,
  onClose,
}: Readonly<{
  open: boolean;
  titleId: string;
  title: string;
  message: string;
  onClose: () => void;
}>) {
  return (
    <dialog className="auth-dialog" open={open} aria-labelledby={titleId}>
      <div className="auth-dialog-card">
        <h2 id={titleId}>{title}</h2>
        <p>{message}</p>
        <button type="button" className="auth-submit" onClick={onClose}>
          {ui.action("close")}
        </button>
      </div>
    </dialog>
  );
}
