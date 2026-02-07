/**
 * API error types for type-safe error handling
 */

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

export interface ApiError {
  response?: {
    data?: ApiErrorResponse;
    status?: number;
  };
  message?: string;
}

/**
 * Extract user-facing message from an unknown error (e.g. from mutation onError)
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as ApiError;
  return (
    apiError?.response?.data?.detail ??
    apiError?.response?.data?.message ??
    apiError?.message ??
    fallback
  );
}
