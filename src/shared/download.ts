import { env } from "@/config/env";
import { getAccessToken } from "@/infrastructure/auth/session-storage";

/** Downloads a protected file (PDF) with the user's token and saves it in the browser. */
export async function downloadFile(path: string, filename: string) {
  const token = getAccessToken();
  if (!token) throw new Error("Your session has expired. Please login again.");
  const res = await fetch(`${env.apiBaseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new Error(message || "Download failed. Please try again.");
  }
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
