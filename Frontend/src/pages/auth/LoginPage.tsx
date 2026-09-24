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

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
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
        <h1>Sign in</h1>
        <p className="auth-lead">
          Use your PC Builder account to save and manage builds.
        </p>
        {errors.root?.message ? (
          <p className="form-error" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <FieldGroup>
          <FormTextField
            id="email"
            label="Email"
            type="email"
            autoComplete="username"
            required
            error={errors.email}
            registration={register("email")}
          />
          <FormTextField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            error={errors.password}
            registration={register("password")}
          />
        </FieldGroup>
        <Button
          type="submit"
          size="lg"
          className="mt-6 h-10 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
          <br />
          Forgot your password? <Link to="/forgot-password">Reset it</Link>
        </p>
      </form>
    </section>
  );
}
