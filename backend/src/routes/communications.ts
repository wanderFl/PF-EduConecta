import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role, PrismaClient } from '@prisma/client';
import {
  listTeacherConversations,
  createTeacherConversation,
  getConversationMessages,
  sendMessage,
  searchTeacherStudents,
  archiveConversation
} from '../controllers/communications';
const router = Router();

// Todas las rutas requieren autenticación de DOCENTE
router.use(authenticate, authorize(Role.DOCENTE) );

// Listar conversaciones del docente
router.get('/teacher', listTeacherConversations);

// Crear nueva conversación
router.post('/teacher', createTeacherConversation);

// Buscar estudiantes del docente
router.get('/teacher/students', searchTeacherStudents);

// Obtener mensajes de una conversación
router.get('/conversation/:conversationId/messages', getConversationMessages);

// Enviar mensaje en una conversación
router.post('/conversation/:conversationId/messages', sendMessage);

// Archivar conversación
router.put('/conversation/:conversationId/archive', archiveConversation);

export default router;
