"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const client_1 = require("@prisma/client");
const ceiafDb_1 = require("../ext/ceiafDb");
const s3_1 = require("../services/s3");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Protected routes examples
router.get('/directivo/dashboard', auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.DIRECTIVO), (req, res) => {
    res.json({ message: 'Directivo dashboard data' });
});
router.get('/docente/courses', auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.DOCENTE), (req, res) => {
    res.json({ message: 'Docente courses data' });
});
// Endpoint para crear tarea (soporta archivo via FormData que se sube a S3)
router.post('/docente/tareas/create', auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.DOCENTE), ...upload_1.uploadTaskFileToS3, upload_1.handleUploadError, async (req, res) => {
    try {
        const { nombre, instrucciones, puntuacion, fechaVencimiento, cursoId, subjectId, paralelo, trimestre, aporte, fileUrl } = req.body;
        console.log('📝 Datos recibidos para crear tarea:', {
            nombre,
            instrucciones,
            puntuacion,
            fechaVencimiento,
            cursoId,
            subjectId,
            paralelo,
            trimestre,
            aporte,
            hasFile: !!fileUrl
        });
        // Validaciones básicas
        if (!nombre || !fechaVencimiento || !cursoId || !subjectId) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, fecha de vencimiento, curso y materia son requeridos'
            });
        }
        // Validar trimestre si se proporciona
        const trimestreNum = trimestre ? parseInt(trimestre, 10) : null;
        if (trimestre && (isNaN(trimestreNum) || trimestreNum < 1 || trimestreNum > 3)) {
            return res.status(400).json({
                success: false,
                message: 'El trimestre debe ser 1, 2 o 3'
            });
        }
        // Validar aporte si se proporciona
        const aporteNum = aporte ? parseInt(aporte, 10) : null;
        if (aporte && (isNaN(aporteNum) || aporteNum < 1 || aporteNum > 2)) {
            return res.status(400).json({
                success: false,
                message: 'El aporte debe ser 1 o 2'
            });
        }
        // Validar puntuación
        const puntuacionNum = puntuacion ? parseFloat(puntuacion) : 0;
        if (isNaN(puntuacionNum) || puntuacionNum < 0 || puntuacionNum > 10) {
            return res.status(400).json({
                success: false,
                message: 'La puntuación debe ser un número entre 0 y 10'
            });
        }
        // Validar fecha
        const fechaDate = new Date(fechaVencimiento);
        if (isNaN(fechaDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Fecha de vencimiento inválida'
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
        if (courseExternalId === 0) {
            return res.status(400).json({
                success: false,
                message: `Curso inválido: ${cursoId}. Use un número (8-13) o formato válido (8vo, 9no, etc.)`
            });
        }
        console.log('✅ Datos validados:', {
            courseExternalId,
            puntuacionNum,
            teacherExternalId
        });
        // El archivo ya fue subido a S3 desde el frontend, solo guardamos la URL
        const fileReference = fileUrl || null;
        if (fileReference) {
            console.log('Archivo adjunto en S3:', fileReference);
        }
        // Validar subject_external_id
        const subjectExternalId = parseInt(subjectId, 10);
        if (isNaN(subjectExternalId) || subjectExternalId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de materia inválido'
            });
        }
        // Crear registro en la tabla tasks de Prisma
        const task = await prisma.task.create({
            data: {
                title: nombre,
                instructions: instrucciones || null,
                max_points: puntuacionNum || null,
                file_reference: fileReference,
                due_date: fechaDate,
                teacher_external_id: teacherExternalId,
                course_external_id: courseExternalId,
                subject_external_id: subjectExternalId,
                trimestre: trimestreNum,
                aporte: aporteNum
            }
        });
        console.log('Tarea guardada en Prisma:', {
            id: task.id,
            title: task.title,
            fileReference: task.file_reference
        });
        res.status(201).json({
            success: true,
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
        console.error('❌ Error creating task:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
router.get('/familia/students', auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.FAMILIA), (req, res) => {
    res.json({ message: 'Familia students data' });
});
// Endpoint para obtener tareas de un curso específico con estudiantes y calificaciones
router.get('/docente/tareas/:cursoId', auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.DOCENTE), async (req, res) => {
    try {
        const { cursoId } = req.params;
        // Convertir cursoId a course_external_id
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
        const courseExternalId = parseCourseId(cursoId);
        // Obtener teacher_external_id del usuario autenticado
        const teacherUser = await prisma.user.findUnique({ where: { id: req.user?.userId } });
        const teacherExternalId = teacherUser && teacherUser.external_id ? parseInt(teacherUser.external_id, 10) : null;
        if (!teacherExternalId) {
            return res.status(403).json({
                success: false,
                message: 'Usuario no vinculado con un docente'
            });
        }
        // Obtener tareas del curso filtradas por el docente autenticado
        const tasks = await prisma.task.findMany({
            where: {
                course_external_id: courseExternalId,
                teacher_external_id: teacherExternalId
            },
            include: {
                submissions: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });
        // Obtener estudiantes del curso desde MySQL
        let students = [];
        try {
            const [rows] = await ceiafDb_1.ceiafPool.execute('SELECT id_estudiante as id, CONCAT(nombres, " ", apellidos) as nombre_completo FROM estudiantes WHERE id_curso = ?', [courseExternalId]);
            students = rows || [];
        }
        catch (error) {
            console.error('Error fetching students from MySQL:', error);
            // Si no se puede conectar a MySQL, devolver array vacío
            students = [];
        }
        // Formatear respuesta
        const formattedTasks = tasks.map(task => ({
            id: task.id,
            title: task.title,
            instructions: task.instructions,
            due_date: task.due_date,
            max_points: task.max_points,
            file_reference: task.file_reference,
            created_at: task.created_at,
            students: students.map((student) => {
                const submission = task.submissions.find(sub => sub.student_external_id === student.id);
                return {
                    id: student.id,
                    nombre_completo: student.nombre_completo,
                    grade: submission?.grade ? parseFloat(submission.grade.toString()) : null,
                    file_reference: submission?.file_reference || null,
                    submission_id: submission?.id || null,
                    comment_student: submission?.student_comment || null,
                    comment_teacher: submission?.teacher_comment || null,
                    submitted_at: submission?.submitted_at || null,
                    graded_at: submission?.graded_at || null,
                    has_submission: !!submission
                };
            })
        }));
        res.json({
            success: true,
            tasks: formattedTasks
        });
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
// Endpoint para calificar una tarea específica de un estudiante
router.post('/docente/tareas/:tareaId/calificar', auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.DOCENTE), async (req, res) => {
    try {
        const { tareaId } = req.params;
        const { studentId, grade, comment } = req.body;
        // Validaciones
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'ID del estudiante es requerido'
            });
        }
        if (grade === null || grade === undefined) {
            return res.status(400).json({
                success: false,
                message: 'La calificación es requerida'
            });
        }
        const gradeNum = parseFloat(grade);
        if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
            return res.status(400).json({
                success: false,
                message: 'La calificación debe ser un número entre 0 y 10'
            });
        }
        // Verificar que la tarea existe
        const task = await prisma.task.findUnique({
            where: { id: tareaId }
        });
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }
        // Verificar que el estudiante existe en MySQL
        try {
            const [rows] = await ceiafDb_1.ceiafPool.execute('SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?', [studentId]);
            if (!rows || rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante no encontrado'
                });
            }
        }
        catch (error) {
            console.error('Error validating student in MySQL:', error);
            return res.status(500).json({
                success: false,
                message: 'Error validando estudiante'
            });
        }
        // Buscar si ya existe una calificación
        let submission = await prisma.submissionGrade.findFirst({
            where: {
                task_id: tareaId,
                student_external_id: parseInt(studentId)
            }
        });
        if (submission) {
            // Actualizar calificación existente
            submission = await prisma.submissionGrade.update({
                where: { id: submission.id },
                data: {
                    grade: gradeNum,
                    teacher_comment: comment || null,
                    graded_at: new Date()
                }
            });
        }
        else {
            // Crear nueva calificación
            submission = await prisma.submissionGrade.create({
                data: {
                    task_id: tareaId,
                    student_external_id: parseInt(studentId),
                    grade: gradeNum,
                    teacher_comment: comment || null,
                    graded_at: new Date()
                }
            });
        }
        res.json({
            success: true,
            message: 'Calificación registrada exitosamente',
            submission: {
                id: submission.id,
                grade: parseFloat(submission.grade?.toString() || '0'),
                comment_teacher: submission.teacher_comment,
                comment_student: submission.student_comment,
                student_id: submission.student_external_id,
                graded_at: submission.graded_at,
                submitted_at: submission.submitted_at
            }
        });
    }
    catch (error) {
        console.error('Error saving grade:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
// Endpoint para generar URL de descarga de archivos de entregas desde S3
router.get('/docente/files/submissions/download', auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.DOCENTE), async (req, res) => {
    try {
        const { fileRef } = req.query;
        if (!fileRef || typeof fileRef !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'fileRef es requerido'
            });
        }
        // Extraer objectKey de la URL completa de S3
        const marker = '.amazonaws.com/';
        let objectKey;
        if (fileRef.includes(marker)) {
            const parts = fileRef.split(marker);
            objectKey = decodeURI(parts[1]);
        }
        else {
            objectKey = fileRef;
        }
        // Generar URL firmada para descarga
        const downloadUrl = await (0, s3_1.getPresignedGetUrl)(objectKey);
        res.json({
            success: true,
            url: downloadUrl
        });
    }
    catch (error) {
        console.error('Error generating download URL:', error);
        res.status(500).json({
            success: false,
            message: 'Error generando URL de descarga'
        });
    }
});
// Endpoint para generar URL de descarga de archivos de tareas desde S3
router.get('/docente/files/tasks/download', auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.DOCENTE), async (req, res) => {
    try {
        const { fileRef } = req.query;
        if (!fileRef || typeof fileRef !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'fileRef es requerido'
            });
        }
        // Extraer objectKey de la URL completa de S3
        const marker = '.amazonaws.com/';
        let objectKey;
        if (fileRef.includes(marker)) {
            const parts = fileRef.split(marker);
            objectKey = decodeURI(parts[1]);
        }
        else {
            objectKey = fileRef;
        }
        // Generar URL firmada para descarga
        const downloadUrl = await (0, s3_1.getPresignedGetUrl)(objectKey);
        res.json({
            success: true,
            url: downloadUrl
        });
    }
    catch (error) {
        console.error('Error generating download URL:', error);
        res.status(500).json({
            success: false,
            message: 'Error generando URL de descarga'
        });
    }
});
exports.default = router;
