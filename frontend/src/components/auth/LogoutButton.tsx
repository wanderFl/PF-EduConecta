import React from "react";
import { useAuth } from "../../hooks/useAuth";

interface LogoutButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = "",
  variant = "outline",
  size = "md"
}) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-red-600 hover:bg-red-700 text-white border-red-600";
      case "secondary":
        return "bg-gray-600 hover:bg-gray-700 text-white border-gray-600";
      case "outline":
        return "bg-transparent hover:bg-red-50 text-red-600 border-red-600 hover:text-red-700";
      default:
        return "bg-transparent hover:bg-red-50 text-red-600 border-red-600 hover:text-red-700";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-sm";
      case "md":
        return "px-4 py-2 text-base";
      case "lg":
        return "px-6 py-3 text-lg";
      default:
        return "px-4 py-2 text-base";
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`
        inline-flex items-center justify-center
        border rounded-md font-medium
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      Cerrar sesión
    </button>
  );
};