const SESSION_KEY = "askare.auth.session";

export type SessionRole = "patient" | "doctor" | "admin";
export type AdminType = "SUPER_ADMIN" | "HOSPITAL_ADMIN" | "PHARMA_ADMIN";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: SessionRole;
  type?: AdminType;
  status?: string;
  profileImage?: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user?: SessionUser;
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

export function getSessionUser() {
  return getSession()?.user ?? null;
}

export function updateSessionUser(patch: Partial<SessionUser>) {
  const session = getSession();
  if (session?.user) saveSession({ ...session, user: { ...session.user, ...patch } });
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

/** Where each kind of user lands after login. */
export function homeFor(user?: Pick<SessionUser, "role" | "type"> | null) {
  if (!user) return "/login";
  if (user.role === "patient") return "/patient/dashboard";
  if (user.role === "doctor") return "/doctor/dashboard";
  if (user.type === "HOSPITAL_ADMIN") return "/hospital/dashboard";
  return "/admin/dashboard";
}
