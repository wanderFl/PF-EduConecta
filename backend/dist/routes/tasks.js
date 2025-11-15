"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tasks_1 = require("../services/tasks");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Middleware de autenticación para todas las rutas
router.use(auth_1.authenticate);
// GET /api/tasks - Obtener todas las tareas
router.get('/', async (req, res) => {
    try {
        const tasks = await (0, tasks_1.getAllTasks)();
        res.json({
            success: true,
            data: tasks,
            count: tasks.length
        });
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las tareas'
        });
    }
});
// GET /api/tasks/stats - Obtener estadísticas de tareas
router.get('/stats', async (req, res) => {
    try {
        const { teacher_id, course_id, start_date, end_date } = req.query;
        const filters = {};
        if (teacher_id) {
            filters.teacher_external_id = parseInt(teacher_id);
        }
        if (course_id) {
            filters.course_external_id = parseInt(course_id);
        }
        if (start_date) {
            filters.start_date = new Date(start_date);
        }
        if (end_date) {
            filters.end_date = new Date(end_date);
        }
        const stats = await (0, tasks_1.getTasksStats)(filters);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching tasks stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de tareas'
        });
    }
});
// GET /api/tasks/course/:courseId - Obtener tareas por curso
router.get('/course/:courseId', async (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        const { paralelo } = req.query;
        if (isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de curso inválido'
            });
        }
        let tasks;
        if (paralelo && typeof paralelo === 'string') {
            tasks = await (0, tasks_1.getTasksByCourseAndParalelo)(courseId, paralelo);
        }
        else {
            tasks = await (0, tasks_1.getTasksByCourse)(courseId);
        }
        res.json({
            success: true,
            data: tasks,
            count: tasks.length
        });
    }
    catch (error) {
        console.error('Error fetching tasks by course:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las tareas del curso'
        });
    }
});
// GET /api/tasks/course/:courseId/paralelos - Obtener paralelos disponibles para un curso
router.get('/course/:courseId/paralelos', async (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        if (isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de curso inválido'
            });
        }
        const paralelos = await (0, tasks_1.getParalelosByCourse)(courseId);
        res.json({
            success: true,
            data: paralelos,
            count: paralelos.length
        });
    }
    catch (error) {
        console.error('Error fetching paralelos by course:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener paralelos del curso'
        });
    }
});
// GET /api/tasks/teacher/:teacherId - Obtener tareas por docente
router.get('/teacher/:teacherId', async (req, res) => {
    try {
        const teacherId = parseInt(req.params.teacherId);
        if (isNaN(teacherId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de docente inválido'
            });
        }
        const tasks = await (0, tasks_1.getTasksByTeacher)(teacherId);
        res.json({
            success: true,
            data: tasks,
            count: tasks.length
        });
    }
    catch (error) {
        console.error('Error fetching tasks by teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las tareas del docente'
        });
    }
});
// GET /api/tasks/:taskId - Obtener tarea específica
router.get('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await (0, tasks_1.getTaskById)(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }
        res.json({
            success: true,
            data: task
        });
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la tarea'
        });
    }
});
// POST /api/tasks - Crear nueva tarea
router.post('/', async (req, res) => {
    try {
        const { title, instructions, due_date, max_points, file_reference, teacher_external_id, course_external_id, paralelo, trimestre, aporte } = req.body;
        // Validar campos requeridos
        if (!title || !due_date || !teacher_external_id || !course_external_id) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: title, due_date, teacher_external_id, course_external_id'
            });
        }
        // Validar trimestre si se proporciona
        if (trimestre && (trimestre < 1 || trimestre > 3)) {
            return res.status(400).json({
                success: false,
                message: 'El trimestre debe ser 1, 2 o 3'
            });
        }
        // Validar aporte si se proporciona
        if (aporte && (aporte < 1 || aporte > 2)) {
            return res.status(400).json({
                success: false,
                message: 'El aporte debe ser 1 o 2'
            });
        }
        const taskData = {
            title,
            instructions,
            due_date: new Date(due_date),
            max_points: max_points ? parseInt(max_points) : undefined,
            file_reference,
            teacher_external_id: parseInt(teacher_external_id),
            course_external_id: parseInt(course_external_id),
            paralelo: paralelo || undefined,
            trimestre: trimestre ? parseInt(trimestre) : undefined,
            aporte: aporte ? parseInt(aporte) : undefined
        };
        const task = await (0, tasks_1.createTask)(taskData);
        res.status(201).json({
            success: true,
            data: task,
            message: 'Tarea creada exitosamente'
        });
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la tarea'
        });
    }
});
// PUT /api/tasks/:taskId - Actualizar tarea
router.put('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, instructions, due_date, max_points, file_reference, paralelo } = req.body;
        const taskData = {};
        if (title !== undefined)
            taskData.title = title;
        if (instructions !== undefined)
            taskData.instructions = instructions;
        if (due_date !== undefined)
            taskData.due_date = new Date(due_date);
        if (max_points !== undefined)
            taskData.max_points = parseInt(max_points);
        if (file_reference !== undefined)
            taskData.file_reference = file_reference;
        if (paralelo !== undefined)
            taskData.paralelo = paralelo;
        const task = await (0, tasks_1.updateTask)(taskId, taskData);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }
        res.json({
            success: true,
            data: task,
            message: 'Tarea actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la tarea'
        });
    }
});
// DELETE /api/tasks/:taskId - Eliminar tarea
router.delete('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const deleted = await (0, tasks_1.deleteTask)(taskId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }
        res.json({
            success: true,
            message: 'Tarea eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la tarea'
        });
    }
});
exports.default = router;
