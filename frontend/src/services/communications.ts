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
  createdAt: string;
  attachments?: {
    url: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  }[];
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
  attachments?: {
    url: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  }[];
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

/* --- ADJUNTOS DOCENTE --- */

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  objectKey: string;
}

export async function getPresignedTeacherUploadUrl(
  conversationId: string,
  file: File
): Promise<PresignedUploadResponse> {
  const { data } = await api.post("/communications/teacher/upload-url", {
    conversationId,
    filename: file.name,
    contentType: file.type,
  });
  return data;
}

export async function uploadTeacherFileToS3(uploadUrl: string, file: File): Promise<void> {
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });
}

export async function uploadTeacherAttachment(
  conversationId: string,
  file: File
): Promise<{ url: string; file_name: string; mime_type: string; size_bytes: number }> {
  const { uploadUrl, fileUrl } = await getPresignedTeacherUploadUrl(conversationId, file);
  await uploadTeacherFileToS3(uploadUrl, file);
  
  return {
    url: fileUrl,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size
  };
}

export async function getFileDownloadUrl(fileRef: string): Promise<string> {
  const { data } = await api.get("/uploads/submission-download-url", {
    params: { fileRef },
  });
  return data.url;
}

export default {
  listTeacherConversations,
  createTeacherConversation,
  searchTeacherStudents,
  getConversationMessages,
  sendMessage,
  archiveConversation
};
