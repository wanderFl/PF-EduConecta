import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getTeacherCourses,
  getTeacherSubjectsByCourse,
  getTeacherCoursesWithSubjects,
  getStudentsByCourseAndSubject,
  verifyTeacherCourseAccess,
  verifyTeacherSubjectAccess,
  getTeacherInfo
} from '../services/teachers';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate, authorize(Role.DOCENTE));

// GET /api/teachers/:teacherId - Obtener información del docente
router.get('/:teacherId', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    
    if (isNaN(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de docente inválido'
      });
    }

    const teacherInfo = await getTeacherInfo(teacherId);
    
    if (!teacherInfo) {
      return res.status(404).json({
        success: false,
        message: 'Docente no encontrado'
      });
    }

    res.json({
      success: true,
      data: teacherInfo
    });
  } catch (error) {
    console.error('Error fetching teacher info:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del docente'
    });
  }
});

// GET /api/teachers/:teacherId/courses - Obtener cursos del docente
router.get('/:teacherId/courses', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    
    console.log('📚 GET /api/teachers/:teacherId/courses', {
      teacherId,
      user: (req as any).user
    });
    
    if (isNaN(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de docente inválido'
      });
    }

    // Verificar que el usuario autenticado corresponda al docente solicitado
    const user = (req as any).user;
    if (user.external_id && parseInt(user.external_id) !== teacherId) {
      console.log('❌ Permission denied:', {
        userExternalId: user.external_id,
        requestedTeacherId: teacherId
      });
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para acceder a los cursos de este docente'
      });
    }

    console.log('✅ Fetching courses for teacher:', teacherId);
    const courses = await getTeacherCourses(teacherId);
    console.log('✅ Courses fetched:', courses.length);
    
    res.json({
      success: true,
      data: courses,
      count: courses.length
    });
  } catch (error) {
    console.error('❌ Error in GET /api/teachers/:teacherId/courses:', error);
    console.error('Error fetching teacher courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cursos del docente'
    });
  }
});

// GET /api/teachers/:teacherId/courses-with-subjects - Obtener cursos con materias
router.get('/:teacherId/courses-with-subjects', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    
    if (isNaN(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de docente inválido'
      });
    }

    // Verificar que el usuario autenticado corresponda al docente solicitado
    const user = (req as any).user;
    if (user.external_id && parseInt(user.external_id) !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para acceder a los cursos de este docente'
      });
    }

    const coursesWithSubjects = await getTeacherCoursesWithSubjects(teacherId);
    
    res.json({
      success: true,
      data: coursesWithSubjects,
      count: coursesWithSubjects.length
    });
  } catch (error) {
    console.error('Error fetching teacher courses with subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cursos y materias del docente'
    });
  }
});

// GET /api/teachers/:teacherId/courses/:courseId/subjects - Obtener materias de un curso
router.get('/:teacherId/courses/:courseId/subjects', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const courseId = parseInt(req.params.courseId);
    
    if (isNaN(teacherId) || isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de docente o curso inválido'
      });
    }

    // Verificar que el usuario autenticado corresponda al docente solicitado
    const user = (req as any).user;
    if (user.external_id && parseInt(user.external_id) !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para acceder a este recurso'
      });
    }

    // Verificar que el docente tenga acceso al curso
    const hasAccess = await verifyTeacherCourseAccess(teacherId, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para acceder a este curso'
      });
    }

    const subjects = await getTeacherSubjectsByCourse(teacherId, courseId);
    
    res.json({
      success: true,
      data: subjects,
      count: subjects.length
    });
  } catch (error) {
    console.error('Error fetching teacher subjects by course:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener materias del curso'
    });
  }
});

// GET /api/teachers/:teacherId/courses/:courseId/subjects/:subjectId/students
// Obtener estudiantes de una materia específica
router.get('/:teacherId/courses/:courseId/subjects/:subjectId/students', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const courseId = parseInt(req.params.courseId);
    const subjectId = parseInt(req.params.subjectId);
    
    if (isNaN(teacherId) || isNaN(courseId) || isNaN(subjectId)) {
      return res.status(400).json({
        success: false,
        message: 'IDs inválidos'
      });
    }

    // Verificar que el usuario autenticado corresponda al docente solicitado
    const user = (req as any).user;
    if (user.external_id && parseInt(user.external_id) !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para acceder a este recurso'
      });
    }

    // Verificar que el docente tenga acceso a la materia en el curso
    const hasAccess = await verifyTeacherSubjectAccess(teacherId, courseId, subjectId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para acceder a esta materia en este curso'
      });
    }

    const students = await getStudentsByCourseAndSubject(teacherId, courseId, subjectId);
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    console.error('Error fetching students by course and subject:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudiantes'
    });
  }
});

export default router;
