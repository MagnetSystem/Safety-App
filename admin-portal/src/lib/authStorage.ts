const TOKEN_KEYS = ["accessToken", "refreshToken"] as const;
const USER_KEY = "safety_user";

export function readAuth(key: string): string | null {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

export function inferRemember(): boolean {
  return !(sessionStorage.getItem("accessToken") && !localStorage.getItem("accessToken"));
}

export function writeAuth(entries: Record<string, string>, remember: boolean) {
  const primary = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  for (const [key, value] of Object.entries(entries)) {
    primary.setItem(key, value);
    other.removeItem(key);
  }
}

export function writeUser(json: string) {
  writeAuth({ [USER_KEY]: json }, inferRemember());
}

export function clearAuth() {
  for (const key of [...TOKEN_KEYS, USER_KEY]) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
