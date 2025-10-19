import { createContext } from "react";
import type { User, Credentials, ParentRegistration } from "../types";

export type AuthContextValue = {
    user: User | null;
    token: string | null;
    login: (creds: Credentials) => Promise<void>;
    register: (data: ParentRegistration) => Promise<void>;
    logout: () => void;
    initialized: boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);