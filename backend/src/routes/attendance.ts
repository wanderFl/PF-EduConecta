import { Router } from 'express';
import { Role, PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth';
import { ceiafPool } from '../ext/ceiafDb';

import { sendNotification } from "../services/notificationSender";

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
        const attendanceDate = new Date(date);
        record = await prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            status,
            course_external_id: parseInt(course_external_id),
            justification_file_reference: justification_file_reference || null,
            year: attendanceDate.getFullYear(),
            month: attendanceDate.getMonth() + 1
          }
        });
      } else {
        // Crear nuevo registro
        const attendanceDate = new Date(date);
        record = await prisma.attendanceRecord.create({
          data: {
            student_external_id: parseInt(student_external_id),
            course_external_id: parseInt(course_external_id),
            date: attendanceDate,
            status,
            justification_file_reference: justification_file_reference || null,
            year: attendanceDate.getFullYear(),
            month: attendanceDate.getMonth() + 1
          }
        });
      }

      // NOTIFICACIÓN: Alerta de Inasistencia
      if (status === 'ABSENT_UNJUSTIFIED') {
        (async () => {
          try {
            const link = await prisma.parentStudentLink.findFirst({
              where: { student_external_id: String(student_external_id) },
              include: { parent: { include: { user: true } } }
            });
            if (link?.parent?.user?.id) {
              sendNotification(
                link.parent.user.id,
                "Alerta de Inasistencia",
                `Se ha registrado una falta injustificada para el estudiante.`,
                "ATTENDANCE_ALERT",
                { studentId: student_external_id, date }
              );
            }
          } catch (e) {
            console.error("Error sending attendance notification:", e);
          }
        })();
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
            justification_file_reference: justification_file_reference || null,
            year: attendanceDate.getFullYear(),
            month: attendanceDate.getMonth() + 1
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
            justification_file_reference: justification_file_reference || null,
            year: attendanceDate.getFullYear(),
            month: attendanceDate.getMonth() + 1
          }
        });
        createdRecords.push(created);
      }
    }

    // NOTIFICACIÓN MASIVA: Informar a cada padre el estado de su hijo
    (async () => {
      try {
        const studentIds = records.map((r: any) => String(r.student_external_id));
        const links = await prisma.parentStudentLink.findMany({
          where: { student_external_id: { in: studentIds } },
          include: { parent: { include: { user: true } } }
        });

        const linkMap = new Map<string, string>();
        links.forEach((l) => {
          if (l.parent?.user?.id) {
            linkMap.set(l.student_external_id, l.parent.user.id);
          }
        });

        const STATUS_MAP: Record<string, string> = {
          PRESENT: "Presente",
          ABSENT_UNJUSTIFIED: "Falta Injustificada",
          LATE: "Atraso",
          ABSENT_JUSTIFIED_PENDING: "Falta (Pendiente)",
          ABSENT_JUSTIFIED_ACCEPTED: "Falta (Justificada)"
        };

        for (const r of records) {
          const userId = linkMap.get(String(r.student_external_id));
          if (userId && r.status) {
            const statusText = STATUS_MAP[r.status] || r.status;
            // No notificar "Presente" para evitar spam diario (opcional, descomentar si se requiere)
            // if (r.status === 'PRESENT') continue; 

            const isAlert = r.status === 'ABSENT_UNJUSTIFIED' || r.status === 'LATE';
            
            sendNotification(
              userId,
              isAlert ? "Alerta de Asistencia" : "Registro de Asistencia",
              `Se ha registrado la asistencia del día. Estado: ${statusText}`,
              isAlert ? "ATTENDANCE_ALERT" : "ATTENDANCE_INFO",
              { date, status: r.status, studentId: r.student_external_id }
            );
          }
        }
      } catch (e) {
        console.error("Error sending bulk attendance notifications:", e);
      }
    })();

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

    // Calcular estadísticas usando los valores correctos del enum AttendanceStatus
    const totalRecords = records.length;
    const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
    const absentUnjustifiedCount = records.filter((r: any) => r.status === 'ABSENT_UNJUSTIFIED').length;
    const absentJustifiedPendingCount = records.filter((r: any) => r.status === 'ABSENT_JUSTIFIED_PENDING').length;
    const absentJustifiedAcceptedCount = records.filter((r: any) => r.status === 'ABSENT_JUSTIFIED_ACCEPTED').length;
    const totalAbsentCount = absentUnjustifiedCount + absentJustifiedPendingCount + absentJustifiedAcceptedCount;

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
      absent_unjustified_count: absentUnjustifiedCount,
      absent_justified_pending_count: absentJustifiedPendingCount,
      absent_justified_accepted_count: absentJustifiedAcceptedCount,
      total_absent_count: totalAbsentCount,
      attendance_percentage: attendancePercentage
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

