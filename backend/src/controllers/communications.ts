import { Request, Response } from "express";
import { PrismaClient, CommunicationKind, SenderRole, Role } from "@prisma/client";
import { getStudentTeachersLikeName } from "../ext/ceiafDb";

const prisma = new PrismaClient();

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

    const kind = (req.query.kind as string | undefined)?.toUpperCase() as CommunicationKind | undefined;
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
          select: { body: true, createdAt: true, sender_role: true }
        }
      }
    });

    // Formato listo para bandeja
    const data = conversations.map(c => ({
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
 * body: { kind: "THREAD"|"NOTICE", subject?, student_external_id, teacher_external_id, is_behavioral_note? }
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
        id: true, kind: true, subject: true, createdAt: true, status: true
      }
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
        id: true, body: true, sender_role: true,
        sender_parent_id: true, sender_teacher_external_id: true,
        createdAt: true, editedAt: true, deletedAt: true,
        reply_to_id: true,
        attachments: { select: { id: true, url: true, file_name: true, mime_type: true, size_bytes: true } }
      }
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
 * body: { body, reply_to_id?, attachments? }
 */
export const postMessage = async (req: Request, res: Response) => {
  try {
    const convId = req.params.id;
    const { body, reply_to_id, attachments } = req.body as {
      body: string;
      reply_to_id?: string | null;
      attachments?: Array<{ url: string; file_name: string; mime_type?: string; size_bytes?: number }>;
    };

    if (!body || body.trim().length === 0) {
      return res.status(400).json({ message: "El cuerpo del mensaje es requerido" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.parent_id) return res.status(400).json({ message: "No asociado a un perfil padre" });

    const conv = await prisma.communication.findUnique({ where: { id: convId } });
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });

    // (Opcional) Validar que el parent dueño del hilo sea el mismo:
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
        }
      });

      if (attachments && attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: attachments.map(a => ({
            message_id: created.id,
            url: a.url,
            file_name: a.file_name,
            mime_type: a.mime_type ?? null,
            size_bytes: a.size_bytes ?? null,
          }))
        });
      }

      await tx.communication.update({
        where: { id: convId },
        data: { lastMessageAt: new Date(), updatedAt: new Date(), archived_by_teacher: false } // si docente archivó, lo “despiertas”
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
 * POST /api/comm/conversations/:id/archive
 * body: { value: boolean }
 * Archiva/desarchiva la conversación para el padre.
 */
export const toggleArchiveParent = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { archive } = req.body as { archive: boolean };

  if (!userId) return res.status(401).json({ message: 'No autorizado' });

  // Sólo conversaciones que pertenecen a este padre:
  const conv = await prisma.communication.findUnique({ where: { id } });
  if (!conv) return res.status(404).json({ message: 'No existe' });

  // Verifica que el user actual tenga parent_id y coincida con conv.parent_id
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.parent_id || user.parent_id !== conv.parent_id) {
    return res.status(403).json({ message: 'Prohibido' });
  }

  const updated = await prisma.communication.update({
    where: { id },
    data: {
      archived_by_parent: Boolean(archive),
      updatedAt: new Date(),
    },
  });

  return res.json(updated);
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

    // 1) Docentes del estudiante desde CEIAF por nombre
    const ceiafTeachers = await getStudentTeachersLikeName(studentId, q || null);
    if (ceiafTeachers.length === 0) return res.json({ teachers: [] });

    // 2) Filtrar por docentes que tengan usuario (Role.DOCENTE) en Postgres (external_id=teacher_id)
    const teacherIds = ceiafTeachers.map(t => String(t.teacher_id));
    const users = await prisma.user.findMany({
      where: { role: Role.DOCENTE, external_id: { in: teacherIds } },
      select: { external_id: true },
    });
    const allowed = new Set(users.map(u => u.external_id));

    const result = ceiafTeachers
      .filter(t => allowed.has(String(t.teacher_id)))
      .map(t => ({
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