import { AxiosError } from "axios";

/**
 * The API docs describe error bodies as `{code, message, timestamp}`, but
 * the live backend actually returns Spring's default shape —
 * `{timestamp, status, error, message, path | validationErrors}` — with no
 * `code` field at all (verified directly against user-service/payment-service).
 * We accept both so a future backend fix that adds `code` doesn't require a
 * frontend change, but `error` is what's actually populated today.
 */
export interface BackendErrorResponse {
  code?: string;
  error?: string;
  message: string;
  timestamp?: string;
  status?: number;
  path?: string;
  validationErrors?: Record<string, string> | null;
}

/** Normalized error shape every API client throws, regardless of backend/domain. */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public raw?: BackendErrorResponse
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isAuthError() {
    return this.statusCode === 401;
  }

  get isValidationError() {
    return this.statusCode === 400 || this.statusCode === 422;
  }

  get isConflict() {
    return this.statusCode === 409;
  }
}

/** Maps an AxiosError (or anything else thrown by an interceptor) to ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    const data = error.response?.data as BackendErrorResponse | undefined;
    if (error.response) {
      return new ApiError(
        error.response.status,
        data?.code ?? data?.error ?? "UNKNOWN_ERROR",
        data?.message ?? error.message,
        data
      );
    }
    return new ApiError(0, error.code ?? "NETWORK_ERROR", error.message);
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return new ApiError(0, "UNKNOWN_ERROR", message);
}
