import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field.tsx";

describe("Field", () => {
  it("renders labels, descriptions, and a single error", () => {
    render(
      <FieldSet>
        <FieldLegend>Account</FieldLegend>
        <FieldGroup>
          <Field data-invalid={true}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <FieldTitle>Email</FieldTitle>
            <FieldContent>
              <input id="email" />
            </FieldContent>
            <FieldDescription>Work address</FieldDescription>
            <FieldError errors={[{ message: "Required." }]} />
          </Field>
        </FieldGroup>
      </FieldSet>,
    );
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Required.")).toBeInTheDocument();
  });

  it("lists multiple unique errors and a separator", () => {
    render(
      <>
        <FieldSeparator>or</FieldSeparator>
        <FieldError
          errors={[
            { message: "First." },
            { message: "First." },
            { message: "Second." },
          ]}
        />
      </>,
    );
    expect(screen.getByText("or")).toBeInTheDocument();
    expect(screen.getByText("First.")).toBeInTheDocument();
    expect(screen.getByText("Second.")).toBeInTheDocument();
  });

  it("renders explicit error children", () => {
    render(<FieldError>Custom</FieldError>);
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });
});
