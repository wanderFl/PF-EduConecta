import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ceiafPool } from '../ext/ceiafDb';

const prisma = new PrismaClient();

/**
 * Listar conversaciones del docente
 * GET /api/communications/teacher
 */
export const listTeacherConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    console.log('🔍 listTeacherConversations - userId:', userId);
    
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Obtener el usuario con external_id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { external_id: true, email: true }
    });

    console.log('👤 User found:', user);

    if (!user || !user.external_id) {
      console.log('❌ User without external_id');
      return res.status(403).json({ 
        message: 'Tu cuenta no está vinculada con un docente en el sistema del colegio.',
        needsLinking: true 
      });
    }
    
    console.log('✅ User has external_id:', user.external_id);

    const teacherExternalId = parseInt(user.external_id);

    // Obtener conversaciones del docente
    const communications = await prisma.communication.findMany({
      where: {
        teacher_external_id: teacherExternalId,
        archived_by_teacher: false
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    res.json(communications);
  } catch (error) {
    console.error('Error listing teacher conversations:', error);
    res.status(500).json({ message: 'Error al obtener conversaciones' });
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
      return res.status(401).json({ message: 'No autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { external_id: true }
    });

    if (!user || !user.external_id) {
      return res.status(403).json({ 
        message: 'Tu cuenta no está vinculada con un docente.',
        needsLinking: true 
      });
    }

    const { student_external_id, subject, initialMessage, kind } = req.body;

    if (!student_external_id) {
      return res.status(400).json({ message: 'student_external_id es requerido' });
    }

    const teacherExternalId = parseInt(user.external_id);

    // Buscar parent_id asociado al estudiante (opcional)
    const parentLink = await prisma.parentStudentLink.findFirst({
      where: { student_external_id: String(student_external_id) },
      select: { parent_id: true }
    });

    // Crear comunicación (con o sin parent_id)
    const communication = await prisma.communication.create({
      data: {
        kind: kind || 'THREAD',
        subject: subject || null,
        student_external_id: parseInt(student_external_id),
        teacher_external_id: teacherExternalId,
        parent_id: parentLink?.parent_id || null, // Opcional: puede ser null
        status: 'OPEN',
        messages: initialMessage ? {
          create: {
            body: initialMessage,
            sender_role: 'TEACHER',
            sender_teacher_external_id: teacherExternalId
          }
        } : undefined
      },
      include: {
        messages: true
      }
    });

    res.status(201).json(communication);
  } catch (error) {
    console.error('Error creating conversation:', error);
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

    const messages = await prisma.message.findMany({
      where: { communication_id: conversationId },
      orderBy: { createdAt: 'asc' },
      include: { attachments: true }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Error al obtener mensajes' });
  }
};

/**
 * Enviar mensaje en una conversación
 * POST /api/communications/conversation/:conversationId/messages
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ message: 'body es requerido' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId! },
      select: { external_id: true }
    });

    if (!user || !user.external_id) {
      return res.status(403).json({ message: 'Usuario no vinculado' });
    }

    const teacherExternalId = parseInt(user.external_id);

    // Crear mensaje SIEMPRE como TEACHER (el docente es quien envía)
    const message = await prisma.message.create({
      data: {
        communication_id: conversationId,
        body,
        sender_role: 'TEACHER',
        sender_teacher_external_id: teacherExternalId,
        sender_parent_id: null // Explícitamente null porque es el docente quien envía
      },
      include: { attachments: true }
    });

    await prisma.communication.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error al enviar mensaje' });
  }
};

/**
 * Buscar estudiantes del docente
 * GET /api/communications/teacher/students?query=nombre&courseId=123
 * Retorna solo los estudiantes de los cursos donde el docente imparte clases
 * Si se proporciona courseId, filtra solo por ese curso específico
 */
export const searchTeacherStudents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { q, query: searchQuery, courseId } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { external_id: true }
    });

    if (!user || !user.external_id) {
      return res.status(403).json({ 
        message: 'Tu cuenta no está vinculada con un docente.',
        needsLinking: true 
      });
    }

    const teacherExternalId = parseInt(user.external_id);

    // Usar q o query (el frontend puede enviar cualquiera)
    const searchText = (q || searchQuery) as string | undefined;
    const searchTerm = searchText && searchText.trim() ? `%${searchText.trim()}%` : '%';

    // Construir query con filtro opcional por curso
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

    // Filtrar por curso específico si se proporciona
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

    const [rows] = await ceiafPool.execute(sqlQuery, params) as any;

    // Obtener parent_id para cada estudiante desde PostgreSQL
    if (rows.length > 0) {
      const studentIds = rows.map((r: any) => String(r.student_external_id));
      
      // Buscar parent_id en ParentStudentLink
      const parentLinks = await prisma.parentStudentLink.findMany({
        where: {
          student_external_id: { in: studentIds }
        },
        select: {
          student_external_id: true,
          parent_id: true
        }
      });
      
      // Crear mapa student_id -> parent_id
      const parentMap = new Map(parentLinks.map(pl => [pl.student_external_id, pl.parent_id]));
      
      // Agregar parent_id a cada estudiante
      const studentsWithParent = rows.map((student: any) => ({
        ...student,
        parent_id: parentMap.get(String(student.student_external_id)) || null
      }));
      
      return res.json({ students: studentsWithParent });
    }

    res.json({ students: rows });
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ message: 'Error al buscar estudiantes' });
  }
};

/**
 * Archivar conversación
 * PUT /api/communications/conversation/:conversationId/archive
 */
export const archiveConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    await prisma.communication.update({
      where: { id: conversationId },
      data: { archived_by_teacher: true }
    });

    res.json({ message: 'Conversación archivada' });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ message: 'Error al archivar conversación' });
  }
};
