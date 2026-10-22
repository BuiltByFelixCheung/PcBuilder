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
import {
  AuthSubmitButton,
  AuthSuccessDialog,
  PasswordControlField,
} from "@/components/auth/AuthFormParts";
import { FieldGroup } from "@/components/ui/field";
import { applyApiFieldErrors } from "../../lib/rhf-api-errors.ts";
import { ui } from "@/i18n/translate-enum";

const PAGE_TITLE = () => ui.action("changePassword");

export function ChangePasswordPage() {
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema()),
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
      <AuthSuccessDialog
        open={dialogOpen}
        titleId="change-success-title"
        title={ui.message("passwordChanged")}
        message={ui.message("passwordUpdatedSignInAgain")}
        onClose={() => void handleLogout()}
      />
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1>{PAGE_TITLE()}</h1>
        <p className="auth-lead">{ui.message("chooseNewPassword")}</p>
        {errors.root?.message ? (
          <p className="form-error" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <FieldGroup>
          <PasswordControlField
            id="currentPassword"
            label={ui.label("currentPassword")}
            autoComplete="current-password"
            error={errors.currentPassword}
            registration={register("currentPassword")}
          />
          <PasswordControlField
            id="newPassword"
            label={ui.label("newPassword")}
            autoComplete="new-password"
            hint={ui.message("passwordHint")}
            error={errors.newPassword}
            registration={register("newPassword")}
          />
          <PasswordControlField
            id="confirmNewPassword"
            label={ui.label("confirmNewPassword")}
            autoComplete="new-password"
            error={errors.confirmNewPassword}
            registration={register("confirmNewPassword")}
          />
        </FieldGroup>
        <AuthSubmitButton
          pending={isSubmitting}
          pendingLabel={ui.label("changingPassword")}
          label={PAGE_TITLE()}
        />
      </form>
    </section>
  );
}
