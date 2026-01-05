import api from './api';

export interface CreateTaskData {
  nombre: string;
  instrucciones: string;
  puntuacion: number;
  fechaVencimiento: string;
  cursoId: string;
  subjectId: number; // OBLIGATORIO - ID de la materia
  paralelo?: string; // Mantener por compatibilidad pero ya no se usará
  trimestre?: number;
  aporte?: number;
  file?: File | null;
}

// Normalizar cursoId - convertir "8vo" a "8", etc.
const normalizeCursoId = (cursoId: string): string => {
  // Si ya es un número, devolverlo como string
  const asNum = parseInt(cursoId, 10);
  if (!isNaN(asNum) && asNum > 0) {
    return String(asNum);
  }
  
  // Mapeo de nombres a números
  const courseMap: Record<string, string> = {
    '8vo': '8',
    '9no': '9', 
    '10mo': '10',
    '1bgu': '11',
    '2bgu': '12',
    '3bgu': '13'
  };
  
  const normalized = courseMap[cursoId.toLowerCase()];
  if (!normalized) {
    throw new Error(`Curso inválido: ${cursoId}. Use un número (8-13) o formato válido (8vo, 9no, etc.)`);
  }
  
  return normalized;
};

export const taskService = {
  // Create task using multipart/form-data so we can attach files
  createTask: async (taskData: CreateTaskData) => {
    try {
      console.log('📤 Enviando datos de tarea (original):', taskData);
      
      // Normalizar y validar datos antes de enviar
      const normalizedCursoId = normalizeCursoId(taskData.cursoId);
      const puntuacion = Number(taskData.puntuacion);
      
      if (isNaN(puntuacion) || puntuacion < 0 || puntuacion > 10) {
        throw new Error('La puntuación debe ser un número entre 0 y 10');
      }
      
      // Validar fecha
      const fechaVencimiento = new Date(taskData.fechaVencimiento);
      if (isNaN(fechaVencimiento.getTime())) {
        throw new Error('Fecha de vencimiento inválida');
      }
      
      const normalizedData = {
        ...taskData,
        cursoId: normalizedCursoId,
        puntuacion,
        fechaVencimiento: fechaVencimiento.toISOString()
      };
      
      console.log('📤 Enviando datos de tarea (normalizados):', normalizedData);
      
      const form = new FormData();
      form.append('nombre', normalizedData.nombre);
      form.append('instrucciones', normalizedData.instrucciones || '');
      form.append('puntuacion', String(normalizedData.puntuacion));
      form.append('fechaVencimiento', normalizedData.fechaVencimiento);
      form.append('cursoId', normalizedData.cursoId);
      form.append('subjectId', String(taskData.subjectId)); // Campo obligatorio
      if (taskData.paralelo) {
        form.append('paralelo', taskData.paralelo);
      }
      if (taskData.trimestre) {
        form.append('trimestre', String(taskData.trimestre));
      }
      if (taskData.aporte) {
        form.append('aporte', String(taskData.aporte));
      }
      if (taskData.file) {
        form.append('archivo', taskData.file);
        console.log('📎 Archivo adjunto:', taskData.file.name, taskData.file.size, 'bytes');
      }

      console.log('🌐 Enviando petición a /protected/docente/tareas/create...');
      const response = await api.post('/protected/docente/tareas/create', form, {
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
        } else if (axiosError.response.status === 400) {
          const errorData = axiosError.response.data as { message?: string };
          throw new Error(errorData.message || 'Datos inválidos en la solicitud.');
        }
      } else if (error && typeof error === 'object' && 'request' in error) {
        console.error('📡 No response received:', (error as { request: unknown }).request);
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
      }
      
      throw error;
    }
  },

  // Obtener tareas por curso con estudiantes y calificaciones
  getTasksByCourse: async (courseId: string) => {
    try {
      console.log('📚 Obteniendo tareas para curso (original):', courseId);
      
      // Normalizar el cursoId antes de hacer la petición
      const normalizedCourseId = normalizeCursoId(courseId);
      console.log('📚 Curso normalizado:', normalizedCourseId);
      
      const response = await api.get(`/protected/docente/tareas/${normalizedCourseId}`);
      console.log('✅ Tareas obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number, statusText: string, data: unknown } };
        console.error('📊 Error response:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data
        });
        
        if (axiosError.response.status === 401) {
          throw new Error('No estás autenticado. Por favor, inicia sesión de nuevo.');
        } else if (axiosError.response.status === 404) {
          throw new Error('No se encontraron tareas para este curso.');
        }
      }
      throw error;
    }
  },

  // Calificar tarea de un estudiante específico
  gradeTask: async (taskId: string, studentId: number, grade: number, comment?: string) => {
    try {
      console.log('🎯 Calificando tarea:', { taskId, studentId, grade, comment });
      
      const response = await api.post(`/protected/docente/tareas/${taskId}/calificar`, {
        studentId,
        grade,
        comment
      });
      
      console.log('✅ Calificación registrada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error grading task:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number, statusText: string, data: unknown } };
        console.error('📊 Error response:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data
        });
        
        if (axiosError.response.status === 400) {
          const errorData = axiosError.response.data as { message?: string };
          throw new Error(errorData.message || 'Datos inválidos para la calificación.');
        } else if (axiosError.response.status === 401) {
          throw new Error('No estás autenticado. Por favor, inicia sesión de nuevo.');
        } else if (axiosError.response.status === 404) {
          throw new Error('Tarea o estudiante no encontrado.');
        }
      }
      throw error;
    }
  },

  // Descargar archivo de tarea desde S3
  downloadTaskFile: async (fileRef: string) => {
    try {
      console.log('📥 Solicitando URL de descarga para:', fileRef);
      
      // Obtener URL firmada desde el backend
      const response = await api.get('/uploads/task-download-url', {
        params: { fileRef }
      });
      
      const downloadUrl = response.data.url;
      console.log('✅ URL firmada obtenida');
      
      // Descargar el archivo usando la URL firmada
      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) {
        throw new Error('Error al descargar archivo desde S3');
      }
      
      const blob = await fileResponse.blob();
      
      // Extraer nombre del archivo de la URL
      const urlParts = fileRef.split('/');
      const filename = urlParts[urlParts.length - 1].split('_').slice(1).join('_') || 'archivo';
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', decodeURIComponent(filename));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Archivo descargado:', filename);
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response.status === 404) {
          throw new Error('Archivo no encontrado.');
        }
      }
      throw new Error('Error descargando el archivo.');
    }
  },

  // Descargar archivo de entrega de estudiante
  downloadSubmissionFile: async (fileRef: string) => {
    try {
      console.log('📥 Descargando archivo de entrega:', fileRef);
      
      // 1. Obtener URL firmada desde el backend
      const response = await api.get('/uploads/submission-download-url', {
        params: { fileRef }
      });
      const downloadUrl = response.data.url;
      
      // 2. Descargar archivo desde S3 usando la URL firmada
      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) {
        throw new Error('Error al descargar archivo desde S3');
      }
      const blob = await fileResponse.blob();
      
      // 3. Extraer el nombre limpio del archivo (sin timestamp)
      const urlParts = fileRef.split('/');
      const filenameWithTimestamp = urlParts[urlParts.length - 1];
      const filename = filenameWithTimestamp.split('_').slice(1).join('_');
      
      // 4. Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', decodeURIComponent(filename));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Archivo de entrega descargado:', filename);
    } catch (error) {
      console.error('❌ Error downloading submission file:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response.status === 404) {
          throw new Error('Archivo de entrega no encontrado.');
        }
      }
      throw new Error('Error descargando el archivo de entrega.');
    }
  },

  // Actualizar tarea existente
  updateTask: async (taskId: string, taskData: {
    title: string;
    instructions: string;
    due_date: string;
    max_points: number;
    trimestre: number | null;
    aporte: number | null;
    file?: File | null;
    removeFile?: boolean;
  }) => {
    try {
      console.log('📝 Actualizando tarea:', taskId, taskData);

      // Si hay archivo o se quiere remover, usar FormData
      if (taskData.file || taskData.removeFile) {
        const form = new FormData();
        form.append('title', taskData.title);
        form.append('instructions', taskData.instructions || '');
        form.append('due_date', taskData.due_date);
        form.append('max_points', String(taskData.max_points));
        
        if (taskData.trimestre) {
          form.append('trimestre', String(taskData.trimestre));
        }
        if (taskData.aporte) {
          form.append('aporte', String(taskData.aporte));
        }
        if (taskData.file) {
          form.append('archivo', taskData.file);
        }
        if (taskData.removeFile) {
          form.append('removeFile', 'true');
        }

        const response = await api.put(`/protected/docente/tareas/${taskId}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        console.log('✅ Tarea actualizada:', response.data);
        return response.data;
      } else {
        // Sin archivos, enviar JSON normal
        const response = await api.put(`/protected/docente/tareas/${taskId}`, {
          title: taskData.title,
          instructions: taskData.instructions,
          due_date: taskData.due_date,
          max_points: taskData.max_points,
          trimestre: taskData.trimestre,
          aporte: taskData.aporte
        });
        
        console.log('✅ Tarea actualizada:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error updating task:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number, data: unknown } };
        
        if (axiosError.response.status === 401) {
          throw new Error('No estás autenticado. Por favor, inicia sesión de nuevo.');
        } else if (axiosError.response.status === 404) {
          throw new Error('Tarea no encontrada.');
        } else if (axiosError.response.status === 403) {
          throw new Error('No tienes permisos para editar esta tarea.');
        } else if (axiosError.response.status === 400) {
          const errorData = axiosError.response.data as { message?: string };
          throw new Error(errorData.message || 'Datos inválidos para actualizar la tarea.');
        }
      }
      throw error;
    }
  },

  // Eliminar tarea
  deleteTask: async (taskId: string) => {
    try {
      console.log('🗑️ Eliminando tarea:', taskId);
      
      const response = await api.delete(`/protected/docente/tareas/${taskId}`);
      
      console.log('✅ Tarea eliminada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number, data: unknown } };
        
        if (axiosError.response.status === 401) {
          throw new Error('No estás autenticado. Por favor, inicia sesión de nuevo.');
        } else if (axiosError.response.status === 404) {
          throw new Error('Tarea no encontrada.');
        } else if (axiosError.response.status === 403) {
          throw new Error('No tienes permisos para eliminar esta tarea.');
        }
      }
      throw error;
    }
  }
};