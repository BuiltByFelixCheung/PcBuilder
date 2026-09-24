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

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
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
        firstName: values.firstName,
        lastName: values.lastName,
      });
      void navigate("/account", { replace: true });
    } catch (error) {
      const parsed = parseApiError(error);
      applyApiFieldErrors(setError, parsed.fieldErrors, [
        "firstName",
        "lastName",
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
        <h1>Create account</h1>
        <p className="auth-lead">
          Register as a Member to save your PC builds.
        </p>
        {errors.root?.message ? (
          <p className="form-error" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <FieldGroup>
          <FormTextField
            id="firstName"
            label="First name"
            autoComplete="given-name"
            required
            error={errors.firstName}
            registration={register("firstName")}
          />
          <FormTextField
            id="lastName"
            label="Last name"
            autoComplete="family-name"
            required
            error={errors.lastName}
            registration={register("lastName")}
          />
          <FormTextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            error={errors.email}
            registration={register("email")}
          />
          <FormTextField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            hint="At least 10 characters, with upper and lower case, a number, and a symbol."
            error={errors.password}
            registration={register("password")}
          />
          <FormTextField
            id="confirmPassword"
            label="Confirm password"
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  );
}
