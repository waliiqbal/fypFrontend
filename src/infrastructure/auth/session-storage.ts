const SESSION_KEY = "askare.auth.session";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

export function saveSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(SESSION_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    clearSession();
    return null;
  }
}

export function getAccessToken() {
  return getSession()?.accessToken ?? null;
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
