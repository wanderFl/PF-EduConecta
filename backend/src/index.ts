// Cargar variables de entorno desde .env
import { config } from "dotenv";
config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth";
import protectedRoutes from "./routes/protected";

// Rutas que añadiste tú
import studentsRoutes from "./routes/students";
import tasksRoutes from "./routes/tasks";
import attendanceRoutes from "./routes/attendance";
import disciplinaryReportsRoutes from "./routes/disciplinaryReports";
import communicationsRoutes from "./routes/communications";
import teachersRoutes from "./routes/teachers";
import uploadsRoutes from "./routes/uploads";
import aiRoutes from "./routes/aiRoutes";
import notificationsRoutes from "./routes/notifications";

// Rutas / utilidades que venían de dev
import { verifySmtpConnection } from "./utils/email";
import familiaRoutes from "./routes/familia";
import commRoutes from "./routes/communications";
import ceiafRoutes from "./routes/ceiafRoutes";
import directivoRoutes from "./routes/directivo";

// (Opcional) probar conexión SMTP al arrancar
verifySmtpConnection().catch((err) => {
  console.error("Error verificando conexión SMTP:", err);
});

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// TEMP: Debug routes ANTES de las rutas protegidas
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend server is working!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/communications-status", (req, res) => {
  res.json({
    status: "Communications routes are registered",
    requiresAuth: true,
    endpoints: [
      "GET /api/communications/teacher (requires DOCENTE token)",
      "POST /api/communications/teacher",
      "GET /api/communications/teacher/students",
      "GET /api/communications/conversation/:id/messages",
      "POST /api/communications/conversation/:id/messages",
      "PUT /api/communications/conversation/:id/archive",
    ],
    timestamp: new Date().toISOString(),
  });
});

// Routes base
app.use("/api/auth", authRoutes);

// En dev estaba montado así (da /api/protected, /api/loquesea definido en el router)
app.use("/api/protected", protectedRoutes);

// Rutas que añadiste tú (docente, admin, etc.)
app.use("/api/students", studentsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/disciplinary-reports", disciplinaryReportsRoutes);
app.use("/api/communications", communicationsRoutes); // base docente
app.use("/api/teachers", teachersRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/ai", aiRoutes); // Rutas de IA
app.use("/api/notifications", notificationsRoutes); // Rutas de notificaciones

// Rutas familia / padres / CEIAF / directivo
app.use("/api/familia", familiaRoutes);
app.use("/api/comm", commRoutes); // base para comunicaciones de padres
app.use("/api/ceiaf", ceiafRoutes);
app.use("/api/directivo", directivoRoutes);

// Ruta para listar todas las rutas
app.get("/api/routes", (req, res) => {
  const routes: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(
        `${Object.keys(middleware.route.methods)[0].toUpperCase()} ${
          middleware.route.path
        }`
      );
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const baseRoute = middleware.regexp
            .source.replace("\\/?", "")
            .replace(/\$$/, "");
          const fullPath = `${baseRoute}${handler.route.path}`;
          routes.push(
            `${Object.keys(handler.route.methods)[0].toUpperCase()} ${fullPath}`
          );
        }
      });
    }
  });
  res.json({ routes, total: routes.length });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      message: "Something broke!",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

import { createServer } from "http";
import { initSocket } from "./socket";
import "./jobs/reminderJobs"; // Inicializar cron jobs

// Default to 3000 to match frontend dev defaults and compiled/dist behavior
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
