import api from "./api";
import type {
  Conversation,
  ConversationKind,
  PaginatedMessages,
} from "../types";

function unwrapConversations(data: unknown): Conversation[] {
  if (Array.isArray(data)) {
    return data as Conversation[];
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "conversations" in data &&
    Array.isArray((data as { conversations: unknown }).conversations)
  ) {
    return (data as { conversations: Conversation[] }).conversations;
  }

  return [];
}

export async function listParentConversations(params?: {
  kind?: ConversationKind;
  archived?: boolean;
}): Promise<Conversation[]> {
  const { data } = await api.get("/comm/parent/conversations", { params });
  return unwrapConversations(data);
}

export async function createParentConversation(payload: {
  kind: ConversationKind;
  student_external_id: number;
  teacher_external_id: number;
  is_behavioral_note?: boolean;
  subject?: string | null; // por si el backend lo usa
}): Promise<Conversation> {
  const { data } = await api.post("/comm/parent/conversations", payload);
  // algunos backends devuelven {conversation: {...}}
  return (data?.conversation ?? data) as Conversation;
}

export async function listConversationMessages(
  id: string,
  opts?: { limit?: number; cursor?: string }
): Promise<PaginatedMessages> {
  const { data } = await api.get(`/comm/conversations/${id}/messages`, {
    params: opts,
  });
  // soporta {messages:[...], nextCursor} o arreglo plano
  if (Array.isArray(data)) return { messages: data, nextCursor: null };
  return data as PaginatedMessages;
}

export async function postConversationMessage(
  id: string,
  payload: { body: string; attachments?: { url: string; file_name?: string; mime_type?: string; size_bytes?: number }[] }
) {
  const { data } = await api.post(`/comm/conversations/${id}/messages`, payload);
  return data;
}

export async function archiveConversation(id: string, archive: boolean): Promise<Conversation> {
  const { data } = await api.post(`/comm/parent/conversations/${id}/archive`, { archive });
  return data as Conversation;
}

export type TeacherSearchResult = {
  teacher_external_id: number;
  teacher_name: string;
  subject: string;
};

export async function searchTeachersForStudent(
  studentExternalId: number,
  q: string
): Promise<TeacherSearchResult[]> {
  const { data } = await api.get("/comm/parent/teachers", {
    params: { studentId: studentExternalId, q }
  });
  return (data?.teachers as TeacherSearchResult[]) ?? [];
}