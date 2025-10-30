// backend/src/controllers/familia.ts
import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { ceiafPool } from '../ext/ceiafDb';
import { isValidEcuadorianCedula } from '../utils/validators';
import { verifyPassword } from '../utils/auth'; // ya lo tienes

const prisma = new PrismaClient();

type CeiafStudentRow = {
  id_estudiante: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  id_curso: number | null;
};

type CeiafCourseRow = {
  id_curso: number;
  nombre: string;   // p.ej. "Octavo EGB"
  nivel: string | null;
  paralelo: string | null;
  ano_lectivo: string | null;
};

// GET /api/familia/hijos
export const getLinkedChildren = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'No autorizado' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.parent_id) {
      return res.status(400).json({ message: 'Tu usuario no está asociado a un perfil de padre' });
    }

    // vínculos en Postgres
    const links = await prisma.parentStudentLink.findMany({
      where: { parent_id: user.parent_id },
      select: { student_external_id: true },
    });

    if (links.length === 0) return res.json([]);

    const ids = links.map(l => Number(l.student_external_id)).filter(n => !isNaN(n));
    if (ids.length === 0) return res.json([]);

    // alumnos + curso en CEIAF
    const [rows] = await ceiafPool.query(
      `
      SELECT e.id_estudiante, e.cedula, e.nombres, e.apellidos, e.id_curso,
             c.nombre AS curso_nombre, c.nivel AS curso_nivel, c.paralelo AS curso_paralelo, c.ano_lectivo AS curso_ano_lectivo
      FROM estudiantes e
      LEFT JOIN cursos c ON c.id_curso = e.id_curso
      WHERE e.id_estudiante IN (?)
      `,
      [ids]
    );

    return res.json(rows); // devuelve arreglo de hijos con datos de curso
  } catch (error) {
    console.error('GET /familia/hijos error:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/familia/buscar-estudiante { cedula }
export const findStudentByCedula = async (req: Request, res: Response) => {
  try {
    const { cedula } = req.body as { cedula?: string };
    if (!cedula) return res.status(400).json({ message: 'Cédula requerida' });

    const cleanCedula = String(cedula).trim();
    if (!isValidEcuadorianCedula(cleanCedula)) {
      return res.status(400).json({ message: 'Cédula ecuatoriana inválida' });
    }

    const [rows] = await ceiafPool.query(
      `
      SELECT e.id_estudiante, e.cedula, e.nombres, e.apellidos, e.id_curso,
             c.nombre AS curso_nombre, c.nivel AS curso_nivel, c.paralelo AS curso_paralelo, c.ano_lectivo AS curso_ano_lectivo
      FROM estudiantes e
      LEFT JOIN cursos c ON c.id_curso = e.id_curso
      WHERE e.cedula = ?
      `,
      [cleanCedula]
    );

    const arr = rows as any[];
    if (!Array.isArray(arr) || arr.length === 0) {
      return res.status(404).json({ message: 'No se encontró un estudiante con esa cédula' });
    }

    return res.json(arr[0]); // devuelve alumno + curso para confirmación
  } catch (error) {
    console.error('POST /familia/buscar-estudiante error:', error);
    return res.status(500).json({ message: 'Error interno' });
  }
};

// POST /api/familia/agregar-hijo { student_external_id }
export const linkStudentToParent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { student_external_id } = req.body as { student_external_id?: string | number };

    if (!userId || !student_external_id) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.parent_id) {
      return res.status(400).json({ message: 'Tu usuario no está asociado a un perfil de padre' });
    }

    // Confirmar que el estudiante EXISTE en CEIAF por id_estudiante
    const idNum = Number(student_external_id);
    if (isNaN(idNum)) {
      return res.status(400).json({ message: 'student_external_id inválido' });
    }

    const [rows] = await ceiafPool.query(
      `SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?`,
      [idNum]
    );
    const arr = rows as any[];
    if (!Array.isArray(arr) || arr.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado en el sistema académico' });
    }

    // Evitar duplicados (PK compuesta en Prisma)
    const key = { parent_id: user.parent_id, student_external_id: String(idNum) };

    const existing = await prisma.parentStudentLink.findUnique({
      where: { parent_id_student_external_id: key },
    });
    if (existing) {
      return res.status(400).json({ message: 'Este estudiante ya está vinculado a tu cuenta' });
    }

    await prisma.parentStudentLink.create({ data: key });

    return res.status(201).json({ message: 'Hijo vinculado exitosamente' });
  } catch (error) {
    console.error('POST /familia/agregar-hijo error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ message: 'Este estudiante ya está vinculado' });
    }

    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const verifyParentPin = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { pin } = req.body as { pin?: string };

    if (!userId) return res.status(401).json({ message: 'No autorizado' });
    if (!pin) return res.status(400).json({ message: 'PIN requerido' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { parent: true },
    });

    if (!user?.parent || !user.parent.security_pin_hash) {
      return res.status(403).json({ message: 'No tienes PIN configurado' });
    }

    const ok = await verifyPassword(pin, user.parent.security_pin_hash);
    if (!ok) return res.status(401).json({ message: 'PIN incorrecto' });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('verifyParentPin error', e);
    return res.status(500).json({ message: 'Error verificando PIN' });
  }
};
