import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { buildObjectKey, getPresignedPutUrl, getPresignedGetUrl } from "../utils/s3";

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

export const createSignedUploadUrl = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { studentId, taskId, filename, contentType } = req.body as {
      studentId?: number | string;
      taskId?: string;
      filename?: string;
      contentType?: string;
    };

    if (!userId || !studentId || !taskId || !filename || !contentType) {
      return res.status(400).json({ message: "Datos incompletos" });
    }
    const sid = Number(studentId);
    if (!Number.isInteger(sid)) {
      return res.status(400).json({ message: "studentId inválido" });
    }

    // Validar vínculo padre ↔ estudiante
    await ensureParentStudentLink(userId, sid);

    // Validar existencia de la tarea
    const task = await prisma.task.findUnique({ where: { id: String(taskId) } });
    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

    const objectKey = buildObjectKey(sid, String(taskId), filename);
    const { uploadUrl, fileUrl } = await getPresignedPutUrl(objectKey, contentType);

    return res.json({ uploadUrl, fileUrl, objectKey });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "NO_PARENT")
        return res.status(400).json({ message: "Tu usuario no está asociado a un perfil de padre" });
      if (e.message === "NOT_LINKED")
        return res.status(403).json({ message: "Este estudiante no está vinculado a tu cuenta" });
    }
    console.error("createSignedUploadUrl error", e);
    return res.status(500).json({ message: "Error generando URL de subida" });
  }
};


/**
 * GET /api/uploads/submission-download-url?fileRef=...
 * fileRef = lo que guardaste en SubmissionGrade.file_reference
 *         (en tu caso es la URL completa https://bucket.s3.region.amazonaws.com/...)
 */
export const getSubmissionDownloadUrl = async (req: Request, res: Response) => {
  try {
    const fileRef = req.query.fileRef;
    if (!fileRef || typeof fileRef !== "string") {
      return res.status(400).json({ message: "fileRef es requerido" });
    }

    // Si guardaste la URL completa, extraemos el objectKey:
    // https://bucket.s3.region.amazonaws.com/ESTO_DE_AQUI
    const marker = ".amazonaws.com/";
    let objectKey: string;

    if (fileRef.includes(marker)) {
      const parts = fileRef.split(marker);
      objectKey = decodeURI(parts[1]); // lo que viene después del dominio
    } else {
      // Si en el futuro guardas directamente el key (submissions/...), esto también funciona
      objectKey = fileRef;
    }

    const url = await getPresignedGetUrl(objectKey);
    return res.json({ url });
  } catch (e) {
    console.error("getSubmissionDownloadUrl error", e);
    return res.status(500).json({ message: "Error generando URL de descarga" });
  }
};