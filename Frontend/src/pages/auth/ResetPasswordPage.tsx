import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { firstError, parseApiError } from "../../api/errors.ts";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "../../auth/schemas.ts";
import { useAuth } from "../../auth/use-auth.ts";
import { FormTextField } from "@/components/FormTextField.tsx";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { applyApiFieldErrors } from "../../lib/rhf-api-errors.ts";

const PAGE_TITLE = "Reset Password";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const email = searchParams.get("email")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const hasResetLink = email !== "" && token !== "";

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: ResetPasswordValues) {
    try {
      await resetPassword({
        email,
        token,
        newPassword: values.password,
        confirmNewPassword: values.confirmPassword,
      });
      setDialogOpen(true);
    } catch (error) {
      const parsed = parseApiError(error);
      applyApiFieldErrors(setError, parsed.fieldErrors, [
        "password",
        "confirmPassword",
      ]);
      const passwordError = firstError(parsed.fieldErrors, "newPassword");
      const confirmError = firstError(parsed.fieldErrors, "confirmNewPassword");
      if (passwordError)
        setError("password", { type: "server", message: passwordError });
      if (confirmError) {
        setError("confirmPassword", { type: "server", message: confirmError });
      }
      const nextFormError =
        firstError(parsed.fieldErrors, "identity") ??
        firstError(parsed.fieldErrors, "token") ??
        firstError(parsed.fieldErrors, "email");
      if (nextFormError) setError("root", { message: nextFormError });
      else if (parsed.status !== 400)
        setError("root", { message: parsed.message });
    }
  }

  if (!hasResetLink) {
    return (
      <section className="auth-page">
        <div className="auth-card">
          <h1>{PAGE_TITLE}</h1>
          <p className="auth-lead">This reset link is invalid or incomplete.</p>
          <p className="auth-switch">
            <Link to="/forgot-password">Request a new reset link</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <dialog
        className="auth-dialog"
        open={dialogOpen}
        aria-labelledby="reset-success-title"
      >
        <div className="auth-dialog-card">
          <h2 id="reset-success-title">Password reset</h2>
          <p>Your password has been updated. You can sign in with it now.</p>
          <button
            type="button"
            className="auth-submit"
            onClick={() => void navigate("/login", { replace: true })}
          >
            Close
          </button>
        </div>
      </dialog>
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1>{PAGE_TITLE}</h1>
        <p className="auth-lead">Choose a new password for your account.</p>
        {errors.root?.message ? (
          <p className="form-error" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <FieldGroup>
          <FormTextField
            id="password"
            label="New Password"
            type="password"
            autoComplete="new-password"
            required
            hint="At least 10 characters, with upper and lower case, a number, and a symbol."
            error={errors.password}
            registration={register("password")}
          />
          <FormTextField
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword}
            registration={register("confirmPassword")}
          />
        </FieldGroup>
        <Button
          type="submit"
          size="lg"
          className="mt-6 h-10 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Resetting Password…" : PAGE_TITLE}
        </Button>
      </form>
    </section>
  );
}
