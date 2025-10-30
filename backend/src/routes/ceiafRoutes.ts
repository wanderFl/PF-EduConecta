import express from "express";
import { getStudentName, getTeacherName, getTeacherSubject } from "../controllers/ceiafController";

const router = express.Router();

router.get("/student/:id", getStudentName);
router.get("/teacher/:id", getTeacherName);
router.get("/teacher/:id/subject", getTeacherSubject);

export default router;
