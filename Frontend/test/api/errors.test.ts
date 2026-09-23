import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { describe, expect, it } from "vitest";
import { firstError, parseApiError } from "@/api/errors.ts";

function axiosError(
  status?: number,
  data?: unknown,
  includeResponse = true,
): AxiosError {
  const error = new AxiosError("boom");
  if (includeResponse) {
    error.response = {
      status: status ?? 400,
      data,
      statusText: "Error",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    } as AxiosResponse;
  }
  return error;
}

describe("parseApiError", () => {
  it("handles non-axios errors", () => {
    expect(parseApiError(new Error("nope"))).toEqual({
      message: "Something went wrong. Try again.",
      fieldErrors: {},
    });
  });

  it("handles missing responses and 5xx as unreachable", () => {
    expect(parseApiError(axiosError(500, {}, false)).message).toMatch(
      /Cannot reach the server/,
    );
    expect(parseApiError(axiosError(503)).message).toMatch(
      /Cannot reach the server/,
    );
  });

  it("maps 401 and 423", () => {
    expect(parseApiError(axiosError(401)).message).toBe(
      "Invalid email or password.",
    );
    expect(parseApiError(axiosError(423)).message).toMatch(/locked/);
  });

  it("uses identity, field, detail, then title", () => {
    expect(
      parseApiError(axiosError(400, { errors: { "": ["Identity failed."] } }))
        .message,
    ).toBe("Identity failed.");
    expect(
      parseApiError(axiosError(400, { errors: { Email: ["Taken."] } })).message,
    ).toBe("Taken.");
    expect(parseApiError(axiosError(400, { detail: "Nope." })).message).toBe(
      "Nope.",
    );
    expect(
      parseApiError(axiosError(400, { title: "Bad request" })).message,
    ).toBe("Bad request");
  });

  it("falls back to axios message", () => {
    const error = axiosError(400, {});
    error.message = "network";
    expect(parseApiError(error).message).toBe("network");
  });
});

describe("firstError", () => {
  it("matches field names case-insensitively", () => {
    expect(firstError({ Email: ["Taken."] }, "email")).toBe("Taken.");
    expect(firstError({ email: ["Taken."] }, "missing")).toBeUndefined();
  });
});
