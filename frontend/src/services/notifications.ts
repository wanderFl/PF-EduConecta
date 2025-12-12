import api from "./api";
import { getToken } from "firebase/messaging";
import { messaging } from "../firebase";

// TODO: Pega aquí tu VAPID Key (Key pair) de la consola de Firebase -> Cloud Messaging -> Configuración web
const VAPID_KEY = "BE-rT-MuIqDGlPmhAl40T65l9Ui7CXNMg8qQSyaG9lt5y72uAJY6KgiNN4x3_WguAZlOL8YxjbQw0A7KnelesDc";

export const requestFcmToken = async () => {
  try {
    // Solicitar permiso al navegador
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Obtener el token
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (currentToken) {
        console.log("🔥 FCM Token:", currentToken);
        // Registrar en el backend
        await registerDeviceToken(currentToken, "web");
        return currentToken;
      } else {
        console.log("No registration token available. Request permission to generate one.");
      }
    } else {
      console.log("Unable to get permission to notify.");
    }
  } catch (err) {
    console.log("An error occurred while retrieving token. ", err);
  }
  return null;
};

export const registerDeviceToken = async (token: string, platform: "web" | "android" | "ios") => {
  // Asumimos que existe un endpoint para esto. 
  // Deberías crear la ruta en el backend si no existe, pero por ahora dejo el servicio listo.
  // Backend route suggestion: POST /api/auth/device-token
  return api.post("/auth/device-token", { token, platform });
};
