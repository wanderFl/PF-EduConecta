import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import { Role } from "@prisma/client";

import {
  // DOCENTE (tu rama)
  listTeacherConversations,
  createTeacherConversation,
  getConversationMessages,
  sendMessage,
  searchTeacherStudents,
  archiveConversation,

  // FAMILIA (rama dev)
  listParentConversations,
  createConversation,
  listMessages,
  postMessage,
  searchTeachersForStudent,
} from "../controllers/communications";

const router = Router();

/* ===========================================================
   SECCIÓN DOCENTE
   Todas estas rutas requieren rol DOCENTE
   Base: /api/communications   (en index.ts)
   =========================================================== */
router.use("/teacher", authenticate, authorize(Role.DOCENTE));

// Listar conversaciones del docente
router.get("/teacher", listTeacherConversations);

// Crear nueva conversación
router.post("/teacher", createTeacherConversation);

// Buscar estudiantes del docente
router.get("/teacher/students", searchTeacherStudents);

// Obtener mensajes de una conversación
router.get("/conversation/:conversationId/messages", authenticate,authorize(Role.DOCENTE),getConversationMessages);

// Enviar mensaje en una conversación
router.post("/conversation/:conversationId/messages", authenticate,authorize(Role.DOCENTE),sendMessage);

// Archivar conversación
router.put("/conversation/:conversationId/archive", authenticate,authorize(Role.DOCENTE),archiveConversation);

/* ===========================================================
   SECCIÓN PADRE / FAMILIA
   Todas estas rutas requieren rol FAMILIA
   Base: /api/comm (en index.ts)
   =========================================================== */

// Todas las rutas de padre deben autenticarse como familia
router.use("/parent", authenticate, authorize(Role.FAMILIA));

// (A) Listar conversaciones del padre
router.get("/parent/conversations", listParentConversations);

// (B) Crear conversación (THREAD o NOTICE)
router.post("/parent/conversations", createConversation);

// (C) Listar mensajes con paginación
router.get("/conversations/:id/messages",authenticate,authorize(Role.FAMILIA), listMessages);

// (D) Enviar mensaje (rol PARENT)
router.post("/conversations/:id/messages", authenticate,authorize(Role.FAMILIA), postMessage);

// (E) Buscar docentes del estudiante (solo para padres)
router.get("/parent/teachers", searchTeachersForStudent);

export default router;
