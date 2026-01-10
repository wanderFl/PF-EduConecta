import api from "./api";
import { getToken } from "firebase/messaging";
import { messaging } from "../firebase";

// TODO: Pega aquí tu VAPID Key (Key pair) de la consola de Firebase -> Cloud Messaging -> Configuración web
const VAPID_KEY = "BE-rT-MuIqDGlPmhAl40T65l9Ui7CXNMg8qQSyaG9lt5y72uAJY6KgiNN4x3_WguAZlOL8YxjbQw0A7KnelesDc";


export const requestFcmToken = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn("Notifications not supported in this browser");
      return null;
    }

    // Si no es contexto seguro, Firebase fallará
    if (!window.isSecureContext) {
       console.warn("Notifications require Secure Context (HTTPS or localhost)");
       return null;
    }

    // Comprobar permiso antes de pedirlo
    let permission = Notification.permission;
    
    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    if (permission === "granted") {
      try {
        // 1. Asegurar que tenemos un registro (sin importar estado inicial)
        const existingReg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
        if (!existingReg) {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        }

        // 2. Esperar explícitamente a que el SW esté ACTIVO y CONTROLANDO
        // Esto devuelve la registro activo correcta para el scope
        const registration = await navigator.serviceWorker.ready;
        
        console.log("✅ Service Worker activo en scope:", registration.scope);

        const currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log("🔥 FCM Token Obtained:", currentToken);
          await registerDeviceToken(currentToken, "web");
          return currentToken;
        } else {
          console.log("No registration token available.");
        }
      } catch (swError: any) {
        console.error("Service Worker/FCM Error:", swError);
        
        // Estrategia de recuperación ante "push service error" (Común en Opera/Edge con bloqueadores)
        if (swError.message && (swError.message.includes('push service error') || swError.message.includes('failed to execute \'subscribe\''))) {
            console.warn("♻️ Detectado error de servicio Push. Intentando limpiar Service Workers corruptos...");
            
            // Desregistrar todo para limpiar estado corrupto
            const registrations = await navigator.serviceWorker.getRegistrations();
            for(const reg of registrations) {
                await reg.unregister();
                console.log("🗑️ SW Eliminado:", reg.scope);
            }
            
            alert("⚠️ Error de conexión con Google FCM.\n\nPosibles causas:\n1. Opera GX: Desactiva el 'Bloqueador de Rastreadores' (Icono Escudo).\n2. Adblockers instalados.\n3. VPN activado.\n\nEl sistema ha limpiado la caché. Por favor RECARGA la página e intenta de nuevo.");
            return null;
        }

        throw swError;
      }
    } else {
      console.log("Permission not granted for notifications.");
    }
  } catch (err) {
    console.error("An error occurred while retrieving token: ", err);
    throw err;
  }
  return null;
};

export const registerDeviceToken = async (token: string, platform: "web" | "android" | "ios") => {
  // Asumimos que existe un endpoint para esto. 
  // Deberías crear la ruta en el backend si no existe, pero por ahora dejo el servicio listo.
  // Backend route suggestion: POST /api/auth/device-token
  return api.post("/auth/device-token", { token, platform });
};
