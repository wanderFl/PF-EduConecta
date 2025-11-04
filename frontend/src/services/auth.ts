import api, { setAuthToken } from "./api";
import type { AuthResponse, Credentials, ParentRegistration } from "../types";

export const loginRequest = async (payload: Credentials): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/login", payload);
  if (data?.token) setAuthToken(data.token);
  return data;
};

export const registerRequest = async (payload: ParentRegistration): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/register", payload);
  if (data?.token) setAuthToken(data.token);
  return data;
};

export const logoutRequest = () => {
  setAuthToken(null);
};

export const requestPasswordReset = async (email: string): Promise<{ message: string; dev_token?: string }> => {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
};

export const performPasswordReset = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const { data } = await api.post("/auth/reset-password", { token, newPassword });
  return data;
};
