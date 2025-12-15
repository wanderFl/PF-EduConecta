import admin from "firebase-admin";
import { PrismaClient } from "@prisma/client";
import { getIO } from "../socket";

// Inicializar Firebase Admin (Asegúrate de tener las credenciales configuradas)
// En producción, usa variables de entorno para las credenciales
let firebaseInitialized = false;
if (!admin.apps.length) {
  try {
    // Solo inicializar si todas las credenciales están presentes
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Reemplazo crítico para manejar los saltos de línea en variables de entorno
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin inicializado correctamente');
    } else {
      console.log('⚠️  Firebase Admin no configurado (credenciales faltantes en .env)');
    }
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error);
    console.log('⚠️  Notificaciones push deshabilitadas');
  }
}

const prisma = new PrismaClient();

export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  eventType: string,
  data: any = {}
) => {
  try {
    console.log(`🔔 Sending notification to ${userId}: ${title}`);

    // 1. Intentar enviar por Socket.IO (Tiempo Real)
    try {
      const io = getIO();
      // Emitir a la sala del usuario
      io.to(userId).emit("notification", {
        title,
        message,
        eventType,
        data,
        timestamp: new Date(),
      });
      console.log(`✅ Socket event sent to room ${userId}`);
    } catch (socketError) {
      console.warn("⚠️ Could not send socket event (maybe not initialized):", socketError);
    }

    // 2. Enviar Push Notification (FCM)
    // Buscar tokens del usuario
    const tokens = await prisma.deviceToken.findMany({
      where: { user_id: userId },
    });

    if (tokens.length > 0) {
      const fcmTokens = tokens.map((t) => t.fcm_token);
      
      // Payload para FCM
      const payload = {
        notification: {
          title,
          body: message,
        },
        data: {
          eventType,
          ...Object.keys(data).reduce((acc, key) => {
            acc[key] = String(data[key]); // FCM data values must be strings
            return acc;
          }, {} as any),
        },
        tokens: fcmTokens,
      };

      // Enviar multicast (si hay firebase configurado)
      if (admin.apps.length) {
        // Usar sendEachForMulticast en lugar de sendMulticast para firebase-admin v13+
        const response = await admin.messaging().sendEachForMulticast(payload);
        console.log(`✅ FCM sent: ${response.successCount} success, ${response.failureCount} failure`);
        
        // Limpieza de tokens inválidos (opcional pero recomendado)
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp: admin.messaging.SendResponse, idx: number) => {
            if (!resp.success) {
              failedTokens.push(fcmTokens[idx]);
            }
          });
          if (failedTokens.length > 0) {
             await prisma.deviceToken.deleteMany({
               where: { fcm_token: { in: failedTokens } }
             });
          }
        }
      } else {
        console.log("ℹ️ FCM skipped (Firebase not initialized)");
      }
    }
  } catch (error) {
    console.error("❌ Error in sendNotification:", error);
  }
};
