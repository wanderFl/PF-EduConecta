import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import {
  createSignedUploadUrl,
  getSubmissionDownloadUrl,
  createTeacherTaskUploadUrl,
  getTaskFileDownloadUrl
} from '../middlewares/upload';

const router = Router();

// Rutas para padres de familia (subir entregas de estudiantes)
router.post(
  '/student-submission-upload-url',
  authenticate,
  authorize(Role.FAMILIA),
  createSignedUploadUrl
);

router.get(
  '/submission-download-url',
  authenticate,
  getSubmissionDownloadUrl
);

// Rutas para docentes (subir archivos de tareas)
router.post(
  '/teacher-task-upload-url',
  authenticate,
  authorize(Role.DOCENTE),
  createTeacherTaskUploadUrl
);

router.get(
  '/task-download-url',
  authenticate,
  getTaskFileDownloadUrl
);

export default router;
