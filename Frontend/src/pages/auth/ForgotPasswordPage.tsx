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

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
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
          <h2 id="forgot-success-title">Check your email</h2>
          <p>If an account exists for that address, we sent a reset link.</p>
          <button
            type="button"
            className="auth-submit"
            onClick={() => setDialogOpen(false)}
          >
            Close
          </button>
        </div>
      </dialog>
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1>Forgot Password</h1>
        <p className="auth-lead">
          Enter your email address below and we'll send you a link to reset your
          password.
        </p>
        {errors.root?.message ? (
          <p className="form-error" role="alert">
            {errors.root?.message}
          </p>
        ) : null}
        <FieldGroup>
          <FormTextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            error={errors.email}
            registration={register("email")}
          />
        </FieldGroup>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Reset Password"}
        </Button>
      </form>
    </section>
  );
}
