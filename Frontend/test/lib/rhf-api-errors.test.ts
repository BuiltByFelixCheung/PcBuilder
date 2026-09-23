import { describe, expect, it, vi } from "vitest";
import {
  applyApiFieldErrors,
  applyApiFormError,
} from "@/lib/rhf-api-errors.ts";

describe("applyApiFieldErrors", () => {
  it("sets matching field errors and skips missing ones", () => {
    const setError = vi.fn();
    applyApiFieldErrors(setError, { Email: ["Taken."] }, ["email", "password"]);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "Taken.",
    });
  });
});

describe("applyApiFormError", () => {
  it("skips generic 400s that only have field errors", () => {
    const setError = vi.fn();
    applyApiFormError(setError, {
      status: 400,
      message: "Taken.",
      fieldErrors: { email: ["Taken."] },
    });
    expect(setError).not.toHaveBeenCalled();
  });

  it("sets identity or fallback message on the form", () => {
    const setError = vi.fn();
    applyApiFormError(setError, {
      status: 400,
      message: "Fallback",
      fieldErrors: { identity: ["Locked."] },
    });
    expect(setError).toHaveBeenCalledWith("root", { message: "Locked." });

    setError.mockClear();
    applyApiFormError(setError, {
      status: 500,
      message: "Down",
      fieldErrors: {},
    });
    expect(setError).toHaveBeenCalledWith("root", { message: "Down" });
  });
});
