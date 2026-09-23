import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAuth } from "@/auth/useAuth.ts";

function Probe() {
  useAuth();
  return null;
}

describe("useAuth", () => {
  it("throws outside AuthProvider", () => {
    expect(() => render(<Probe />)).toThrow(
      "useAuth must be used inside AuthProvider",
    );
  });
});
