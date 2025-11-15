"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATTENDANCE_STATUS = void 0;
exports.saveAttendance = saveAttendance;
exports.saveBulkAttendance = saveBulkAttendance;
exports.getAttendanceByDate = getAttendanceByDate;
exports.getStudentAttendanceHistory = getStudentAttendanceHistory;
exports.getStudentAttendanceStats = getStudentAttendanceStats;
const prisma_1 = require("../../generated/prisma");
const prisma = new prisma_1.PrismaClient();
exports.ATTENDANCE_STATUS = {
    PRESENTE: 'PRESENTE',
    AUSENTE: 'AUSENTE',
    TARDANZA: 'TARDANZA',
    JUSTIFICADO: 'JUSTIFICADO'
};
/**
 * Crear o actualizar registro de asistencia para una fecha específica
 */
async function saveAttendance(studentId, courseId, date, status, justificationFile) {
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
        }
        else {
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
    }
    catch (error) {
        console.error('Error saving attendance:', error);
        throw new Error('Error al guardar asistencia');
    }
}
/**
 * Guardar asistencia masiva para múltiples estudiantes
 */
async function saveBulkAttendance(attendances, date, courseId) {
    try {
        const results = [];
        // Procesar cada asistencia individualmente para manejar upserts
        for (const attendance of attendances) {
            const result = await saveAttendance(attendance.student_external_id, courseId, date, attendance.status, attendance.justification_file_reference);
            results.push(result);
        }
        return results;
    }
    catch (error) {
        console.error('Error saving bulk attendance:', error);
        throw new Error('Error al guardar asistencia masiva');
    }
}
/**
 * Obtener registros de asistencia por fecha
 */
async function getAttendanceByDate(date, studentIds) {
    try {
        const where = {
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
    }
    catch (error) {
        console.error('Error fetching attendance by date:', error);
        throw new Error('Error al obtener asistencia por fecha');
    }
}
/**
 * Obtener historial de asistencia de un estudiante
 */
async function getStudentAttendanceHistory(studentId, startDate, endDate) {
    try {
        const where = {
            student_external_id: studentId
        };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = startDate;
            if (endDate)
                where.date.lte = endDate;
        }
        const records = await prisma.attendanceRecord.findMany({
            where,
            orderBy: {
                date: 'desc'
            }
        });
        return records;
    }
    catch (error) {
        console.error('Error fetching student attendance history:', error);
        throw new Error('Error al obtener historial de asistencia');
    }
}
/**
 * Obtener estadísticas de asistencia de un estudiante
 */
async function getStudentAttendanceStats(studentId, startDate, endDate) {
    try {
        const records = await getStudentAttendanceHistory(studentId, startDate, endDate);
        const stats = {
            total: records.length,
            presente: records.filter(r => r.status === exports.ATTENDANCE_STATUS.PRESENTE).length,
            ausente: records.filter(r => r.status === exports.ATTENDANCE_STATUS.AUSENTE).length,
            tardanza: records.filter(r => r.status === exports.ATTENDANCE_STATUS.TARDANZA).length,
            justificado: records.filter(r => r.status === exports.ATTENDANCE_STATUS.JUSTIFICADO).length
        };
        return {
            ...stats,
            percentage_presente: stats.total > 0 ? (stats.presente / stats.total) * 100 : 0,
            percentage_ausente: stats.total > 0 ? (stats.ausente / stats.total) * 100 : 0
        };
    }
    catch (error) {
        console.error('Error calculating attendance stats:', error);
        throw new Error('Error al calcular estadísticas de asistencia');
    }
}
