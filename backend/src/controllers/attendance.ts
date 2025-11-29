import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getPresignedPutUrl, buildJustificationKey } from "../utils/s3";

const prisma = new PrismaClient();

async function ensureParentStudentLink(userId: string, studentId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.parent_id) throw new Error("NO_PARENT");
  const link = await prisma.parentStudentLink.findUnique({
    where: {
      parent_id_student_external_id: {
        parent_id: user.parent_id,
        student_external_id: String(studentId),
      },
    },
  });
  if (!link) throw new Error("NOT_LINKED");
}

export const getMonthlyAttendance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { studentId, year, month } = req.body as {
      studentId?: number | string;
      year?: number;
      month?: number; // 1-12
    };

    if (!userId || !studentId || !year || !month) {
      return res.status(400).json({ message: "studentId, year y month son requeridos" });
    }

    const sid = Number(studentId);
    if (!Number.isInteger(sid)) return res.status(400).json({ message: "studentId inválido" });
    if (month < 1 || month > 12) return res.status(400).json({ message: "month debe ser 1-12" });

    await ensureParentStudentLink(userId, sid);

    // Rango del mes [inicio, fin)
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const records = await prisma.attendanceRecord.findMany({
      where: {
        student_external_id: sid,
        date: { gte: start, lt: end },
      },
      select: { date: true, status: true },
      orderBy: { date: "asc" },
    });

    // Normaliza a YYYY-MM-DD (UTC) para el front
    const days = records.map(r => ({
      date: r.date.toISOString().slice(0, 10),
      status: r.status,
    }));

    return res.json({
      year,
      month,
      from: start.toISOString().slice(0,10),
      to: new Date(end.getTime() - 1).toISOString().slice(0,10),
      days, // solo regresamos días con registro. Sin registro = “no tomada” (neutro)
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "NO_PARENT") return res.status(400).json({ message: "Tu usuario no está asociado a un perfil de padre" });
      if (e.message === "NOT_LINKED") return res.status(403).json({ message: "Este estudiante no está vinculado a tu cuenta" });
    }
    console.error("getMonthlyAttendance error", e);
    return res.status(500).json({ message: "Error obteniendo asistencia" });
  }
};

/**
 * POST /api/familia/asistencia/upload-url
 * body: { studentId:number, date:"YYYY-MM-DD", filename:string, contentType:string }
 */
export const createJustificationUploadUrl = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { studentId, date, filename, contentType } = req.body as {
      studentId?: number | string;
      date?: string; // YYYY-MM-DD
      filename?: string;
      contentType?: string;
    };

    if (!userId || !studentId || !date || !filename || !contentType) {
      return res.status(400).json({ message: "Datos incompletos" });
    }
    const sid = Number(studentId);
    if (!Number.isInteger(sid)) return res.status(400).json({ message: "studentId inválido" });

    // validar YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "date inválida" });

    await ensureParentStudentLink(userId, sid);

    const objectKey = buildJustificationKey(sid, date, filename);
    const { uploadUrl, fileUrl } = await getPresignedPutUrl(objectKey, contentType);

    return res.json({ uploadUrl, fileUrl, objectKey });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "NO_PARENT") return res.status(400).json({ message: "Tu usuario no está asociado a un perfil de padre" });
      if (e.message === "NOT_LINKED") return res.status(403).json({ message: "Este estudiante no está vinculado a tu cuenta" });
    }
    console.error("createJustificationUploadUrl error", e);
    return res.status(500).json({ message: "Error generando URL de subida" });
  }
};

/**
 * POST /api/familia/asistencia/justificar
 * body: { studentId:number, date:"YYYY-MM-DD", reason:string, file_reference:string }
 */
export const submitJustification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { studentId, date, reason, file_reference } = req.body as {
      studentId?: number | string;
      date?: string; // YYYY-MM-DD
      reason?: string;
      file_reference?: string;
    };

    if (!userId || !studentId || !date || !reason || !file_reference) {
      return res.status(400).json({ message: "Datos incompletos" });
    }
    const sid = Number(studentId);
    if (!Number.isInteger(sid)) return res.status(400).json({ message: "studentId inválido" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "date inválida" });

    await ensureParentStudentLink(userId, sid);

    // Normaliza a 00:00:00 UTC
    const d = new Date(date + "T00:00:00.000Z");

    // Si no existe el registro de asistencia, lo creamos como ausencia justificada PENDIENTE
    const record = await prisma.attendanceRecord.upsert({
      where: {
        student_external_id_date: { student_external_id: sid, date: d },
      },
      update: {
        status: "ABSENT_JUSTIFIED_PENDING",
        justification_reason: reason,
        justification_file_reference: file_reference,
      },
      create: {
        student_external_id: sid,
        date: d,
        status: "ABSENT_JUSTIFIED_PENDING",
        justification_reason: reason,
        justification_file_reference: file_reference,
      },
    });

    return res.status(201).json({ message: "Justificación enviada", record });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "NO_PARENT") return res.status(400).json({ message: "Tu usuario no está asociado a un perfil de padre" });
      if (e.message === "NOT_LINKED") return res.status(403).json({ message: "Este estudiante no está vinculado a tu cuenta" });
    }
    console.error("submitJustification error", e);
    return res.status(500).json({ message: "Error al enviar justificación" });
  }
};