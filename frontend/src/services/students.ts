import axios from 'axios';
import api from './api';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Student {
  id: number;
  nombre_completo: string;
  cedula?: string;
  curso_nombre?: string;
  nivel?: string;
  paralelo?: string;
  fecha_nacimiento?: string;
  email?: string;
  telefono?: string;
  genero?: string;
}

export interface Course {
  id_curso: number;
  nombre: string;
  nivel: string;
  paralelo: string;
  ano_lectivo?: string;
}

export interface AttendanceRecord {
  id: string;
  student_external_id: number;
  date: Date;
  status: string;
  justification_file_reference?: string | null;
}

export interface AttendanceSubmission {
  student_external_id: number;
  status: string;
  justification_file_reference?: string;
}

export const ATTENDANCE_STATUS = {
  PRESENTE: 'PRESENTE',
  AUSENTE: 'AUSENTE',
  TARDANZA: 'TARDANZA',
  JUSTIFICADO: 'JUSTIFICADO'
} as const;

export type AttendanceStatusType = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

export interface AttendanceStats {
  total: number;
  presente: number;
  ausente: number;
  tardanza: number;
  justificado: number;
  percentage_presente: number;
  percentage_ausente: number;
}

// Configurar axios para incluir cookies automáticamente
axios.defaults.withCredentials = true;

/**
 * Servicio para manejar estudiantes
 */
export const studentsService = {
  /**
   * Obtener todos los cursos
   */
  async getAllCourses(): Promise<Course[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/courses`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Error al obtener cursos');
    }
  },

  /**
   * Obtener paralelos por curso
   */
  async getParalelosByCourse(courseId: number): Promise<string[]> {
    try {
      const response = await api.get(`/students/course/${courseId}/paralelos`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching paralelos by course:', error);
      throw new Error('Error al obtener paralelos del curso');
    }
  },

  /**
   * Obtener estudiantes por curso
   */
  async getStudentsByCourse(courseId: string): Promise<Student[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/course/${courseId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching students by course:', error);
      throw new Error('Error al obtener estudiantes del curso');
    }
  },

  /**
   * Obtener estudiante por ID
   */
  async getStudentById(studentId: number): Promise<Student> {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/${studentId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw new Error('Error al obtener estudiante');
    }
  },

  /**
   * Buscar estudiantes
   */
  async searchStudents(query: string): Promise<Student[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/search/${query}`);
      return response.data.data;
    } catch (error) {
      console.error('Error searching students:', error);
      throw new Error('Error al buscar estudiantes');
    }
  }
};

/**
 * Servicio para manejar asistencia
 */
export const attendanceService = {
  /**
   * Guardar asistencia individual
   */
  async saveAttendance(
    studentId: number,
    date: string,
    status: AttendanceStatusType,
    justificationFile?: string
  ): Promise<AttendanceRecord> {
    try {
      const response = await axios.post(`${API_BASE_URL}/students/attendance`, {
        student_id: studentId,
        date,
        status,
        justification_file: justificationFile
      });
      return response.data.data;
    } catch (error) {
      console.error('Error saving attendance:', error);
      throw new Error('Error al guardar asistencia');
    }
  },

  /**
   * Guardar asistencia masiva
   */
  async saveBulkAttendance(
    date: string,
    attendances: AttendanceSubmission[],
    courseId: number
  ): Promise<AttendanceRecord[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/students/attendance/bulk`, {
        date,
        attendances,
        course_id: courseId
      });
      return response.data.data;
    } catch (error) {
      console.error('Error saving bulk attendance:', error);
      throw new Error('Error al guardar asistencia masiva');
    }
  },

  /**
   * Obtener asistencia por fecha
   */
  async getAttendanceByDate(
    date: string,
    studentIds?: number[]
  ): Promise<AttendanceRecord[]> {
    try {
      let url = `${API_BASE_URL}/students/attendance/date/${date}`;
      if (studentIds && studentIds.length > 0) {
        url += `?student_ids=${studentIds.join(',')}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching attendance by date:', error);
      throw new Error('Error al obtener asistencia por fecha');
    }
  },

  /**
   * Obtener historial de asistencia de un estudiante
   */
  async getStudentAttendanceHistory(
    studentId: number,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceRecord[]> {
    try {
      let url = `${API_BASE_URL}/students/${studentId}/attendance/history`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      throw new Error('Error al obtener historial de asistencia');
    }
  },

  /**
   * Obtener estadísticas de asistencia de un estudiante
   */
  async getStudentAttendanceStats(
    studentId: number,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceStats> {
    try {
      let url = `${API_BASE_URL}/students/${studentId}/attendance/stats`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      throw new Error('Error al obtener estadísticas de asistencia');
    }
  }
};