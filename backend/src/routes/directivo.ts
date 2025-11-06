import { Router } from "express";
import { listCourses, gradesBySubject } from "../controllers/directivo";
import { authenticate, authorize } from "../middlewares/auth"; // asumiendo que ya tienes esto
import { Role } from '@prisma/client';

const router = Router();

/**
 * Todas las rutas de directivo protegidas y con rol DIRECTIVO
 */
router.use(authenticate, authorize(Role.DIRECTIVO));

router.get("/courses", listCourses);
router.get("/courses/:courseId/analytics/grades-by-subject", gradesBySubject);
export default router;


