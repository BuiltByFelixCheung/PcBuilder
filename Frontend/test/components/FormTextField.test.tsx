import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormTextField } from "@/components/FormTextField.tsx";

const registration = {
  name: "email",
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
};

describe("FormTextField", () => {
  it("shows a hint when there is no error", () => {
    render(
      <FormTextField
        id="email"
        label="Email"
        hint="Use your work address."
        registration={registration}
      />,
    );
    expect(screen.getByText("Use your work address.")).toBeInTheDocument();
  });

  it("hides the hint when an error is present", () => {
    render(
      <FormTextField
        id="email"
        label="Email"
        hint="Use your work address."
        error={{ type: "required", message: "Email is required." }}
        registration={registration}
      />,
    );
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(
      screen.queryByText("Use your work address."),
    ).not.toBeInTheDocument();
  });
});