// Obtener justificaciones pendientes
router.get('/pending-justifications', async (req, res) => {
  try {
    const { courseId } = req.query;

    let where: any = {
      status: 'ABSENT_JUSTIFIED_PENDING'
    };

    if (courseId) {
      where.course_external_id = parseInt(courseId as string);
    }

    // Obtener registros de asistencia con justificación pendiente
    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { student_external_id: 'asc' }
      ]
    });

    // Obtener información de estudiantes desde MySQL CEIAF
    let recordsWithStudentInfo;
    
    // Verificar si el pool de conexiones está disponible
    if (!ceiafPool) {
      console.warn('⚠️  CEIAF database not configured');
      recordsWithStudentInfo = records.map(record => ({
        ...record,
        student_name: `Estudiante ID: ${record.student_external_id}`
      }));
    } else {
      try {
        recordsWithStudentInfo = await Promise.all(
          records.map(async (record) => {
            try {
              const [studentRows] = await ceiafPool.execute(
                'SELECT nombres, apellidos FROM estudiantes WHERE id_estudiante = ?',
                [record.student_external_id]
              ) as any;

              const student = studentRows[0] || {};
              
              return {
                ...record,
                student_name: student.nombres && student.apellidos 
                  ? `${student.apellidos} ${student.nombres}`
                  : 'Desconocido'
              };
            } catch (error) {
              console.error(`Error fetching student ${record.student_external_id}:`, error);
              return {
                ...record,
                student_name: 'Desconocido'
              };
            }
          })
        );
      } catch (poolError) {
        // Si falla la conexión a MySQL CEIAF, devolver datos sin nombres de estudiantes
        console.error('Error connecting to CEIAF database:', poolError);
        recordsWithStudentInfo = records.map(record => ({
          ...record,
          student_name: `Estudiante ID: ${record.student_external_id}`
        }));
      }
    }

    res.json({
      success: true,
      data: recordsWithStudentInfo,
      count: recordsWithStudentInfo.length
    });

  } catch (error) {
    console.error('Error fetching pending justifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener justificaciones pendientes',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Actualizar estado de justificación (aceptar/rechazar)
router.put('/:id/justify-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, inspectorComment } = req.body; // 'accept' o 'reject' y comentario opcional

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Acción inválida. Use "accept" o "reject"'
      });
    }

    // Verificar que el registro existe y tiene status ABSENT_JUSTIFIED_PENDING
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Registro de asistencia no encontrado'
      });
    }

    if (existingRecord.status !== 'ABSENT_JUSTIFIED_PENDING') {
      return res.status(400).json({
        success: false,
        message: 'El registro no tiene una justificación pendiente'
      });
    }

    // Actualizar el estado según la acción
    const newStatus = action === 'accept' 
      ? 'ABSENT_JUSTIFIED_ACCEPTED' 
      : 'ABSENT_UNJUSTIFIED';

    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id },
      data: { 
        status: newStatus,
        inspector_comment: inspectorComment || null
      }
    });

    // NOTIFICACIÓN: Resolución de Justificación
    (async () => {
      try {
        const link = await prisma.parentStudentLink.findFirst({
          where: { student_external_id: String(existingRecord.student_external_id) },
          include: { parent: { include: { user: true } } }
        });
        if (link?.parent?.user?.id) {
          const resolution = action === 'accept' ? 'Aceptada' : 'Rechazada';
          const commentText = inspectorComment ? `Comentario: ${inspectorComment}` : "Sin comentarios del inspector.";
          
          sendNotification(
            link.parent.user.id,
            "Resolución de Justificación",
            `La justificación ha sido ${resolution}. ${commentText}`,
            "JUSTIFICATION_RESOLUTION",
            { recordId: id, status: newStatus }
          );
        }
      } catch (e) {
        console.error("Error sending justification resolution notification:", e);
      }
    })();

    res.json({
      success: true,
      data: updatedRecord,
      message: action === 'accept' 
        ? 'Justificación aceptada exitosamente'
        : 'Justificación rechazada exitosamente'
    });

  } catch (error: any) {
    console.error('Error updating justification status:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Registro de asistencia no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de justificación',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;
