import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { parseApiError } from "../../api/errors.ts";
import { registerSchema, type RegisterValues } from "../../auth/schemas.ts";
import { useAuth } from "../../auth/use-auth.ts";
import { FormTextField } from "../../components/FormTextField.tsx";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "../../lib/rhf-api-errors.ts";
import { ui } from "@/i18n/translate-enum";

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema()),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: RegisterValues) {
    try {
      await registerAccount({
        email: values.email,
        password: values.password,
        userName: values.userName,
      });
      void navigate("/account", { replace: true });
    } catch (error) {
      const parsed = parseApiError(error);
      applyApiFieldErrors(setError, parsed.fieldErrors, [
        "userName",
        "email",
        "password",
        "confirmPassword",
      ]);
      applyApiFormError(setError, parsed);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1 style={{ textAlign: "center" }}>{ui.page("createAccount")}</h1>
        <p className="auth-lead">
          {ui.message("registerLead")}
        </p>
        {errors.root?.message ? (
          <p className="form-error" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <FieldGroup>
          <FormTextField
            id="userName"
            label={ui.label("username")}
            autoComplete="username"
            required
            error={errors.userName}
            registration={register("userName")}
          />
          <FormTextField
            id="email"
            label={ui.label("email")}
            type="email"
            autoComplete="email"
            required
            error={errors.email}
            registration={register("email")}
          />
          <FormTextField
            id="password"
            label={ui.label("password")}
            type="password"
            autoComplete="new-password"
            required
            hint={ui.message("passwordHint")}
            error={errors.password}
            registration={register("password")}
          />
          <FormTextField
            id="confirmPassword"
            label={ui.label("confirmPassword")}
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
          {isSubmitting ? ui.label("creatingAccount") : ui.page("createAccount")}
        </Button>
        <p className="auth-switch" style={{ textAlign: "center" }}>
          {ui.message("alreadyHaveAccount")} <Link to="/login">{ui.action("signIn")}</Link>
        </p>
      </form>
    </section>
  );
}
