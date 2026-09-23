import { describe, expect, it } from "vitest";
import { AuthRoles } from "@/auth/index.ts";

describe("auth barrel", () => {
  it("re-exports roles", () => {
    expect(AuthRoles.Admin).toBe("Admin");
  });
});
