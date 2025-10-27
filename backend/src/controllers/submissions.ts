import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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

export const submitTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { studentId, taskId, student_comment, file_reference } = req.body as {
      studentId?: number | string;
      taskId?: string;
      student_comment?: string;
      file_reference?: string; // <- aquí llega la URL HTTPS que te devolvimos
    };

    if (!userId || !studentId || !taskId || !file_reference) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const sid = Number(studentId);
    if (!Number.isInteger(sid)) return res.status(400).json({ message: "studentId inválido" });

    await ensureParentStudentLink(userId, sid);

    const task = await prisma.task.findUnique({ where: { id: String(taskId) } });
    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

    const submission = await prisma.submissionGrade.upsert({
      where: { task_id_student_external_id: { task_id: String(taskId), student_external_id: sid } },
      update: { student_comment: student_comment ?? null, file_reference },
      create: {
        task_id: String(taskId),
        student_external_id: sid,
        student_comment: student_comment ?? null,
        file_reference,
      },
    });

    return res.status(201).json({ message: "Entrega registrada", submission });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "NO_PARENT") return res.status(400).json({ message: "Tu usuario no está asociado a un perfil de padre" });
      if (e.message === "NOT_LINKED") return res.status(403).json({ message: "Este estudiante no está vinculado a tu cuenta" });
    }
    console.error("submitTask error", e);
    return res.status(500).json({ message: "Error al registrar entrega" });
  }
};
