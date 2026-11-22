import { env } from "@/config/env";
import { getAccessToken } from "@/infrastructure/auth/session-storage";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
};

type ErrorResponse = {
  message?: string | string[];
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { authenticated, ...requestOptions } = options;
  const accessToken = authenticated ? getAccessToken() : null;

  if (authenticated && !accessToken) {
    throw new Error("Your session has expired. Please login again.");
  }

  const response = await fetch(`${env.apiBaseUrl}${endpoint}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const data = (await response.json().catch(() => ({}))) as T & ErrorResponse;

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;
    throw new Error(message || "Something went wrong. Please try again.");
  }

  return data;
}
