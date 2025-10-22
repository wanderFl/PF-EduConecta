import React, { useState, useEffect } from "react";
import type { User, Credentials, ParentRegistration } from "../types";
import { loginRequest, logoutRequest, registerParent } from "../services/auth";
import { saveAuth, clearAuth, loadAuth } from "../utils/storage";
import { setAuthToken } from "../services/api";
import { AuthContext } from "./auth-context";


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = loadAuth();
    if (stored.token) {
      setToken(stored.token);
      setAuthToken(stored.token);
    }
    if (stored.user) setUser(stored.user);
    setInitialized(true);
  }, []);

  const login = async (creds: Credentials) => {
    const data = await loginRequest(creds);
    setToken(data.token);
    setUser(data.user);
    saveAuth(data.token, data.user);
  };

  const register = async (data: ParentRegistration) => {
    const response = await registerParent(data);
    setToken(response.token);
    setUser(response.user);
    saveAuth(response.token, response.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    logoutRequest();
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};
