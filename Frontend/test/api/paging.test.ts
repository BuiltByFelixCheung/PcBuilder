import { describe, expect, it } from "vitest";
import { hasCompleteRange } from "@/api/paging.ts";

describe("hasCompleteRange", () => {
  it("requires both min and max", () => {
    expect(hasCompleteRange(undefined)).toBe(false);
    expect(hasCompleteRange(null)).toBe(false);
    expect(hasCompleteRange({ min: 1 })).toBe(false);
    expect(hasCompleteRange({ max: 2 })).toBe(false);
    expect(hasCompleteRange({ min: 1, max: 2 })).toBe(true);
  });
});
