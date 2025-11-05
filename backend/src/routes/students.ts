import { Router } from 'express';
import { getStudentsByCourse, getStudentById, searchStudents, getAllCourses } from '../services/students';
import { 
  saveAttendance, 
  saveBulkAttendance, 
  getAttendanceByDate,
  getStudentAttendanceHistory,
  getStudentAttendanceStats,
  ATTENDANCE_STATUS 
} from '../services/attendance';

const router = Router();

// GET /api/students/courses - Obtener todos los cursos
router.get('/courses', async (req, res) => {
  try {
    const courses = await getAllCourses();
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cursos'
    });
  }
});

// GET /api/students/course/:courseId - Obtener estudiantes por curso
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const students = await getStudentsByCourse(courseId);
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    console.error('Error fetching students by course:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estudiantes del curso'
    });
  }
});

// GET /api/students/:studentId - Obtener estudiante por ID
router.get('/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de estudiante inválido'
      });
    }

    const student = await getStudentById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Estudiante no encontrado'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estudiante'
    });
  }
});

// GET /api/students/search/:query - Buscar estudiantes
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const students = await searchStudents(query);
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({
      success: false,
      error: 'Error al buscar estudiantes'
    });
  }
});

// POST /api/students/attendance - Guardar asistencia individual
router.post('/attendance', async (req, res) => {
  try {
    const { student_id, date, status, justification_file, course_id } = req.body;

    if (!student_id || !date || !status || !course_id) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: student_id, date, status, course_id'
      });
    }

    if (!Object.values(ATTENDANCE_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado de asistencia inválido'
      });
    }

    const attendanceDate = new Date(date);
    const record = await saveAttendance(
      parseInt(student_id),
      parseInt(course_id),
      attendanceDate,
      status,
      justification_file
    );

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Error al guardar asistencia'
    });
  }
});

// POST /api/students/attendance/bulk - Guardar asistencia masiva
router.post('/attendance/bulk', async (req, res) => {
  try {
    const { date, attendances, course_id } = req.body;

    if (!date || !attendances || !Array.isArray(attendances) || !course_id) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: date, attendances (array), course_id'
      });
    }

    // Validar cada registro de asistencia
    for (const attendance of attendances) {
      if (!attendance.student_external_id || !attendance.status) {
        return res.status(400).json({
          success: false,
          error: 'Cada registro debe tener student_external_id y status'
        });
      }

      if (!Object.values(ATTENDANCE_STATUS).includes(attendance.status)) {
        return res.status(400).json({
          success: false,
          error: `Estado de asistencia inválido: ${attendance.status}`
        });
      }
    }

    const attendanceDate = new Date(date);
    const courseIdNum = parseInt(course_id);
    const records = await saveBulkAttendance(attendances, attendanceDate, courseIdNum);

    res.json({
      success: true,
      data: records,
      count: records.length
    });
  } catch (error) {
    console.error('Error saving bulk attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Error al guardar asistencia masiva'
    });
  }
});

// GET /api/students/attendance/date/:date - Obtener asistencia por fecha
router.get('/attendance/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { student_ids } = req.query;

    const attendanceDate = new Date(date);
    let studentIdList: number[] | undefined;

    if (student_ids && typeof student_ids === 'string') {
      studentIdList = student_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    }

    const records = await getAttendanceByDate(attendanceDate, studentIdList);

    res.json({
      success: true,
      data: records,
      count: records.length
    });
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener asistencia por fecha'
    });
  }
});

// GET /api/students/:studentId/attendance/history - Historial de asistencia
router.get('/:studentId/attendance/history', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { start_date, end_date } = req.query;

    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de estudiante inválido'
      });
    }

    const startDate = start_date ? new Date(start_date as string) : undefined;
    const endDate = end_date ? new Date(end_date as string) : undefined;

    const records = await getStudentAttendanceHistory(studentId, startDate, endDate);

    res.json({
      success: true,
      data: records,
      count: records.length
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial de asistencia'
    });
  }
});

// GET /api/students/:studentId/attendance/stats - Estadísticas de asistencia
router.get('/:studentId/attendance/stats', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { start_date, end_date } = req.query;

    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de estudiante inválido'
      });
    }

    const startDate = start_date ? new Date(start_date as string) : undefined;
    const endDate = end_date ? new Date(end_date as string) : undefined;

    const stats = await getStudentAttendanceStats(studentId, startDate, endDate);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de asistencia'
    });
  }
});

export default router;