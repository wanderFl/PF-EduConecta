"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveConversation = exports.searchTeacherStudents = exports.sendMessage = exports.getConversationMessages = exports.createTeacherConversation = exports.listTeacherConversations = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Listar conversaciones del docente
 * GET /api/communications/teacher
 */
const listTeacherConversations = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }
        // Obtener el usuario con external_id
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { external_id: true }
        });
        if (!user || !user.external_id) {
            return res.status(403).json({
                message: 'Tu cuenta no está vinculada con un docente en el sistema del colegio.',
                needsLinking: true
            });
        }
        const teacherExternalId = parseInt(user.external_id);
        // Obtener conversaciones del docente
        const communications = await prisma.communication.findMany({
            where: {
                teacher_external_id: teacherExternalId,
                archived_by_teacher: false
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });
        res.json(communications);
    }
    catch (error) {
        console.error('Error listing teacher conversations:', error);
        res.status(500).json({ message: 'Error al obtener conversaciones' });
    }
};
exports.listTeacherConversations = listTeacherConversations;
/**
 * Crear conversación desde docente
 * POST /api/communications/teacher
 */
const createTeacherConversation = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { external_id: true }
        });
        if (!user || !user.external_id) {
            return res.status(403).json({
                message: 'Tu cuenta no está vinculada con un docente.',
                needsLinking: true
            });
        }
        const { student_external_id, subject, initialMessage, kind } = req.body;
        if (!student_external_id) {
            return res.status(400).json({ message: 'student_external_id es requerido' });
        }
        const teacherExternalId = parseInt(user.external_id);
        // Crear comunicación
        const communication = await prisma.communication.create({
            data: {
                kind: kind || 'THREAD',
                subject: subject || null,
                student_external_id: parseInt(student_external_id),
                teacher_external_id: teacherExternalId,
                status: 'OPEN',
                messages: initialMessage ? {
                    create: {
                        body: initialMessage,
                        sender_role: 'TEACHER',
                        sender_teacher_external_id: teacherExternalId
                    }
                } : undefined
            },
            include: {
                messages: true
            }
        });
        res.status(201).json(communication);
    }
    catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ message: 'Error al crear conversación' });
    }
};
exports.createTeacherConversation = createTeacherConversation;
/**
 * Obtener mensajes de una conversación
 * GET /api/communications/conversation/:conversationId/messages
 */
const getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await prisma.message.findMany({
            where: { communication_id: conversationId },
            orderBy: { createdAt: 'asc' },
            include: { attachments: true }
        });
        res.json(messages);
    }
    catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ message: 'Error al obtener mensajes' });
    }
};
exports.getConversationMessages = getConversationMessages;
/**
 * Enviar mensaje en una conversación
 * POST /api/communications/conversation/:conversationId/messages
 */
const sendMessage = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { conversationId } = req.params;
        const { body } = req.body;
        if (!body) {
            return res.status(400).json({ message: 'body es requerido' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { external_id: true }
        });
        if (!user || !user.external_id) {
            return res.status(403).json({ message: 'Usuario no vinculado' });
        }
        const teacherExternalId = parseInt(user.external_id);
        // Crear mensaje y actualizar lastMessageAt
        const message = await prisma.message.create({
            data: {
                communication_id: conversationId,
                body,
                sender_role: 'TEACHER',
                sender_teacher_external_id: teacherExternalId
            },
            include: { attachments: true }
        });
        await prisma.communication.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() }
        });
        res.status(201).json(message);
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error al enviar mensaje' });
    }
};
exports.sendMessage = sendMessage;
/**
 * Buscar estudiantes del docente
 * GET /api/communications/teacher/students
 */
const searchTeacherStudents = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { q, query: searchQuery, courseId } = req.query;
        if (!userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { external_id: true }
        });
        if (!user || !user.external_id) {
            return res.status(403).json({
                message: 'Tu cuenta no está vinculada con un docente.',
                needsLinking: true
            });
        }
        const teacherExternalId = parseInt(user.external_id);
        // Importar la conexión MySQL
        const { ceiafPool } = await Promise.resolve().then(() => __importStar(require('../ext/ceiafDb')));
        // Usar q o query (el frontend puede enviar cualquiera)
        const searchText = (q || searchQuery);
        // Buscar estudiantes del docente desde MySQL
        let sqlQuery = `
      SELECT DISTINCT
        e.id_estudiante,
        CONCAT(e.nombres, ' ', e.apellidos) as nombre_completo,
        e.cedula,
        c.id_curso,
        c.nombre as curso_nombre,
        c.nivel,
        c.paralelo
      FROM estudiantes e
      INNER JOIN cursos c ON e.id_curso = c.id_curso
      INNER JOIN docente_materia_curso dmc ON c.id_curso = dmc.id_curso
      WHERE dmc.id_docente = ?
    `;
        const params = [teacherExternalId];
        // Filtrar por curso si se especifica
        if (courseId) {
            sqlQuery += ' AND c.id_curso = ?';
            params.push(parseInt(courseId));
        }
        // Filtrar por búsqueda de texto
        if (searchText && searchText.trim()) {
            sqlQuery += ` AND (
        e.nombres LIKE ? OR 
        e.apellidos LIKE ? OR 
        e.cedula LIKE ?
      )`;
            const searchTerm = `%${searchText.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        sqlQuery += ' ORDER BY e.apellidos, e.nombres LIMIT 50';
        const [rows] = await ceiafPool.query(sqlQuery, params);
        res.json({ students: rows });
    }
    catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({ message: 'Error al buscar estudiantes' });
    }
};
exports.searchTeacherStudents = searchTeacherStudents;
/**
 * Archivar conversación
 * PUT /api/communications/conversation/:conversationId/archive
 */
const archiveConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        await prisma.communication.update({
            where: { id: conversationId },
            data: { archived_by_teacher: true }
        });
        res.json({ message: 'Conversación archivada' });
    }
    catch (error) {
        console.error('Error archiving conversation:', error);
        res.status(500).json({ message: 'Error al archivar conversación' });
    }
};
exports.archiveConversation = archiveConversation;
