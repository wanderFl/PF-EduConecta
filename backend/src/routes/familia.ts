import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { getLinkedChildren, findStudentByCedula, linkStudentToParent, verifyParentPin, listStudentSubjects } from '../controllers/familia';
import { getStudentTasks } from '../controllers/tasks'; 
import { submitTask } from '../controllers/submissions';
import { createSignedUploadUrl, createSignedConversationUploadUrl } from "../controllers/uploads";
import { getMonthlyAttendance, createJustificationUploadUrl, submitJustification } from "../controllers/attendance";
import { listStudentGrades } from "../controllers/familia";
import {  getSubmissionDownloadUrl, getFileDownloadUrl } from "../controllers/uploads";


const router = Router();

// Solo usuarios con rol FAMILIA
router.use(authenticate, authorize(Role.FAMILIA));

router.get('/hijos', getLinkedChildren);
router.post('/buscar-estudiante', findStudentByCedula);
router.post('/agregar-hijo', linkStudentToParent);

router.post('/tareas', getStudentTasks); // Nueva ruta para obtener tareas de un estudiante
router.post('/tareas/entregar', submitTask);
router.post('/tareas/upload-url', createSignedUploadUrl);
router.post('/comunicados/upload-url', createSignedConversationUploadUrl);
router.post('/asistencia', getMonthlyAttendance);
router.post('/asistencia/upload-url', createJustificationUploadUrl);
router.post('/asistencia/justificar', submitJustification);
router.post('/verify-pin', verifyParentPin);
router.post('/calificaciones', listStudentGrades);
router.get("/submission-download-url", getSubmissionDownloadUrl);
router.get("/download-url", getFileDownloadUrl);
router.get("/materias/:studentId", listStudentSubjects);


export default router;
