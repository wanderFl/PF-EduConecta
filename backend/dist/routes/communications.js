"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const prisma_1 = require("../../generated/prisma");
const communications_1 = require("../controllers/communications");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación de DOCENTE
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)(prisma_1.Role.DOCENTE));
// Listar conversaciones del docente
router.get('/teacher', communications_1.listTeacherConversations);
// Crear nueva conversación
router.post('/teacher', communications_1.createTeacherConversation);
// Buscar estudiantes del docente
router.get('/teacher/students', communications_1.searchTeacherStudents);
// Obtener mensajes de una conversación
router.get('/conversation/:conversationId/messages', communications_1.getConversationMessages);
// Enviar mensaje en una conversación
router.post('/conversation/:conversationId/messages', communications_1.sendMessage);
// Archivar conversación
router.put('/conversation/:conversationId/archive', communications_1.archiveConversation);
exports.default = router;
