import api from './api';

// Enum de estados de asistencia (debe coincidir con Prisma AttendanceStatus)
export type AttendanceStatus = 
  | 'PRESENT' 
  | 'ABSENT_UNJUSTIFIED' 
  | 'ABSENT_JUSTIFIED_PENDING' 
  | 'ABSENT_JUSTIFIED_ACCEPTED';

export interface AttendanceRecord {
  id: string;
  student_external_id: number;
  course_external_id: number;
  date: string;
  status: AttendanceStatus;
  justification_file_reference?: string | null;
  justification_reason?: string | null;
  student_name?: string; // Para mostrar el nombre del estudiante
}

export interface Student {
  id: number;
  name: string;
  parallel?: string;
  course_id: number;
}

interface BackendStudent {
  id: number;
  nombre_completo: string;
  paralelo?: string;
  cedula?: string;
  curso_nombre?: string;
  nivel?: string;
}

export interface AttendanceStats {
  total_students: number;
  total_records: number;
  present_count: number;
  absent_unjustified_count: number;
  absent_justified_pending_count: number;
  absent_justified_accepted_count: number;
  total_absent_count: number;
  attendance_percentage: number;
}

export interface AttendanceFilters {
  course_id?: number;
  parallel?: string;
  start_date?: string;
  end_date?: string;
  student_id?: number;
}

export interface CreateAttendanceData {
  student_external_id: number;
  course_external_id: number;
  date: string;
  status: AttendanceStatus;
  justification_file_reference?: string | null;
  justification_reason?: string | null;
}

export interface BulkAttendanceData {
  course_external_id: number;
  date: string;
  records: {
    student_external_id: number;
    status: AttendanceStatus;
    justification_file_reference?: string | null;
    justification_reason?: string | null;
  }[];
}

