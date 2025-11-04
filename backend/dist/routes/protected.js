"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const prisma_1 = require("../../generated/prisma");
const router = (0, express_1.Router)();
const prisma = new prisma_1.PrismaClient();
// Protected routes examples
router.get('/directivo/dashboard', auth_1.authenticate, (0, auth_1.authorize)(prisma_1.Role.DIRECTIVO), (req, res) => {
    res.json({ message: 'Directivo dashboard data' });
});
router.get('/docente/courses', auth_1.authenticate, (0, auth_1.authorize)(prisma_1.Role.DOCENTE), (req, res) => {
    res.json({ message: 'Docente courses data' });
});
// Endpoint para crear tarea con soporte de archivos adjuntos
router.post('/docente/tareas/create', auth_1.authenticate, (0, auth_1.authorize)(prisma_1.Role.DOCENTE), upload_1.uploadTaskFile, upload_1.handleUploadError, async (req, res) => {
    try {
        const { nombre, instrucciones, puntuacion, fechaVencimiento, cursoId } = req.body;
        // Validaciones básicas
        if (!nombre || !fechaVencimiento || !cursoId) {
            return res.status(400).json({
                message: 'Nombre, fecha de vencimiento y curso son requeridos'
            });
        }
        // Resolver teacher_external_id: buscar usuario y tomar su external_id si existe
        const teacherUser = await prisma.user.findUnique({ where: { id: req.user?.userId } });
        const teacherExternalId = teacherUser && teacherUser.external_id ? parseInt(teacherUser.external_id, 10) : 0;
        // Resolver course_external_id: aceptar tanto valores numéricos como aliases (8vo, 9no...)
        const parseCourseId = (cid) => {
            const asInt = parseInt(cid, 10);
            if (!isNaN(asInt))
                return asInt;
            const map = {
                '8vo': 8,
                '9no': 9,
                '10mo': 10,
                '1bgu': 11,
                '2bgu': 12,
                '3bgu': 13,
            };
            return map[cid.toLowerCase()] ?? 0;
        };
        const courseExternalId = parseCourseId(String(cursoId));
        // Procesar archivo adjunto si existe
        let fileReference = null;
        if (req.file) {
            // Guardar la ruta relativa del archivo
            fileReference = `uploads/tasks/${req.file.filename}`;
            console.log('Archivo adjunto guardado:', {
                originalName: req.file.originalname,
                filename: req.file.filename,
                path: fileReference,
                size: req.file.size
            });
        }
        // Crear registro en la tabla tasks de Prisma
        const task = await prisma.task.create({
            data: {
                title: nombre,
                instructions: instrucciones || null,
                max_points: puntuacion ? parseInt(puntuacion, 10) : null,
                file_reference: fileReference,
                due_date: new Date(fechaVencimiento),
                teacher_external_id: teacherExternalId,
                course_external_id: courseExternalId
            }
        });
        console.log('Tarea guardada en Prisma:', {
            id: task.id,
            title: task.title,
            fileReference: task.file_reference
        });
        res.status(201).json({
            message: 'Tarea creada exitosamente',
            task: {
                id: task.id,
                title: task.title,
                instructions: task.instructions,
                max_points: task.max_points,
                file_reference: task.file_reference,
                due_date: task.due_date,
                course_external_id: task.course_external_id
            }
        });
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
router.get('/familia/students', auth_1.authenticate, (0, auth_1.authorize)(prisma_1.Role.FAMILIA), (req, res) => {
    res.json({ message: 'Familia students data' });
});
exports.default = router;
