import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { ceiafPool } from '../ext/ceiafDb';

const prisma = new PrismaClient();

/**
 * Listar conversaciones del docente
 * GET /api/communications/teacher
 */
export const listTeacherConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId; // UUID del usuario desde JWT
    
    // Buscar el external_id del docente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { external_id: true, role: true }
    });

    if (!user || !user.external_id) {
      return res.status(404).json({ message: 'Teacher external ID not found' });
    }

    if (user.role !== 'DOCENTE') {
      return res.status(403).json({ message: 'Only teachers can access conversations' });
    }

    const teacherIdInt = parseInt(user.external_id, 10);
    if (isNaN(teacherIdInt)) {
      return res.status(400).json({ message: 'Invalid teacher ID format' });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        teacher_external_id: teacherIdInt,
        archived_by_teacher: false
      },
      include: {
        conversation_messages: {
          orderBy: {
            created_at: 'desc'
          },
          take: 1 // Solo el último mensaje para preview
        }
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    // Enriquecer con información del estudiante desde MySQL
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const [studentRows] = await ceiafPool.query(
          'SELECT nombres, apellidos FROM estudiantes WHERE id_estudiante = ?',
          [conv.student_external_id]
        ) as any;

        const student = studentRows?.[0];
        const lastMsg = conv.conversation_messages[0];

        return {
          id: conv.id,
          kind: conv.kind,
          student_external_id: conv.student_external_id,
          student_name: student ? `${student.nombres} ${student.apellidos}` : 'Estudiante',
          teacher_external_id: conv.teacher_external_id,
          parent_id: conv.parent_id,
          subject: conv.subject,
          is_behavioral_note: conv.is_behavioral_note,
          archived_by_parent: conv.archived_by_parent,
          archived_by_teacher: conv.archived_by_teacher,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          lastMessageAt: lastMsg?.created_at || conv.updated_at,
          lastMessagePreview: lastMsg?.body?.substring(0, 100) || null
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('Error listing teacher conversations:', error);
    res.status(500).json({ message: 'Error al obtener conversaciones' });
  }
};

/**
 * Crear conversación con un padre
 * POST /api/communications/teacher
 */
