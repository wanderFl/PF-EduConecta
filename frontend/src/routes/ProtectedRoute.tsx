import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";

type Props = {
  children: React.ReactElement;
  roles?: Role[];
};

export const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  const { user, initialized } = useAuth();

  if (!initialized) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
