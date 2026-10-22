import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { parseApiError } from "../../api/errors.ts";
import { getPostLoginPath } from "../../auth/redirect.ts";
import { loginSchema, type LoginValues } from "../../auth/schemas.ts";
import { useAuth } from "../../auth/use-auth.ts";
import { FormTextField } from "../../components/FormTextField.tsx";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "../../lib/rhf-api-errors.ts";
import { ui } from "@/i18n/translate-enum";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema()),
    defaultValues: { email: "", password: "" },
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: LoginValues) {
    try {
      await login(values.email, values.password);
      void navigate(getPostLoginPath(location.state), { replace: true });
    } catch (error) {
      const parsed = parseApiError(error);
      applyApiFieldErrors(setError, parsed.fieldErrors, ["email", "password"]);
      applyApiFormError(setError, parsed);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1 style={{ textAlign: "center" }}>{ui.page("signIn")}</h1>
        <p className="auth-lead">{ui.message("loginLead")}</p>
        {errors.root?.message ? (
          <p className="form-error" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <FieldGroup>
          <FormTextField
            id="email"
            label={ui.label("email")}
            type="email"
            autoComplete="username"
            required
            error={errors.email}
            registration={register("email")}
          />
          <FormTextField
            id="password"
            label={ui.label("password")}
            type="password"
            autoComplete="current-password"
            required
            error={errors.password}
            registration={register("password")}
            labelAction={<Link to="/forgot-password">{ui.action("resetPassword")}</Link>}
          />
        </FieldGroup>
        <Button
          type="submit"
          size="lg"
          className="mt-6 h-10 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? ui.label("signingIn") : ui.action("signIn")}
        </Button>
        <p className="auth-switch" style={{ textAlign: "center" }}>
          {ui.message("newHere")} <Link to="/register">{ui.action("createAccount")}</Link>
        </p>
      </form>
    </section>
  );
}