export const attendanceService = {
  // Obtener todos los registros de asistencia
  getAllAttendance: async (filters?: AttendanceFilters): Promise<AttendanceRecord[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.course_id) params.append('course_id', filters.course_id.toString());
      if (filters?.parallel) params.append('parallel', filters.parallel);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.student_id) params.append('student_id', filters.student_id.toString());

      const response = await api.get(`/attendance?${params.toString()}`);
      
      // Mapear los datos para incluir información del estudiante si está disponible
      const records = response.data.data;
      
      // Si hay registros y un curso seleccionado, obtener información de estudiantes para mostrar nombres
      if (records.length > 0 && filters?.course_id) {
        try {
          const studentsResponse = await api.get(`/students/course/${filters.course_id}`);
          const students = studentsResponse.data.data;
          
          // Crear un mapa de estudiantes por ID
          const studentMap = new Map();
          students.forEach((student: BackendStudent) => {
            studentMap.set(student.id, student.nombre_completo);
          });
          
          // Agregar nombres a los registros
          return records.map((record: AttendanceRecord) => ({
            ...record,
            student_name: studentMap.get(record.student_external_id) || undefined
          }));
        } catch (studentError) {
          console.warn('No se pudieron cargar los nombres de estudiantes:', studentError);
          return records;
        }
      }
      
      return records;
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw new Error('Error al obtener los registros de asistencia');
    }
  },

  // Obtener asistencia por curso
  getAttendanceByCourse: async (courseId: number, date?: string): Promise<AttendanceRecord[]> => {
    try {
      const params = date ? `?date=${date}` : '';
      const response = await api.get(`/attendance/course/${courseId}${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching attendance by course:', error);
      throw new Error('Error al obtener la asistencia del curso');
    }
  },

  // Obtener asistencia por curso y paralelo
  getAttendanceByCourseAndParallel: async (courseId: number, parallel: string, date?: string): Promise<AttendanceRecord[]> => {
    try {
      const params = new URLSearchParams();
      params.append('parallel', parallel);
      if (date) params.append('date', date);
      
      const response = await api.get(`/attendance/course/${courseId}?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching attendance by course and parallel:', error);
      throw new Error('Error al obtener la asistencia del curso y paralelo');
    }
  },

  // Obtener estudiantes por curso
  getStudentsByCourse: async (courseId: number): Promise<Student[]> => {
    try {
      const response = await api.get(`/students/course/${courseId}`);
      // Mapear la estructura de datos del backend al frontend
      return response.data.data.map((student: BackendStudent) => ({
        id: student.id,
        name: student.nombre_completo,
        parallel: student.paralelo,
        course_id: courseId
      }));
    } catch (error) {
      console.error('Error fetching students by course:', error);
      throw new Error('Error al obtener los estudiantes del curso');
    }
  },

  // Obtener estudiantes por curso y paralelo
  getStudentsByCourseAndParallel: async (courseId: number, parallel: string): Promise<Student[]> => {
    try {
      const response = await api.get(`/students/course/${courseId}?parallel=${parallel}`);
      // Mapear la estructura de datos del backend al frontend
      return response.data.data.map((student: BackendStudent) => ({
        id: student.id,
        name: student.nombre_completo,
        parallel: student.paralelo,
        course_id: courseId
      }));
    } catch (error) {
      console.error('Error fetching students by course and parallel:', error);
      throw new Error('Error al obtener los estudiantes del curso y paralelo');
    }
  },

  // Obtener paralelos disponibles para un curso
  getParallelsByCourse: async (courseId: number): Promise<string[]> => {
    try {
      const response = await api.get(`/students/course/${courseId}/parallels`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching parallels by course:', error);
      throw new Error('Error al obtener paralelos del curso');
    }
  },

  // Crear un registro de asistencia
  createAttendanceRecord: async (data: CreateAttendanceData): Promise<AttendanceRecord> => {
    try {
      const response = await api.post('/attendance', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw new Error('Error al crear el registro de asistencia');
    }
  },

  // Crear múltiples registros de asistencia (bulk)
  createBulkAttendance: async (data: BulkAttendanceData): Promise<AttendanceRecord[]> => {
    try {
      // Asegurar que la fecha esté en formato correcto
      const formattedData = {
        ...data,
        date: new Date(data.date).toISOString().split('T')[0] // Formato YYYY-MM-DD
      };
      
      const response = await api.post('/attendance/bulk', formattedData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating bulk attendance:', error);
      throw new Error('Error al crear los registros de asistencia');
    }
  },

  // Actualizar registro de asistencia
  updateAttendanceRecord: async (id: string, data: Partial<CreateAttendanceData>): Promise<AttendanceRecord> => {
    try {
      const response = await api.put(`/attendance/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw new Error('Error al actualizar el registro de asistencia');
    }
  },

  // Eliminar registro de asistencia
  deleteAttendanceRecord: async (id: string): Promise<void> => {
    try {
      await api.delete(`/attendance/${id}`);
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw new Error('Error al eliminar el registro de asistencia');
    }
  },

  // Obtener estadísticas de asistencia
  getAttendanceStats: async (filters?: AttendanceFilters): Promise<AttendanceStats> => {
    try {
      const params = new URLSearchParams();
      if (filters?.course_id) params.append('course_id', filters.course_id.toString());
      if (filters?.parallel) params.append('parallel', filters.parallel);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);

      const response = await api.get(`/attendance/stats?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      throw new Error('Error al obtener estadísticas de asistencia');
    }
  },

  // Subir archivo de justificación
  uploadJustificationFile: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/attendance/upload-justification', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data.file_reference;
    } catch (error) {
      console.error('Error uploading justification file:', error);
      throw new Error('Error al subir el archivo de justificación');
    }
  },

  // Exportar reporte de asistencia
  exportAttendanceReport: async (filters?: AttendanceFilters): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      if (filters?.course_id) params.append('course_id', filters.course_id.toString());
      if (filters?.parallel) params.append('parallel', filters.parallel);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);

      const response = await api.get(`/attendance/export?${params.toString()}`, {
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting attendance report:', error);
      throw new Error('Error al exportar el reporte de asistencia');
    }
  },

  // Utilidades
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatDateTime: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getStatusColor: (status: string): string => {
    switch (status) {
      case 'PRESENT': return 'success';
      case 'ABSENT_UNJUSTIFIED': return 'danger';
      case 'ABSENT_JUSTIFIED_PENDING': return 'warning';
      case 'ABSENT_JUSTIFIED_ACCEPTED': return 'info';
      default: return 'secondary';
    }
  },

  getStatusIcon: (status: string): string => {
    switch (status) {
      case 'PRESENT': return 'fas fa-check-circle';
      case 'ABSENT_UNJUSTIFIED': return 'fas fa-times-circle';
      case 'ABSENT_JUSTIFIED_PENDING': return 'fas fa-clock';
      case 'ABSENT_JUSTIFIED_ACCEPTED': return 'fas fa-check';
      default: return 'fas fa-question-circle';
    }
  },

  getStatusText: (status: string): string => {
    switch (status) {
      case 'PRESENT': return 'Presente';
      case 'ABSENT_UNJUSTIFIED': return 'Ausente (Sin justificar)';
      case 'ABSENT_JUSTIFIED_PENDING': return 'Ausente (Justificación pendiente)';
      case 'ABSENT_JUSTIFIED_ACCEPTED': return 'Ausente (Justificado)';
      default: return 'Sin registro';
    }
  },

  // Validar si una fecha es válida para registro
  isValidAttendanceDate: (date: string): boolean => {
    const selectedDate = new Date(date);
    const today = new Date();
    const maxPastDays = 30; // Permitir registrar hasta 30 días atrás
    
    const diffDays = Math.ceil((today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= maxPastDays;
  },

  // Obtener el porcentaje de asistencia de un estudiante
  calculateAttendancePercentage: (records: AttendanceRecord[]): number => {
    if (records.length === 0) return 0;
    
    const presentCount = records.filter(r => r.status === 'PRESENT').length;
    return Math.round((presentCount / records.length) * 100);
  }
};
