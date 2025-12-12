import { Request, Response } from "express";
import { PrismaClient, CommunicationKind, SenderRole, Role } from "@prisma/client";
import { ceiafPool, getStudentTeachersLikeName } from "../ext/ceiafDb";

import { sendNotification } from "../services/notificationSender";

const prisma = new PrismaClient();

/**
 * Listar conversaciones del docente
 * GET /api/communications/teacher
 */
export const listTeacherConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    console.log("🔍 listTeacherConversations - userId:", userId);

    if (!userId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Obtener el usuario con external_id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { external_id: true, email: true },
    });

    console.log("👤 User found:", user);

    if (!user || !user.external_id) {
      console.log("❌ User without external_id");
      return res.status(403).json({
        message: "Tu cuenta no está vinculada con un docente en el sistema del colegio.",
        needsLinking: true,
      });
    }

    console.log("✅ User has external_id:", user.external_id);

    const teacherExternalId = parseInt(user.external_id);

    // Obtener conversaciones del docente
    const communications = await prisma.communication.findMany({
      where: {
        teacher_external_id: teacherExternalId,
        archived_by_teacher: false,
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    res.json(communications);
  } catch (error) {
    console.error("Error listing teacher conversations:", error);
    res.status(500).json({ message: "Error al obtener conversaciones" });
  }
};

/**
 * Crear conversación desde docente
 * POST /api/communications/teacher
 */
export const createTeacherConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { external_id: true },
    });

    if (!user || !user.external_id) {
      return res.status(403).json({
        message: "Tu cuenta no está vinculada con un docente.",
        needsLinking: true,
      });
    }

    const { student_external_id, subject, initialMessage, kind } = req.body;

    if (!student_external_id) {
      return res.status(400).json({ message: "student_external_id es requerido" });
    }

    const teacherExternalId = parseInt(user.external_id);

    // Buscar parent_id asociado al estudiante (opcional)
    const parentLink = await prisma.parentStudentLink.findFirst({
      where: { student_external_id: String(student_external_id) },
      select: { parent_id: true },
    });

    // Crear comunicación (con o sin parent_id)
    const communication = await prisma.communication.create({
      data: {
        kind: kind || "THREAD",
        subject: subject || null,
        student_external_id: parseInt(student_external_id),
        teacher_external_id: teacherExternalId,
        parent_id: parentLink?.parent_id || null, // Opcional: puede ser null
        status: "OPEN",
        messages: initialMessage
          ? {
              create: {
                body: initialMessage,
                sender_role: "TEACHER",
                sender_teacher_external_id: teacherExternalId,
              },
            }
          : undefined,
      },
      include: {
        messages: true,
      },
    });

    // NOTIFICACIÓN: Nuevo Comunicado
    if (parentLink?.parent_id) {
      (async () => {
        try {
          const parentUser = await prisma.user.findUnique({
            where: { parent_id: parentLink.parent_id },
          });
          if (parentUser) {
            sendNotification(
              parentUser.id,
              "Nuevo Comunicado",
              `Has recibido un nuevo mensaje del docente.`,
              "NEW_COMMUNICATION",
              { communicationId: communication.id, studentId: student_external_id }
            );
          }
        } catch (e) {
          console.error("Error sending notification for communication:", e);
        }
      })();
    }

    res.status(201).json(communication);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ message: "Error al crear conversación" });
  }
};

/**
 * Obtener mensajes de una conversación
 * GET /api/communications/conversation/:conversationId/messages
 */
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const messages = await prisma.message.findMany({
      where: { communication_id: conversationId },
      orderBy: { createdAt: "asc" },
      include: { attachments: true },
    });

    res.json(messages);
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ message: "Error al obtener mensajes" });
  }
};

/**
 * Enviar mensaje en una conversación (docente)
 * POST /api/communications/conversation/:conversationId/messages
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ message: "body es requerido" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId! },
      select: { external_id: true },
    });

    if (!user || !user.external_id) {
      return res.status(403).json({ message: "Usuario no vinculado" });
    }

    const teacherExternalId = parseInt(user.external_id);

    // Crear mensaje SIEMPRE como TEACHER (el docente es quien envía)
    const message = await prisma.message.create({
      data: {
        communication_id: conversationId,
        body,
        sender_role: "TEACHER",
        sender_teacher_external_id: teacherExternalId,
        sender_parent_id: null, // Explícitamente null porque es el docente quien envía
      },
      include: { attachments: true },
    });

    await prisma.communication.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error al enviar mensaje" });
  }
};

/**
 * Buscar estudiantes del docente
 * GET /api/communications/teacher/students?query=nombre&courseId=123
 */
