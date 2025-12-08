import { PrismaClient, Role } from '@prisma/client';
import { Request } from 'express';
import { ceiafPool } from '../ext/ceiafDb';

const prisma = new PrismaClient();

export async function requireParentId(req: Request): Promise<string> {
  if (!req.user || req.user.role !== Role.FAMILIA) {
    throw new Error('FORBIDDEN_PARENT_ONLY');
  }
  const u = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!u?.parent_id) throw new Error('NO_PARENT_PROFILE');
  return u.parent_id;
}

export async function studentExistsInCeiaf(studentId: number): Promise<boolean> {
  const [rows] = await ceiafPool.query('SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?', [studentId]);
  return Array.isArray(rows) && rows.length > 0;
}

export async function teacherExistsInCeiaf(teacherId: number): Promise<boolean> {
  const [rows] = await ceiafPool.query('SELECT id_docente FROM docentes WHERE id_docente = ?', [teacherId]);
  return Array.isArray(rows) && rows.length > 0;
}
