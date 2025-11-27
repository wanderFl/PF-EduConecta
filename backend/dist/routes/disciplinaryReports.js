"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const client_1 = require("@prisma/client");
const disciplinaryReports_1 = require("../controllers/disciplinaryReports");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación y rol INSPECTOR
router.use(auth_1.authenticate, (0, auth_1.authorize)(client_1.Role.INSPECTOR));
router.get('/courses', disciplinaryReports_1.getCoursesAndParalelos);
router.get('/students', disciplinaryReports_1.getStudentsByCourse);
router.post('/', disciplinaryReports_1.createDisciplinaryReport);
router.get('/my-reports', disciplinaryReports_1.getInspectorReports);
exports.default = router;