export const searchTeacherStudents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { q, query: searchQuery, courseId } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { external_id: true },
    });

    if (!user || !user.external_id) {
      return res.status(403).json({
        message: "Tu cuenta no está vinculada con un docente.",
        needsLinking: true,
      });
    }

    const teacherExternalId = parseInt(user.external_id);

    // Usar q o query
    const searchText = (q || searchQuery) as string | undefined;
    const searchTerm = searchText && searchText.trim() ? `%${searchText.trim()}%` : "%";

    let sqlQuery = `
      SELECT DISTINCT
        e.id_estudiante AS student_external_id,
        CONCAT(e.nombres, ' ', e.apellidos) AS student_name,
        e.nombres,
        e.apellidos,
        e.cedula,
        c.id_curso,
        c.nombre AS curso,
        c.nivel,
        c.paralelo
      FROM estudiantes e
      INNER JOIN cursos c ON c.id_curso = e.id_curso
      INNER JOIN docente_materia_curso dmc ON dmc.id_curso = c.id_curso
      WHERE dmc.id_docente = ?
    `;

    const params: any[] = [teacherExternalId];

    if (courseId) {
      sqlQuery += ` AND c.id_curso = ?`;
      params.push(parseInt(courseId as string));
    }

    sqlQuery += `
        AND (
          CONCAT(e.nombres, ' ', e.apellidos) LIKE ? OR
          e.cedula LIKE ?
        )
      ORDER BY e.apellidos, e.nombres
      LIMIT 50
    `;

    params.push(searchTerm, searchTerm);

    const [rows] = (await ceiafPool.execute(sqlQuery, params)) as any;

    if (rows.length > 0) {
      const studentIds = rows.map((r: any) => String(r.student_external_id));

      const parentLinks = await prisma.parentStudentLink.findMany({
        where: {
          student_external_id: { in: studentIds },
        },
        select: {
          student_external_id: true,
          parent_id: true,
        },
      });

      const parentMap = new Map(parentLinks.map((pl) => [pl.student_external_id, pl.parent_id]));

      const studentsWithParent = rows.map((student: any) => ({
        ...student,
        parent_id: parentMap.get(String(student.student_external_id)) || null,
      }));

      return res.json({ students: studentsWithParent });
    }

    res.json({ students: rows });
  } catch (error) {
    console.error("Error searching students:", error);
    res.status(500).json({ message: "Error al buscar estudiantes" });
  }
};

/**
 * Archivar conversación (docente)
 * PUT /api/communications/conversation/:conversationId/archive
 */
export const archiveConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    await prisma.communication.update({
      where: { id: conversationId },
      data: { archived_by_teacher: true },
    });

    res.json({ message: "Conversación archivada" });
  } catch (error) {
    console.error("Error archiving conversation:", error);
    res.status(500).json({ message: "Error al archivar conversación" });
  }
};

/**
 * GET /api/comm/parent/conversations?kind=THREAD|NOTICE
 * Lista conversaciones del padre autenticado (por su parent_id).
 */
export const listParentConversations = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.parent_id) {
      return res.status(400).json({ message: "Tu usuario no está asociado a un perfil de padre" });
    }

    const kind = (req.query.kind as string | undefined)?.toUpperCase() as
      | CommunicationKind
      | undefined;
    const where: any = { parent_id: user.parent_id };
    if (kind && Object.values(CommunicationKind).includes(kind)) where.kind = kind;

    const conversations = await prisma.communication.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      select: {
        id: true,
        kind: true,
        subject: true,
        student_external_id: true,
        teacher_external_id: true,
        is_behavioral_note: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastMessageAt: true,
        archived_by_parent: true,
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { body: true, createdAt: true, sender_role: true },
        },
      },
    });

    const data = conversations.map((c) => ({
      ...c,
      lastMessagePreview: c.messages[0]?.body ?? null,
      lastMessageAt: c.messages[0]?.createdAt ?? c.lastMessageAt,
    }));

    return res.json({ conversations: data });
  } catch (e) {
    console.error("listParentConversations error", e);
    return res.status(500).json({ message: "Error listando conversaciones" });
  }
};

/**
 * POST /api/comm/parent/conversations
 * Crea conversación THREAD o NOTICE.
 */
