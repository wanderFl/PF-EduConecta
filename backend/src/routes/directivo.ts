import { Router } from "express";
import { listCourses, gradesBySubject, subjectStudentsPerformance, 
    studentSubjectTasks, getCourseBehaviorIndicator, getStudentBehavior } from "../controllers/directivo";
import { authenticate, authorize } from "../middlewares/auth"; // asumiendo que ya tienes esto
import { Role } from '@prisma/client';
import {  getSubmissionDownloadUrl } from "../controllers/uploads";

const router = Router();

/**
 * Todas las rutas de directivo protegidas y con rol DIRECTIVO
 */
router.use(authenticate, authorize(Role.DIRECTIVO));

router.get("/courses", listCourses);
router.get("/courses/:courseId/analytics/grades-by-subject", gradesBySubject);
router.get("/courses/subject/:courseId/:subjectId/students", subjectStudentsPerformance);
router.get("/courses/:courseId/subject/:subjectId/students/:studentId/tasks", studentSubjectTasks);
router.get("/submission-download-url", getSubmissionDownloadUrl);
router.get("/courses/:courseId/behavior", getCourseBehaviorIndicator);
router.get("/behavior/student/:courseId/:studentId", getStudentBehavior);
export default router;