export const createTeacherConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    // Buscar el external_id del docente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { external_id: true }
    });

    if (!user || !user.external_id) {
      return res.status(404).json({ message: 'Teacher external ID not found' });
    }

    const teacherIdInt = parseInt(user.external_id, 10);
    if (isNaN(teacherIdInt)) {
      return res.status(400).json({ message: 'Invalid teacher ID format' });
    }
    
    const {
      student_external_id,
      subject,
      is_behavioral_note = false
    } = req.body;

    if (!student_external_id) {
      return res.status(400).json({ message: 'Se requiere student_external_id' });
    }

    // Verificar que el estudiante existe en MySQL
    const [studentRows] = await ceiafPool.query(
      'SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?',
      [student_external_id]
    ) as any;

    if (!studentRows || studentRows.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    // Crear conversación
    const conversation = await prisma.conversation.create({
      data: {
        kind: 'THREAD',
        student_external_id: parseInt(student_external_id, 10),
        teacher_external_id: teacherIdInt,
        subject: subject || null,
        is_behavioral_note
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating teacher conversation:', error);
    res.status(500).json({ message: 'Error al crear conversación' });
  }
};

/**
 * Obtener mensajes de una conversación
 * GET /api/communications/conversation/:conversationId/messages
 */
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Verificar acceso a la conversación
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversación no encontrada' });
    }

    // Verificar permisos según rol
    if (userRole === 'DOCENTE') {
      // Obtener external_id del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { external_id: true }
      });

      if (!user || !user.external_id) {
        return res.status(403).json({ message: 'Teacher external ID not found' });
      }

      const teacherIdInt = parseInt(user.external_id, 10);
      if (conversation.teacher_external_id !== teacherIdInt) {
        return res.status(403).json({ message: 'No tienes acceso a esta conversación' });
      }
    }

    // Obtener mensajes
    const messages = await prisma.conversationMessage.findMany({
      where: {
        conversation_id: conversationId
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    res.status(500).json({ message: 'Error al obtener mensajes' });
  }
};

/**
 * Enviar mensaje en una conversación
 * POST /api/communications/conversation/:conversationId/messages
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { body } = req.body;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
    }

    // Verificar conversación existe
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversación no encontrada' });
    }

    // Verificar permisos según rol
    if (userRole === 'DOCENTE') {
      // Obtener external_id del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { external_id: true }
      });

      if (!user || !user.external_id) {
        return res.status(403).json({ message: 'Teacher external ID not found' });
      }

      const teacherIdInt = parseInt(user.external_id, 10);
      if (conversation.teacher_external_id !== teacherIdInt) {
        return res.status(403).json({ message: 'No tienes acceso a esta conversación' });
      }
    }

    // Crear mensaje
    const message = await prisma.conversationMessage.create({
      data: {
        conversation_id: conversationId,
        sender_role: userRole,
        sender_id: userId,
        body: body.trim()
      }
    });

    // Actualizar timestamp de la conversación
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error al enviar mensaje' });
  }
};

/**
 * Buscar estudiantes del docente para iniciar conversación
 * GET /api/communications/teacher/students?query=
 */
export const searchTeacherStudents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    // Buscar el external_id del docente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { external_id: true }
    });

    if (!user || !user.external_id) {
      return res.status(404).json({ message: 'Teacher external ID not found' });
    }

    const teacherIdInt = parseInt(user.external_id, 10);
    if (isNaN(teacherIdInt)) {
      return res.status(400).json({ message: 'Invalid teacher ID format' });
    }
    
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Se requiere parámetro query' });
    }

    // Buscar estudiantes que tiene el docente en sus cursos
    const [students] = await ceiafPool.query(
      `SELECT DISTINCT 
        e.id_estudiante,
        e.nombres,
        e.apellidos,
        e.cedula,
        c.nombre AS curso_nombre,
        c.paralelo
      FROM estudiantes e
      INNER JOIN cursos c ON e.id_curso = c.id_curso
      INNER JOIN docente_materia_curso dmc ON dmc.id_curso = c.id_curso
      WHERE dmc.id_docente = ?
      AND (
        e.nombres LIKE ? OR 
        e.apellidos LIKE ? OR 
        e.cedula LIKE ?
      )
      LIMIT 20`,
      [teacherIdInt, `%${query}%`, `%${query}%`, `%${query}%`]
    ) as any;

    const results = students.map((s: any) => ({
      student_external_id: s.id_estudiante,
      student_name: `${s.nombres} ${s.apellidos}`,
      cedula: s.cedula,
      curso: s.curso_nombre,
      paralelo: s.paralelo
    }));

    res.json(results);
  } catch (error) {
    console.error('Error searching teacher students:', error);
    res.status(500).json({ message: 'Error al buscar estudiantes' });
  }
};

/**
 * Archivar conversación (docente)
 * PUT /api/communications/conversation/:conversationId/archive
 */
export const archiveConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversación no encontrada' });
    }

    // Verificar permisos
    if (userRole === 'DOCENTE') {
      // Obtener external_id del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { external_id: true }
      });

      if (!user || !user.external_id) {
        return res.status(403).json({ message: 'Teacher external ID not found' });
      }

      const teacherIdInt = parseInt(user.external_id, 10);
      if (conversation.teacher_external_id !== teacherIdInt) {
        return res.status(403).json({ message: 'No tienes acceso a esta conversación' });
      }
    }

    // Archivar según rol
    const updateData = userRole === 'DOCENTE' 
      ? { archived_by_teacher: true }
      : { archived_by_parent: true };

    await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData
    });

    res.json({ message: 'Conversación archivada exitosamente' });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ message: 'Error al archivar conversación' });
  }
};
