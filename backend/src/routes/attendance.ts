import { Router } from 'express';
import { Role, PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate, authorize(Role.INSPECTOR));

// Obtener todos los registros de asistencia con filtros
router.get('/', async (req, res) => {
  try {
    const {
      course_id,
      parallel,
      start_date,
      end_date,
      student_id
    } = req.query;

    let where: any = {};

    if (course_id) {
      where.course_external_id = parseInt(course_id as string);
    }

    if (student_id) {
      where.student_external_id = parseInt(student_id as string);
    }

    if (start_date || end_date) {
      where.date = {};
      if (start_date) {
        where.date.gte = new Date(start_date as string);
      }
      if (end_date) {
        where.date.lte = new Date(end_date as string);
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { student_external_id: 'asc' }
      ]
    });

    // TODO: Si necesitamos nombres de estudiantes, aquí deberíamos hacer una llamada
    // al sistema externo o mantener una cache
    
    res.json({
      success: true,
      data: records,
      count: records.length
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros de asistencia',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Obtener asistencia por curso
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, parallel } = req.query;

    let where: any = {
      course_external_id: parseInt(courseId)
    };

    if (date) {
      where.date = new Date(date as string);
    }

    // TODO: Agregar filtro por paralelo cuando esté disponible en el esquema

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { student_external_id: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: records,
      count: records.length
    });

  } catch (error) {
    console.error('Error fetching attendance by course:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener asistencia del curso',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Crear un registro de asistencia individual
router.post('/', async (req, res) => {
  try {
    const {
      student_external_id,
      course_external_id,
      date,
      status,
      justification_file_reference
    } = req.body;

    // Validaciones básicas
    if (!student_external_id || !course_external_id || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: student_external_id, course_external_id, date, status'
      });
    }

    // Verificar si ya existe un registro para esta fecha y estudiante
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        student_external_id: parseInt(student_external_id),
        date: new Date(date)
      }
    });

    let record;

    if (existingRecord) {
      // Actualizar registro existente
      record = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          status,
          course_external_id: parseInt(course_external_id),
          justification_file_reference: justification_file_reference || null
        }
      });
    } else {
      // Crear nuevo registro
      record = await prisma.attendanceRecord.create({
        data: {
          student_external_id: parseInt(student_external_id),
          course_external_id: parseInt(course_external_id),
          date: new Date(date),
          status,
          justification_file_reference: justification_file_reference || null
        }
      });
    }

    res.json({
      success: true,
      data: record,
      message: existingRecord ? 'Registro actualizado exitosamente' : 'Registro creado exitosamente'
    });

  } catch (error) {
    console.error('Error creating/updating attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear/actualizar registro de asistencia',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Crear múltiples registros de asistencia (bulk)
router.post('/bulk', async (req, res) => {
  try {
    const {
      course_external_id,
      date,
      records
    } = req.body;

    // Validaciones básicas
    if (!course_external_id || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: course_external_id, date, records (array)'
      });
    }

    const attendanceDate = new Date(date);
    const createdRecords = [];
    const updatedRecords = [];

    // Procesar cada registro
    for (const recordData of records) {
      const {
        student_external_id,
        status,
        justification_file_reference
      } = recordData;

      if (!student_external_id || !status) {
        continue; // Saltar registros inválidos
      }

      // Verificar si ya existe un registro
      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
          student_external_id: parseInt(student_external_id),
          date: attendanceDate
        }
      });

      if (existingRecord) {
        // Actualizar registro existente
        const updated = await prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            status,
            course_external_id: parseInt(course_external_id),
            justification_file_reference: justification_file_reference || null
          }
        });
        updatedRecords.push(updated);
      } else {
        // Crear nuevo registro
        const created = await prisma.attendanceRecord.create({
          data: {
            student_external_id: parseInt(student_external_id),
            course_external_id: parseInt(course_external_id),
            date: attendanceDate,
            status,
            justification_file_reference: justification_file_reference || null
          }
        });
        createdRecords.push(created);
      }
    }

    res.json({
      success: true,
      data: [...createdRecords, ...updatedRecords],
      summary: {
        created: createdRecords.length,
        updated: updatedRecords.length,
        total: createdRecords.length + updatedRecords.length
      },
      message: 'Registros de asistencia procesados exitosamente'
    });

  } catch (error) {
    console.error('Error creating bulk attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear registros masivos de asistencia',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Actualizar un registro de asistencia
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      justification_file_reference
    } = req.body;

    const record = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        status: status || undefined,
        justification_file_reference: justification_file_reference !== undefined 
          ? justification_file_reference 
          : undefined
      }
    });

    res.json({
      success: true,
      data: record,
      message: 'Registro actualizado exitosamente'
    });

  } catch (error: any) {
    console.error('Error updating attendance record:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Registro de asistencia no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar registro de asistencia',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Eliminar un registro de asistencia
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.attendanceRecord.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Registro eliminado exitosamente'
    });

  } catch (error: any) {
    console.error('Error deleting attendance record:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Registro de asistencia no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar registro de asistencia',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Obtener estadísticas de asistencia
router.get('/stats', async (req, res) => {
  try {
    const {
      course_id,
      parallel,
      start_date,
      end_date
    } = req.query;

    let where: any = {};

    if (course_id) {
      where.course_external_id = parseInt(course_id as string);
    }

    if (start_date || end_date) {
      where.date = {};
      if (start_date) {
        where.date.gte = new Date(start_date as string);
      }
      if (end_date) {
        where.date.lte = new Date(end_date as string);
      }
    }

    // Obtener todos los registros con los filtros
    const records = await prisma.attendanceRecord.findMany({
      where
    });

    // Calcular estadísticas
    const totalRecords = records.length;
    const presentCount = records.filter((r: any) => r.status === 'presente').length;
    const absentCount = records.filter((r: any) => r.status === 'ausente').length;
    const lateCount = records.filter((r: any) => r.status === 'atraso').length;

    // Obtener estudiantes únicos para calcular el total
    const uniqueStudents = new Set(records.map((r: any) => r.student_external_id));
    const totalStudents = uniqueStudents.size;

    // Calcular porcentaje de asistencia
    const attendancePercentage = totalRecords > 0 
      ? Math.round((presentCount / totalRecords) * 100)
      : 0;

    const stats = {
      total_students: totalStudents,
      total_records: totalRecords,
      present_count: presentCount,
      absent_count: absentCount,
      late_count: lateCount,
      attendance_percentage: attendancePercentage,
      pending_grading: 0 // No aplicable para asistencia, pero mantenemos compatibilidad
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de asistencia',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Subir archivo de justificación (placeholder)
router.post('/upload-justification', async (req, res) => {
  try {
    // TODO: Implementar subida de archivos con multer
    // Por ahora retornamos un placeholder
    
    res.json({
      success: true,
      data: {
        file_reference: `justification_${Date.now()}.pdf`
      },
      message: 'Archivo subido exitosamente (simulado)'
    });

  } catch (error) {
    console.error('Error uploading justification file:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir archivo de justificación',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Exportar reporte de asistencia (placeholder)
router.get('/export', async (req, res) => {
  try {
    // TODO: Implementar generación de reportes en Excel/PDF
    // Por ahora retornamos un mensaje
    
    res.json({
      success: true,
      message: 'Exportación de reporte no implementada aún'
    });

  } catch (error) {
    console.error('Error exporting attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar reporte de asistencia',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;
