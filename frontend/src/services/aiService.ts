import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface AIAnalysis {
  resumen_general: string;
  promedios: {
    promedio_general: number;
    materias: Array<{
      nombre: string;
      promedio: number;
      estado: string;
    }>;
  };
  fortalezas_identificadas: string[];
  areas_requieren_atencion: string[];
  consejos_estudiante: string[];
  recomendaciones_padres: string[];
  plan_accion: string;
}

export interface AIMetrics {
  average_grade: number;
  attendance_rate: number;
  behavior_score: number;
}

export interface PerformanceReportResponse {
  success: boolean;
  report: {
    id: string;
    created_at: string;
  };
  analysis: AIAnalysis;
  metrics: AIMetrics;
}

export interface TaskOrder {
  task_id: number;
  title: string;
  priority: number;
  reason: string;
}

export interface TaskRecommendationResponse {
  success: boolean;
  recommendation: {
    reasoning: string;
    recommended_order: TaskOrder[];
    daily_plan: Record<string, string[]>;
    tips: string[];
  };
  message?: string;
}

/**
 * Servicio para interactuar con las APIs de IA
 */
export const aiService = {
  /**
   * Genera un reporte de rendimiento con IA para un estudiante
   */
  async generatePerformanceReport(studentExternalId: string): Promise<PerformanceReportResponse> {
    try {
      const token = localStorage.getItem('edu_token');
      
      const response = await axios.post(
        `${API_URL}/ai/performance-report/${studentExternalId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 90000 // 90 segundos (la IA puede tardar)
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating performance report:', error);
      
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          // Token inválido
          localStorage.removeItem('token');
          throw new Error('Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
        }
        if (error.response?.status === 500) {
          const details = error.response.data?.details || '';
          if (details.includes('AI Service')) {
            throw new Error('El servicio de IA no está disponible. Por favor, contacta al administrador.');
          }
          throw new Error(error.response.data?.error || 'Error del servidor al generar el reporte');
        }
        if (error.response) {
          throw new Error(error.response.data?.error || 'Error al generar el reporte');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('La generación del reporte está tomando más tiempo de lo esperado. Por favor, intenta nuevamente.');
        } else if (error.code === 'ERR_NETWORK') {
          throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 3000.');
        }
      }
      throw new Error('Error inesperado. Por favor, intenta nuevamente.');
    }
  },

  /**
   * Genera recomendaciones de orden de tareas con IA
   */
  async getTaskRecommendations(studentExternalId: string): Promise<TaskRecommendationResponse> {
    try {
      const token = localStorage.getItem('edu_token');
      
      const response = await axios.post(
        `${API_URL}/ai/task-recommendations/${studentExternalId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 90000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting task recommendations:', error);
      
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data?.error || 'Error al generar recomendaciones');
      } else if (error instanceof AxiosError && error.code === 'ECONNABORTED') {
        throw new Error('La generación de recomendaciones está tomando más tiempo de lo esperado. Por favor, intenta nuevamente.');
      } else {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
      }
    }
  },

  /**
   * Obtiene el historial de reportes de IA para un estudiante
   */
  async getReportHistory(studentExternalId: string, type?: 'performance' | 'task_order'): Promise<{ reports: Array<{ id: string; report_type: string; created_at: string; content: unknown }> }> {
    try {
      const token = localStorage.getItem('edu_token');
      
      const url = type 
        ? `${API_URL}/ai/reports/${studentExternalId}?type=${type}`
        : `${API_URL}/ai/reports/${studentExternalId}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting report history:', error);
      
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data?.error || 'Error al obtener el historial');
      } else {
        throw new Error('No se pudo conectar con el servidor.');
      }
    }
  },

  /**
   * Verifica el estado del servicio de IA
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_URL}/ai/health`, {
        timeout: 5000
      });
      
      return response.data.ai_service === 'healthy';
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }
};
