import type { User } from "../types";

const TOKEN_KEY = "edu_token";
const USER_KEY = "edu_user";

export const saveAuth = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const loadAuth = (): { token: string | null; user: User | null } => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  return { token, user: userRaw ? JSON.parse(userRaw) : null };
};
