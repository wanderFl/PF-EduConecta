import api from './api';

// Tipos
export interface TeacherConversation {
  id: string;
  kind: string;
  student_external_id: number;
  student_name: string;
  teacher_external_id: number;
  parent_id: string | null;
  subject: string | null;
  is_behavioral_note: boolean;
  archived_by_parent: boolean;
  archived_by_teacher: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_role: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface StudentSearchResult {
  student_external_id: number;
  student_name: string;
  cedula: string;
  curso: string;
  paralelo: string;
  parent_id: string | null; // ID del padre de familia que recibirá los mensajes
}

export interface CreateConversationData {
  student_external_id: number;
  subject?: string;
  is_behavioral_note?: boolean;
}

export interface SendMessageData {
  body: string;
}

// Servicios

// Tipo de respuesta que puede devolver el backend
export interface ConversationsResponse {
  conversations?: TeacherConversation[];
  warning?: string;
}

/**
 * Obtener todas las conversaciones del docente
 */
export const listTeacherConversations = async (): Promise<TeacherConversation[] | ConversationsResponse> => {
  try {
    const response = await api.get('/communications/teacher');
    return response.data;
  } catch (error) {
    console.error('Error fetching teacher conversations:', error);
    throw error;
  }
};

/**
 * Crear nueva conversación con un estudiante/padre
 */
export const createTeacherConversation = async (
  data: CreateConversationData
): Promise<TeacherConversation> => {
  const response = await api.post('/communications/teacher', data);
  return response.data;
};

/**
 * Buscar estudiantes del docente por nombre o cédula
 * Solo retorna estudiantes de los cursos donde el docente imparte clases
 * @param query - Texto de búsqueda (nombre o cédula)
 * @param courseId - ID del curso para filtrar (opcional)
 */
export const searchTeacherStudents = async (
  query: string,
  courseId?: number | null
): Promise<StudentSearchResult[]> => {
  const params: any = { query };
  if (courseId) {
    params.courseId = courseId;
  }
  
  const response = await api.get('/communications/teacher/students', { params });
  // El backend devuelve { students: [...] }
  return response.data.students || [];
};

/**
 * Obtener mensajes de una conversación
 */
export const getConversationMessages = async (
  conversationId: string
): Promise<ConversationMessage[]> => {
  try {
    const response = await api.get(`/communications/conversation/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    throw error;
  }
};

/**
 * Enviar mensaje en una conversación
 */
export const sendMessage = async (
  conversationId: string,
  data: SendMessageData
): Promise<ConversationMessage> => {
  try {
    const response = await api.post(
      `/communications/conversation/${conversationId}/messages`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Archivar conversación
 */
export const archiveConversation = async (conversationId: string): Promise<void> => {
  try {
    await api.put(`/communications/conversation/${conversationId}/archive`);
  } catch (error) {
    console.error('Error archiving conversation:', error);
    throw error;
  }
};

export default {
  listTeacherConversations,
  createTeacherConversation,
  searchTeacherStudents,
  getConversationMessages,
  sendMessage,
  archiveConversation
};
