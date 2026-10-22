import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { parseApiError } from "../../api/errors.ts";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "../../auth/schemas.ts";
import { useAuth } from "../../auth/use-auth.ts";
import { FormTextField } from "@/components/FormTextField.tsx";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "../../lib/rhf-api-errors.ts";
import { ui } from "@/i18n/translate-enum";

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema()),
    defaultValues: { email: "" },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = form;

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      await forgotPassword(values);
      setDialogOpen(true);
    } catch (error) {
      const parsed = parseApiError(error);
      applyApiFieldErrors(setError, parsed.fieldErrors, ["email"]);
      applyApiFormError(setError, parsed);
    }
  }

  return (
    <section className="auth-page">
      <dialog
        className="auth-dialog"
        open={dialogOpen}
        aria-labelledby="forgot-success-title"
      >
        <div className="auth-dialog-card">
          <h2 id="forgot-success-title">{ui.message("checkYourEmail")}</h2>
          <p>{ui.message("resetLinkSent")}</p>
          <button
            type="button"
            className="auth-submit"
            onClick={() => setDialogOpen(false)}
          >
            {ui.action("close")}
          </button>
        </div>
      </dialog>
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1 style={{ textAlign: "center" }}>{ui.page("forgotPassword")}</h1>
        <p className="auth-lead">{ui.message("forgotLead")}</p>
        {errors.root?.message ? (
          <p className="form-error" role="alert">
            {errors.root?.message}
          </p>
        ) : null}
        <FieldGroup>
          <FormTextField
            id="email"
            label={ui.label("email")}
            type="email"
            autoComplete="email"
            required
            error={errors.email}
            registration={register("email")}
          />
        </FieldGroup>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? ui.label("sending") : ui.action("resetPassword")}
        </Button>
      </form>
    </section>
  );
}
