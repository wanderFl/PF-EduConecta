import api from './api';

export interface CreateTaskData {
  nombre: string;
  instrucciones: string;
  puntuacion: number;
  fechaVencimiento: string;
  cursoId: string;
  file?: File | null;
}

export const taskService = {
  // Create task using multipart/form-data so we can attach files
  createTask: async (taskData: CreateTaskData) => {
    try {
      console.log('📤 Enviando datos de tarea:', taskData);
      
      const form = new FormData();
      form.append('nombre', taskData.nombre);
      form.append('instrucciones', taskData.instrucciones || '');
      form.append('puntuacion', String(taskData.puntuacion ?? 0));
      form.append('fechaVencimiento', taskData.fechaVencimiento);
      form.append('cursoId', taskData.cursoId);
      if (taskData.file) {
        form.append('archivo', taskData.file);
        console.log('📎 Archivo adjunto:', taskData.file.name, taskData.file.size, 'bytes');
      }

      console.log('🌐 Enviando petición a /docente/tareas/create...');
      const response = await api.post('/docente/tareas/create', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('✅ Respuesta exitosa:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Error creating task:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number, statusText: string, data: unknown, headers: unknown } };
        console.error('📊 Error response:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          headers: axiosError.response.headers
        });
        
        if (axiosError.response.status === 401) {
          throw new Error('No estás autenticado. Por favor, inicia sesión de nuevo.');
        } else if (axiosError.response.status === 404) {
          throw new Error('La ruta del servidor no fue encontrada. Verifica que el backend esté funcionando.');
        } else if (axiosError.response.status === 403) {
          throw new Error('No tienes permisos para realizar esta acción.');
        }
      } else if (error && typeof error === 'object' && 'request' in error) {
        console.error('📡 No response received:', (error as { request: unknown }).request);
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
      }
      
      throw error;
    }
  },

  // Obtener tareas por curso (para integración futura)
  getTasksByCourse: async (courseId: string) => {
    try {
      const response = await api.get(`/docente/tareas/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }
};