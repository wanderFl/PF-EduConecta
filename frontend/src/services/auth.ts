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
  // Normaliza email aquí por si se escapó en el form
  const email = payload.email.trim().toLowerCase();

  // MAPEAMOS confirmPassword -> confirm_password (lo que espera el backend)
  const body = {
    full_name: payload.full_name,
    email,
    cedula: payload.cedula,
    home_address: payload.home_address,
    work_place: payload.work_place,
    security_pin: payload.security_pin,
    password: payload.password,
    confirm_password: payload.confirmPassword, // <- CLAVE
  };

  const { data } = await api.post("/auth/register/parent", body);
  if (data?.token) setAuthToken(data.token);
  return data;
};

export const requestPasswordReset = async (email: string): Promise<{ message: string; dev_token?: string }> => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const performPasswordReset = async (payload: {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
}) => {
  const body = {
    email: payload.email.trim().toLowerCase(),
    token: payload.token,
    password: payload.password,
    confirm_password: payload.confirmPassword,
  };
  const { data } = await api.post('/auth/reset-password', body);
  return data as { message: string };
};