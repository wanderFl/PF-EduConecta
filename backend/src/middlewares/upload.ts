import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { buildObjectKey, getPresignedPutUrl, getPresignedGetUrl, buildTaskObjectKey } from "../services/s3";
import { s3 } from "../services/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

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

// Configurar multer para usar memoria (no disco)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
});

/**
 * Middleware: subir archivo de tarea a S3
 * Procesa el campo 'archivo' del FormData y sube a S3
 */
export const uploadTaskFileToS3 = [
  upload.single('archivo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Si no hay archivo, continuar (el archivo es opcional)
      if (!req.file) {
        return next();
      }

      // Obtener teacher_external_id del usuario autenticado
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.external_id) {
        return res.status(403).json({ message: "Usuario no vinculado con un docente" });
      }

      const teacherId = parseInt(user.external_id);
      const objectKey = buildTaskObjectKey(teacherId, req.file.originalname);

      // Subir archivo a S3
      const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
      const AWS_REGION = process.env.AWS_REGION!;

      await s3.send(new PutObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: objectKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }));

      // Construir URL del archivo
      const fileUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${encodeURI(objectKey)}`;

      // Agregar fileUrl al body para que el controlador lo use
      req.body.fileUrl = fileUrl;
      
      console.log('✅ Archivo subido a S3:', { objectKey, fileUrl, size: req.file.size });

      next();
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      return res.status(500).json({ message: "Error al subir archivo a S3" });
    }
  }
];

/**
 * Manejador de errores de multer
 */
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo es demasiado grande. Máximo 10MB.' });
    }
    return res.status(400).json({ message: `Error al subir archivo: ${error.message}` });
  }
  next(error);
};

/**
 * POST /api/uploads/teacher-task-upload-url
 * Genera URL firmada para que un docente suba un archivo de tarea
 */
export const createTeacherTaskUploadUrl = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { filename, contentType } = req.body as {
      filename?: string;
      contentType?: string;
    };

    if (!userId || !filename || !contentType) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Obtener teacher_external_id del usuario autenticado
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.external_id) {
      return res.status(403).json({ message: "Usuario no vinculado con un docente" });
    }

    const teacherId = parseInt(user.external_id);
    const { buildTaskObjectKey } = await import("../services/s3");
    const objectKey = buildTaskObjectKey(teacherId, filename);
    const { uploadUrl, fileUrl } = await getPresignedPutUrl(objectKey, contentType);

    return res.json({ uploadUrl, fileUrl, objectKey });
  } catch (e) {
    console.error("createTeacherTaskUploadUrl error", e);
    return res.status(500).json({ message: "Error generando URL de subida" });
  }
};

/**
 * GET /api/uploads/task-download-url?fileRef=...
 * Genera URL firmada para descargar archivo de tarea
 */
export const getTaskFileDownloadUrl = async (req: Request, res: Response) => {
  try {
    const fileRef = req.query.fileRef;
    if (!fileRef || typeof fileRef !== "string") {
      return res.status(400).json({ message: "fileRef es requerido" });
    }

    const marker = ".amazonaws.com/";
    let objectKey: string;

    if (fileRef.includes(marker)) {
      const parts = fileRef.split(marker);
      objectKey = decodeURI(parts[1]);
    } else {
      objectKey = fileRef;
    }

    const url = await getPresignedGetUrl(objectKey);
    return res.json({ url });
  } catch (e) {
    console.error("getTaskFileDownloadUrl error", e);
    return res.status(500).json({ message: "Error generando URL de descarga" });
  }
};