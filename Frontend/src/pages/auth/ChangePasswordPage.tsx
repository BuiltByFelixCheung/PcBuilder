import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { firstError, parseApiError } from "../../api/errors.ts";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "../../auth/schemas.ts";
import { useAuth } from "../../auth/use-auth.ts";
import { FormTextField } from "@/components/FormTextField.tsx";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { applyApiFieldErrors } from "../../lib/rhf-api-errors.ts";

const PAGE_TITLE = "Change Password";

export function ChangePasswordPage() {
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: ChangePasswordValues) {
    try {
      await changePassword(values);
      setDialogOpen(true);
    } catch (error) {
      const parsed = parseApiError(error);
      applyApiFieldErrors(setError, parsed.fieldErrors, [
        "currentPassword",
        "newPassword",
        "confirmNewPassword",
      ]);
      const currentPasswordError = firstError(
        parsed.fieldErrors,
        "currentPassword",
      );
      const newPasswordError = firstError(parsed.fieldErrors, "newPassword");
      const confirmNewPasswordError = firstError(
        parsed.fieldErrors,
        "confirmNewPassword",
      );
      if (currentPasswordError)
        setError("currentPassword", {
          type: "manual",
          message: currentPasswordError,
        });

      if (newPasswordError)
        setError("newPassword", { type: "manual", message: newPasswordError });

      if (confirmNewPasswordError)
        setError("confirmNewPassword", {
          type: "manual",
          message: confirmNewPasswordError,
        });

      const nextFormError = firstError(parsed.fieldErrors, "identity");
      if (nextFormError) setError("root", { message: nextFormError });
      else if (parsed.status !== 400)
        setError("root", { message: parsed.message });
    }
  }

  async function handleLogout() {
    await logout();
    void navigate("/login", { replace: true });
  }

  return (
    <section className="auth-page">
      <dialog
        className="auth-dialog"
        open={dialogOpen}
        aria-labelledby="change-success-title"
      >
        <div className="auth-dialog-card">
          <h2 id="change-success-title">Password changed</h2>
          <p>Your password has been updated. You have to sign in again.</p>
          <button
            type="button"
            className="auth-submit"
            onClick={() => void handleLogout()}
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
            id="currentPassword"
            label="Current Password"
            type="password"
            autoComplete="current-password"
            required
            error={errors.currentPassword}
            registration={register("currentPassword")}
          />
          <FormTextField
            id="newPassword"
            label="New Password"
            type="password"
            autoComplete="new-password"
            required
            hint="At least 10 characters, with upper and lower case, a number, and a symbol."
            error={errors.newPassword}
            registration={register("newPassword")}
          />
          <FormTextField
            id="confirmNewPassword"
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmNewPassword}
            registration={register("confirmNewPassword")}
          />
        </FieldGroup>
        <Button
          type="submit"
          size="lg"
          className="mt-6 h-10 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Changing Password…" : PAGE_TITLE}
        </Button>
      </form>
    </section>
  );
}
