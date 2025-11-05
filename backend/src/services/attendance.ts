import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export interface AttendanceStatus {
  PRESENTE: 'PRESENTE';
  AUSENTE: 'AUSENTE';
  TARDANZA: 'TARDANZA';
  JUSTIFICADO: 'JUSTIFICADO';
}

export const ATTENDANCE_STATUS = {
  PRESENTE: 'PRESENTE',
  AUSENTE: 'AUSENTE', 
  TARDANZA: 'TARDANZA',
  JUSTIFICADO: 'JUSTIFICADO'
} as const;

export type AttendanceStatusType = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

export interface AttendanceRecord {
  id: string;
  student_external_id: number;
  course_external_id?: number | null;
  date: Date;
  status: string;
  justification_file_reference?: string | null;
}

export interface AttendanceSubmission {
  student_external_id: number;
  course_external_id?: number;
  status: AttendanceStatusType;
  justification_file_reference?: string;
}

export interface DailyAttendance {
  date: Date;
  course_id: string;
  attendances: AttendanceSubmission[];
}

/**
 * Crear o actualizar registro de asistencia para una fecha específica
 */
export async function saveAttendance(
  studentId: number,
  courseId: number,
  date: Date,
  status: AttendanceStatusType,
  justificationFile?: string
): Promise<AttendanceRecord> {
  try {
    // Verificar si ya existe un registro para esta fecha y estudiante
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        student_external_id: studentId,
        course_external_id: courseId,
        date: {
          equals: date
        }
      }
    });

    if (existing) {
      // Actualizar registro existente
      const updated = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          status,
          justification_file_reference: justificationFile
        }
      });
      return updated;
    } else {
      // Crear nuevo registro
      const created = await prisma.attendanceRecord.create({
        data: {
          student_external_id: studentId,
          course_external_id: courseId,
          date,
          status,
          justification_file_reference: justificationFile
        }
      });
      return created;
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
    throw new Error('Error al guardar asistencia');
  }
}

/**
 * Guardar asistencia masiva para múltiples estudiantes
 */
export async function saveBulkAttendance(
  attendances: AttendanceSubmission[],
  date: Date,
  courseId: number
): Promise<AttendanceRecord[]> {
  try {
    const results: AttendanceRecord[] = [];

    // Procesar cada asistencia individualmente para manejar upserts
    for (const attendance of attendances) {
      const result = await saveAttendance(
        attendance.student_external_id,
        courseId,
        date,
        attendance.status,
        attendance.justification_file_reference
      );
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('Error saving bulk attendance:', error);
    throw new Error('Error al guardar asistencia masiva');
  }
}

/**
 * Obtener registros de asistencia por fecha
 */
export async function getAttendanceByDate(
  date: Date,
  studentIds?: number[]
): Promise<AttendanceRecord[]> {
  try {
    const where: any = {
      date: {
        equals: date
      }
    };

    if (studentIds && studentIds.length > 0) {
      where.student_external_id = {
        in: studentIds
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: {
        student_external_id: 'asc'
      }
    });

    return records;
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    throw new Error('Error al obtener asistencia por fecha');
  }
}

/**
 * Obtener historial de asistencia de un estudiante
 */
export async function getStudentAttendanceHistory(
  studentId: number,
  startDate?: Date,
  endDate?: Date
): Promise<AttendanceRecord[]> {
  try {
    const where: any = {
      student_external_id: studentId
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: {
        date: 'desc'
      }
    });

    return records;
  } catch (error) {
    console.error('Error fetching student attendance history:', error);
    throw new Error('Error al obtener historial de asistencia');
  }
}

/**
 * Obtener estadísticas de asistencia de un estudiante
 */
export async function getStudentAttendanceStats(
  studentId: number,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const records = await getStudentAttendanceHistory(studentId, startDate, endDate);
    
    const stats = {
      total: records.length,
      presente: records.filter(r => r.status === ATTENDANCE_STATUS.PRESENTE).length,
      ausente: records.filter(r => r.status === ATTENDANCE_STATUS.AUSENTE).length,
      tardanza: records.filter(r => r.status === ATTENDANCE_STATUS.TARDANZA).length,
      justificado: records.filter(r => r.status === ATTENDANCE_STATUS.JUSTIFICADO).length
    };

    return {
      ...stats,
      percentage_presente: stats.total > 0 ? (stats.presente / stats.total) * 100 : 0,
      percentage_ausente: stats.total > 0 ? (stats.ausente / stats.total) * 100 : 0
    };
  } catch (error) {
    console.error('Error calculating attendance stats:', error);
    throw new Error('Error al calcular estadísticas de asistencia');
  }
}