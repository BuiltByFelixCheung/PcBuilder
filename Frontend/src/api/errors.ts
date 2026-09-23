import axios from "axios";

export type ApiError = {
  status?: number;
  message: string;
  fieldErrors: Record<string, string[]>;
};

type ProblemDetails = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export function parseApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { message: "Something went wrong. Try again.", fieldErrors: {} };
  }

  const status = error.response?.status;

  if (!error.response || (status !== undefined && status >= 500)) {
    return {
      status,
      message: "Cannot reach the server. Is the API running?",
      fieldErrors: {},
    };
  }
  const data = error.response.data as ProblemDetails | undefined;
  const fieldErrors = normalizeFieldErrors(data?.errors);

  if (status === 401) {
    return { status, message: "Invalid email or password.", fieldErrors: {} };
  }

  if (status === 423) {
    return {
      status,
      message: "This account is locked. Try again in a few minutes.",
      fieldErrors: {},
    };
  }

  const identityError = firstError(fieldErrors, "identity");
  const firstFieldError = Object.values(fieldErrors).flat()[0];
  const message =
    identityError ??
    firstFieldError ??
    data?.detail ??
    data?.title ??
    error.message ??
    "Request failed.";

  return { status, message, fieldErrors };
}

export function firstError(
  fieldErrors: Record<string, string[]>,
  field: string,
): string | undefined {
  const match = Object.keys(fieldErrors).find(
    (key) => key.toLowerCase() === field.toLowerCase(),
  );
  return match ? fieldErrors[match][0] : undefined;
}

function normalizeFieldErrors(
  errors: Record<string, string[]> | undefined,
): Record<string, string[]> {
  if (!errors) return {};

  const normalized: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(errors)) {
    const field = key.length === 0 ? "identity" : key;
    normalized[field] = [...(normalized[field] ?? []), ...messages];
  }
  return normalized;
}
