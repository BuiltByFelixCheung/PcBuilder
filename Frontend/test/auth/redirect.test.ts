import { describe, expect, it } from "vitest";
import { buildViewReturnState, getPostLoginPath } from "@/auth/redirect.ts";

describe("getPostLoginPath", () => {
  it("returns a safe in-app path from location state", () => {
    expect(getPostLoginPath({ from: { pathname: "/account" } })).toBe(
      "/account",
    );
  });

  it("rejects auth paths, protocol-relative URLs, and junk", () => {
    expect(getPostLoginPath({ from: { pathname: "/login" } })).toBe("/account");
    expect(getPostLoginPath({ from: { pathname: "//evil.example" } })).toBe(
      "/account",
    );
    expect(getPostLoginPath({ from: { pathname: "account" } })).toBe(
      "/account",
    );
    expect(getPostLoginPath(null)).toBe("/account");
    expect(getPostLoginPath("nope")).toBe("/account");
  });
});

describe("buildViewReturnState", () => {
  it("returns the open build page", () => {
    expect(buildViewReturnState("/builds/build-1")).toEqual({
      from: { pathname: "/builds/build-1" },
    });
  });

  it("ignores the builder, my builds, and other pages", () => {
    expect(buildViewReturnState("/builds/current")).toBeUndefined();
    expect(buildViewReturnState("/builds/me")).toBeUndefined();
    expect(buildViewReturnState("/builds")).toBeUndefined();
    expect(buildViewReturnState("/account")).toBeUndefined();
  });
});
