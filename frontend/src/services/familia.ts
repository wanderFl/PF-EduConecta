import api from "./api";
import type { CeiafStudent, PendingTask, AttendanceMonthResp, GradeRow } from "../types";

// Obtener hijos vinculados al padre
export const getLinkedChildren = async (): Promise<CeiafStudent[]> => {
  const { data } = await api.get("/familia/hijos");
  return data as CeiafStudent[];
};

// Buscar estudiante por cédula
export const findStudentByCedula = async (cedula: string): Promise<CeiafStudent> => {
  const { data } = await api.post("/familia/buscar-estudiante", { cedula });
  return data as CeiafStudent;
};

// Vincular estudiante al padre
export const linkStudentToParent = async (student_external_id: number | string): Promise<{ message: string }> => {
  const { data } = await api.post("/familia/agregar-hijo", { student_external_id });
  return data as { message: string };
};


/**
 * Obtiene las tareas del estudiante (puede incluir filtros por fecha).
 * 
 * @param studentId ID del estudiante en CEIAF.
 * @param from Fecha inicial opcional (YYYY-MM-DD)
 * @param to Fecha final opcional (YYYY-MM-DD)
 * @returns Lista de tareas (pendientes o entregadas)
 */

// NUEVO: obtener tareas del estudiante
export const getStudentTasks = async (
  studentId: number,
  from?: string,
  to?: string
): Promise<PendingTask[]> => {
  try {
    const { data } = await api.post("/familia/tareas", { studentId, from, to });
    return (data as PendingTask[]) ?? [];
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return [];
  }
};

/**
 * Obtiene solo las tareas pendientes del estudiante.
 * Reutiliza la misma lógica de getStudentTasks.
 */
export const getPendingTasks = async (
  studentId: number,
  from?: string,
  to?: string
): Promise<PendingTask[]> => {
  const tasks = await getStudentTasks(studentId, from, to);
  return tasks.filter(t => t.status === "PENDING");
};

// NUEVO: obtener URL firmada para subir archivo de tarea
export const getSignedUploadUrl = async (params: {
  studentId: number;
  taskId: string;
  filename: string;
  contentType: string;
}): Promise<{ uploadUrl: string; fileUrl: string }> => {
  const { data } = await api.post("/familia/tareas/upload-url", params);
  return { uploadUrl: data.uploadUrl, fileUrl: data.fileUrl };
};

// NUEVO: registrar la entrega en tu API
export const submitTaskDelivery = async (payload: {
  studentId: number;
  taskId: string;
  student_comment?: string;
  file_reference: string; // URL https del objeto en S3
}): Promise<{ message: string }> => {
  const { data } = await api.post("/familia/tareas/entregar", payload);
  return data as { message: string };
};

// Obtener asistencia mensual
export const getMonthlyAttendance = async (payload: {
  studentId: number;
  year: number;
  month: number; // 1-12
}): Promise<AttendanceMonthResp> => {
  const { data } = await api.post("/familia/asistencia", payload);
  return data as AttendanceMonthResp;
};

// URL firmada para subir justificativo
export const getJustificationUploadUrl = async (payload: {
  studentId: number;
  date: string;        // YYYY-MM-DD
  filename: string;
  contentType: string;
}) => {
  const { data } = await api.post("/familia/asistencia/upload-url", payload);
  return data as { uploadUrl: string; fileUrl: string; objectKey: string };
};

// Registrar justificación (cambia estado a PENDING)
export const submitJustification = async (payload: {
  studentId: number;
  date: string;               // YYYY-MM-DD
  reason: string;
  file_reference: string;     // URL https devuelta por /upload-url
}) => {
  const { data } = await api.post("/familia/asistencia/justificar", payload);
  return data as { message: string };
};

// Verificar PIN de padre
export const verifyParentPin = async (pin: string): Promise<boolean> => {
  const { data } = await api.post('/familia/verify-pin', { pin });
  return !!data?.ok;
};

// Obtener calificaciones del estudiante
export async function getStudentGrades(studentExternalId: number): Promise<GradeRow[]> {
  const { data } = await api.post("/familia/calificaciones", {
    student_external_id: studentExternalId,
  });
  return Array.isArray(data) ? (data as GradeRow[]) : [];
}