export const createConversation = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.parent_id) {
      return res.status(400).json({ message: "Tu usuario no está asociado a un perfil de padre" });
    }

    const {
      kind,
      subject,
      student_external_id,
      teacher_external_id,
      is_behavioral_note,
    } = req.body as {
      kind: CommunicationKind;
      subject?: string | null;
      student_external_id: number;
      teacher_external_id: number;
      is_behavioral_note?: boolean;
    };

    if (!student_external_id || !teacher_external_id || !kind) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }
    if (!Object.values(CommunicationKind).includes(kind)) {
      return res.status(400).json({ message: "kind inválido" });
    }
    if (kind === "NOTICE" && !subject) {
      return res.status(400).json({ message: "subject es obligatorio para NOTICE" });
    }

    const conv = await prisma.communication.create({
      data: {
        kind,
        subject: subject ?? null,
        student_external_id,
        teacher_external_id,
        parent_id: user.parent_id,
        is_behavioral_note: !!is_behavioral_note,
      },
      select: {
        id: true,
        kind: true,
        subject: true,
        createdAt: true,
        status: true,
      },
    });

    return res.status(201).json({ message: "Conversación creada", conversation: conv });
  } catch (e) {
    console.error("createConversation error", e);
    return res.status(500).json({ message: "Error creando conversación" });
  }
};

/**
 * GET /api/comm/conversations/:id/messages?cursor=<messageId>&limit=20
 * Lista mensajes (paginado por cursor).
 */
export const listMessages = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const cursor = (req.query.cursor as string | undefined) ?? undefined;

    const conv = await prisma.communication.findUnique({ where: { id } });
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });

    const messages = await prisma.message.findMany({
      where: { communication_id: id },
      orderBy: { createdAt: "asc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        body: true,
        sender_role: true,
        sender_parent_id: true,
        sender_teacher_external_id: true,
        createdAt: true,
        editedAt: true,
        deletedAt: true,
        reply_to_id: true,
        attachments: {
          select: {
            id: true,
            url: true,
            file_name: true,
            mime_type: true,
            size_bytes: true,
          },
        },
      },
    });

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;
    return res.json({ messages, nextCursor });
  } catch (e) {
    console.error("listMessages error", e);
    return res.status(500).json({ message: "Error listando mensajes" });
  }
};

/**
 * POST /api/comm/conversations/:id/messages
 * Enviar mensaje (como PARENT en este endpoint).
 */
export const postMessage = async (req: Request, res: Response) => {
  try {
    const convId = req.params.id;
    const { body, reply_to_id, attachments } = req.body as {
      body: string;
      reply_to_id?: string | null;
      attachments?: Array<{
        url: string;
        file_name: string;
        mime_type?: string;
        size_bytes?: number;
      }>;
    };

    if (!body || body.trim().length === 0) {
      return res.status(400).json({ message: "El cuerpo del mensaje es requerido" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.parent_id) return res.status(400).json({ message: "No asociado a un perfil padre" });

    const conv = await prisma.communication.findUnique({ where: { id: convId } });
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });

    if (conv.parent_id !== user.parent_id) {
      return res.status(403).json({ message: "No puedes escribir en esta conversación" });
    }

    const msg = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          communication_id: convId,
          body: body.trim(),
          sender_role: SenderRole.PARENT,
          sender_parent_id: user.parent_id,
          reply_to_id: reply_to_id ?? null,
        },
      });

      if (attachments && attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: attachments.map((a) => ({
            message_id: created.id,
            url: a.url,
            file_name: a.file_name,
            mime_type: a.mime_type ?? null,
            size_bytes: a.size_bytes ?? null,
          })),
        });
      }

      await tx.communication.update({
        where: { id: convId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
          archived_by_teacher: false,
        },
      });

      return created;
    });

    return res.status(201).json({ message: "Mensaje enviado", id: msg.id });
  } catch (e) {
    console.error("postMessage error", e);
    return res.status(500).json({ message: "Error enviando mensaje" });
  }
};

/**
 * GET /api/comm/parent/teachers?studentId=123&q=juan
 * Responde solo docentes del estudiante y que tengan usuario (Role.DOCENTE)
 */
export const searchTeachersForStudent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const studentId = Number(req.query.studentId);
    if (!studentId) return res.status(400).json({ message: "studentId requerido" });

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const ceiafTeachers = await getStudentTeachersLikeName(studentId, q || null);
    if (ceiafTeachers.length === 0) return res.json({ teachers: [] });

    const teacherIds = ceiafTeachers.map((t) => String(t.teacher_id));
    const users = await prisma.user.findMany({
      where: { role: Role.DOCENTE, external_id: { in: teacherIds } },
      select: { external_id: true },
    });
    const allowed = new Set(users.map((u) => u.external_id));

    const result = ceiafTeachers
      .filter((t) => allowed.has(String(t.teacher_id)))
      .map((t) => ({
        teacher_external_id: t.teacher_id,
        teacher_name: t.teacher_name,
        subject: t.subject,
      }));

    return res.json({ teachers: result });
  } catch (e) {
    console.error("searchTeachersForStudent error", e);
    return res.status(500).json({ message: "Error buscando docentes" });
  }
};
