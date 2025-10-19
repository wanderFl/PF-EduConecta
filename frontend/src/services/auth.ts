import api, { setAuthToken } from "./api";
import type { AuthResponse, Credentials, ParentRegistration } from "../types";

export const loginRequest = async (payload: Credentials): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/login", payload);
  if (data?.token) setAuthToken(data.token);
  return data;
};

export const logoutRequest = () => {
  setAuthToken(null);
};

export const registerParent = async (payload: ParentRegistration): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/register/parent", payload);
  if (data?.token) setAuthToken(data.token);
  return data;
};
