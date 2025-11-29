import api from './api';

export interface Task {
  id: string;
  title: string;
  instructions: string | null;
  due_date: string;
  max_points: number | null;
  file_reference: string | null;
  teacher_external_id: number;
  course_external_id: number;
  created_at: string;
  updated_at: string;
  submissions?: SubmissionGrade[];
  submission_count?: number;
  graded_count?: number;
}

export interface SubmissionGrade {
  id: string;
  student_external_id: number;
  grade: number | null;
  file_reference: string | null;
  comment_student: string | null;
  comment_teacher: string | null;
  submitted_at: string | null;
  graded_at: string | null;
}

export interface TaskStats {
  total_tasks: number;
  overdue_tasks: number;
  upcoming_tasks: number;
  total_submissions: number;
  total_graded_submissions: number;
  pending_grading: number;
}

export interface CreateTaskData {
  title: string;
  instructions?: string;
  due_date: string;
  max_points?: number;
  file_reference?: string;
  teacher_external_id: number;
  course_external_id: number;
}

export const agendaService = {
  // Obtener todas las tareas
  getAllTasks: async (): Promise<Task[]> => {
    try {
      const response = await api.get('/tasks');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      throw new Error('Error al obtener las tareas');
    }
  },

  // Obtener tareas por curso
  getTasksByCourse: async (courseId: number): Promise<Task[]> => {
    try {
      const response = await api.get(`/tasks/course/${courseId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tasks by course:', error);
      throw new Error('Error al obtener las tareas del curso');
    }
  },

  // Obtener tareas por curso y paralelo
  getTasksByCourseAndParalelo: async (courseId: number, paralelo?: string): Promise<Task[]> => {
    try {
      const params = paralelo ? `?paralelo=${paralelo}` : '';
      const response = await api.get(`/tasks/course/${courseId}${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tasks by course and paralelo:', error);
      throw new Error('Error al obtener las tareas del curso y paralelo');
    }
  },

  // Obtener paralelos disponibles para un curso
  getParalelosByCourse: async (courseId: number): Promise<string[]> => {
    try {
      const response = await api.get(`/tasks/course/${courseId}/paralelos`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching paralelos by course:', error);
      throw new Error('Error al obtener paralelos del curso');
    }
  },

  // Obtener tareas por docente
  getTasksByTeacher: async (teacherId: number): Promise<Task[]> => {
    try {
      const response = await api.get(`/tasks/teacher/${teacherId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tasks by teacher:', error);
      throw new Error('Error al obtener las tareas del docente');
    }
  },

  // Obtener una tarea específica
  getTaskById: async (taskId: string): Promise<Task> => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw new Error('Error al obtener la tarea');
    }
  },

  // Crear nueva tarea
  createTask: async (taskData: CreateTaskData): Promise<Task> => {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Error al crear la tarea');
    }
  },

  // Actualizar tarea
  updateTask: async (taskId: string, taskData: Partial<CreateTaskData>): Promise<Task> => {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Error al actualizar la tarea');
    }
  },

  // Eliminar tarea
  deleteTask: async (taskId: string): Promise<void> => {
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Error al eliminar la tarea');
    }
  },

  // Obtener estadísticas de tareas
  getTasksStats: async (filters?: {
    course_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<TaskStats> => {
    try {
      const params = new URLSearchParams();
      
      // El teacher_id se obtiene automáticamente del token JWT en el backend
      // pero debemos asegurarnos de enviar el course_id
      if (filters?.course_id) {
        params.append('course_id', filters.course_id.toString());
      }
      if (filters?.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters?.end_date) {
        params.append('end_date', filters.end_date);
      }

      const queryString = params.toString();
      const url = queryString ? `/tasks/stats?${queryString}` : '/tasks/stats';
      
      console.log('📊 Solicitando estadísticas con filtros:', { 
        course_id: filters?.course_id,
        start_date: filters?.start_date,
        end_date: filters?.end_date,
        url 
      });

      const response = await api.get(url);
      console.log('✅ Estadísticas recibidas:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tasks stats:', error);
      throw new Error('Error al obtener estadísticas de tareas');
    }
  },

  // Utilidades de fecha y estado
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  isTaskOverdue: (dueDate: string): boolean => {
    return new Date(dueDate) < new Date();
  },

  getTaskPriority: (dueDate: string): 'overdue' | 'urgent' | 'soon' | 'normal' => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'soon';
    return 'normal';
  },

  getPriorityColor: (priority: string): string => {
    switch (priority) {
      case 'overdue': return 'bg-red-100 border-red-300 text-red-800';
      case 'urgent': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'soon': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-green-100 border-green-300 text-green-800';
    }
  }
};