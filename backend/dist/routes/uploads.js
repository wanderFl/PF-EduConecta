"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const client_1 = require("@prisma/client");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
// Rutas para padres de familia (subir entregas de estudiantes)
router.post('/student-submission-upload-url', auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.FAMILIA), upload_1.createSignedUploadUrl);
router.get('/submission-download-url', auth_1.authenticate, upload_1.getSubmissionDownloadUrl);
// Rutas para docentes (subir archivos de tareas)
router.post('/teacher-task-upload-url', auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.DOCENTE), upload_1.createTeacherTaskUploadUrl);
router.get('/task-download-url', auth_1.authenticate, upload_1.getTaskFileDownloadUrl);
exports.default = router;
