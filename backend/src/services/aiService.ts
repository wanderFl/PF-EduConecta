import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

export interface TaskGrade {
  task_name: string;
  grade: number;
  max_grade: number;
  date?: string | null;
}

export interface Grade {
  subject: string;
  grade: number;
  max_grade: number;
  tasks?: TaskGrade[];  // Tareas individuales de la materia
}

export interface Attendance {
  total_days: number;
  attended_days: number;
  absences: number;
}

export interface Behavior {
  incidents: number;
  positive_notes: number;
  behavior_score: number;
}

export interface PerformanceAnalysisRequest {
  student_id: string;
  student_name: string;
  grades: Grade[];
  attendance: Attendance;
  behavior: Behavior;
}

export interface Task {
  task_id: string;
  title: string;
  subject: string;
  due_date: string;
  difficulty: string;
  estimated_time?: number;
}

export interface TaskRecommendationRequest {
  student_id: string;
  tasks: Task[];
  current_performance?: Record<string, number>;
}

export class AIService {
  /**
   * Llama al servicio de IA para analizar el rendimiento del estudiante
   */
  static async analyzePerformance(data: PerformanceAnalysisRequest) {
    try {
      console.log(`[AIService] Analyzing performance for student: ${data.student_id}`);
      
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/analyze-performance`,
        data,
        { 
          timeout: 60000, // 60 segundos
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`[AIService] Performance analysis completed successfully`);
      return response.data;
    } catch (error: any) {
      console.error('[AIService] Error analyzing performance:', error.message);
      
      if (error.response) {
        throw new Error(`AI Service error: ${error.response.data?.detail || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('AI Service is not responding. Please ensure the service is running on port 8001.');
      } else {
        throw new Error(`Failed to analyze student performance: ${error.message}`);
      }
    }
  }

  /**
   * Llama al servicio de IA para recomendar orden de tareas
   */
  static async recommendTaskOrder(data: TaskRecommendationRequest) {
    try {
      console.log(`[AIService] Generating task recommendations for student: ${data.student_id}`);
      
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/recommend-task-order`,
        data,
        { 
          timeout: 60000, // 60 segundos
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`[AIService] Task recommendations generated successfully`);
      return response.data;
    } catch (error: any) {
      console.error('[AIService] Error generating task recommendations:', error.message);
      
      if (error.response) {
        throw new Error(`AI Service error: ${error.response.data?.detail || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('AI Service is not responding. Please ensure the service is running on port 8001.');
      } else {
        throw new Error(`Failed to generate task recommendations: ${error.message}`);
      }
    }
  }

  /**
   * Verifica si el servicio de IA está disponible
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('[AIService] Health check failed:', error);
      return false;
    }
  }
}
