import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import {
  getCoursesAndParalelos,
  getStudentsByCourse,
  createDisciplinaryReport,
  getInspectorReports
} from '../controllers/disciplinaryReports';

const router = Router();

// Todas las rutas requieren autenticación y rol INSPECTOR
router.use(authenticate, authorize(Role.INSPECTOR));

router.get('/courses', getCoursesAndParalelos);
router.get('/students', getStudentsByCourse);
router.post('/', createDisciplinaryReport);
router.get('/my-reports', getInspectorReports);

export default router;
