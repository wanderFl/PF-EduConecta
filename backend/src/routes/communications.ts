import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  listParentConversations,
  createConversation,
  listMessages,
  postMessage,
  toggleArchiveParent,
  searchTeachersForStudent
} from "../controllers/communications";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate, authorize(Role.FAMILIA));

// (A) Listar conversaciones del padre (con filtro opcional por tipo)
router.get("/parent/conversations", listParentConversations);

// (B) Crear conversación (THREAD o NOTICE)
router.post("/parent/conversations", createConversation);

// (C) Listar mensajes de una conversación (cursor/limit)
router.get("/conversations/:id/messages", listMessages);

// (D) Enviar mensaje en una conversación (rol PARENT en este endpoint)
router.post("/conversations/:id/messages", postMessage);

// (E) Archivar/desarchivar conversación para el padre
router.post("/conversations/:id/archive", toggleArchiveParent);

// (F) Buscar docentes asignados al estudiante por nombre (conexión a CEIAF)
router.get("/parent/teachers", searchTeachersForStudent);

export default router;
