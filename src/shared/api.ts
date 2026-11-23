import { apiRequest } from "@/infrastructure/http/api-client";

export type ApiEnvelope<T> = { success: boolean; message: string; data: T; meta?: PageMeta & Record<string, unknown> };
export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

export function toQuery(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Small typed wrapper: every call is authenticated and returns the whole envelope. */
export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined | null>) =>
    apiRequest<ApiEnvelope<T>>(`${path}${toQuery(params)}`, { authenticated: true }),
  post: <T>(path: string, body?: unknown) => apiRequest<ApiEnvelope<T>>(path, { method: "POST", body: body ?? {}, authenticated: true }),
  postForm: <T>(path: string, body: FormData) => apiRequest<ApiEnvelope<T>>(path, { method: "POST", body, authenticated: true }),
  put: <T>(path: string, body?: unknown) => apiRequest<ApiEnvelope<T>>(path, { method: "PUT", body: body ?? {}, authenticated: true }),
  patch: <T>(path: string, body?: unknown) => apiRequest<ApiEnvelope<T>>(path, { method: "PATCH", body: body ?? {}, authenticated: true }),
  del: <T>(path: string) => apiRequest<ApiEnvelope<T>>(path, { method: "DELETE", authenticated: true }),
  public: <T>(path: string, params?: Record<string, string | number | boolean | undefined | null>) =>
    apiRequest<ApiEnvelope<T>>(`${path}${toQuery(params)}`),
};
