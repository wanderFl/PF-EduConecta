import React, { useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
// Importa tu librería de toast favorita, ej: react-toastify o sonner
// import { toast } from "sonner"; 

// URL del backend (ajustar según entorno)
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const NotificationListener: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected");
      socket.emit("join", user.id);
    });

    socket.on("notification", (payload: any) => {
      console.log("🔔 Notification received:", payload);
      // Mostrar alerta visual
      alert(`${payload.title}: ${payload.message}`); 
      // O usar toast: toast(payload.title, { description: payload.message });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return null; // Este componente no renderiza nada visualmente
};

export default NotificationListener;
