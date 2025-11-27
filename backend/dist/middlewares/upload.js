"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskFileDownloadUrl = exports.createTeacherTaskUploadUrl = exports.handleUploadError = exports.uploadTaskFileToS3 = exports.getSubmissionDownloadUrl = exports.createSignedUploadUrl = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const s3_1 = require("../services/s3");
const s3_2 = require("../services/s3");
const client_s3_1 = require("@aws-sdk/client-s3");
const prisma = new client_1.PrismaClient();
async function ensureParentStudentLink(userId, studentId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.parent_id)
        throw new Error("NO_PARENT");
    const link = await prisma.parentStudentLink.findUnique({
        where: {
            parent_id_student_external_id: {
                parent_id: user.parent_id,
                student_external_id: String(studentId),
            },
        },
    });
    if (!link)
        throw new Error("NOT_LINKED");
}
const createSignedUploadUrl = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { studentId, taskId, filename, contentType } = req.body;
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
        if (!task)
            return res.status(404).json({ message: "Tarea no encontrada" });
        const objectKey = (0, s3_1.buildObjectKey)(sid, String(taskId), filename);
        const { uploadUrl, fileUrl } = await (0, s3_1.getPresignedPutUrl)(objectKey, contentType);
        return res.json({ uploadUrl, fileUrl, objectKey });
    }
    catch (e) {
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
exports.createSignedUploadUrl = createSignedUploadUrl;
/**
 * GET /api/uploads/submission-download-url?fileRef=...
 * fileRef = lo que guardaste en SubmissionGrade.file_reference
 *         (en tu caso es la URL completa https://bucket.s3.region.amazonaws.com/...)
 * Compatible con URLs antiguas (con encodeURI) y nuevas (sin codificación)
 */
const getSubmissionDownloadUrl = async (req, res) => {
    try {
        const fileRef = req.query.fileRef;
        if (!fileRef || typeof fileRef !== "string") {
            return res.status(400).json({ message: "fileRef es requerido" });
        }
        // Si guardaste la URL completa, extraemos el objectKey:
        // https://bucket.s3.region.amazonaws.com/ESTO_DE_AQUI
        const marker = ".amazonaws.com/";
        let objectKey;
        if (fileRef.includes(marker)) {
            const parts = fileRef.split(marker);
            objectKey = parts[1];
        }
        else {
            // Si en el futuro guardas directamente el key (submissions/...), esto también funciona
            objectKey = fileRef;
        }
        console.log('🔍 Submission Download - fileRef:', fileRef);
        console.log('🔍 Submission Download - objectKey extraído:', objectKey);
        // Intentar generar URL firmada con el objectKey directo
        try {
            const url = await (0, s3_1.getPresignedGetUrl)(objectKey);
            return res.json({ url });
        }
        catch (firstError) {
            // Si falla, puede ser una URL antigua con encodeURI
            // Intentar con encodeURI del objectKey para compatibilidad
            console.log('⚠️ Primer intento falló, probando con encodeURI para compatibilidad con URLs antiguas');
            const encodedKey = encodeURI(objectKey);
            console.log('🔍 Submission Download - objectKey codificado:', encodedKey);
            const url = await (0, s3_1.getPresignedGetUrl)(encodedKey);
            return res.json({ url });
        }
    }
    catch (e) {
        console.error("getSubmissionDownloadUrl error", e);
        return res.status(500).json({ message: "Error generando URL de descarga" });
    }
};
exports.getSubmissionDownloadUrl = getSubmissionDownloadUrl;
// Configurar multer para usar memoria (no disco)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
    },
});
/**
 * Middleware: subir archivo de tarea a S3
 * Procesa el campo 'archivo' del FormData y sube a S3
 */
exports.uploadTaskFileToS3 = [
    upload.single('archivo'),
    async (req, res, next) => {
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
            const objectKey = (0, s3_1.buildTaskObjectKey)(teacherId, req.file.originalname);
            // Subir archivo a S3
            const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
            const AWS_REGION = process.env.AWS_REGION;
            await s3_2.s3.send(new client_s3_1.PutObjectCommand({
                Bucket: AWS_BUCKET_NAME,
                Key: objectKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            }));
            // Construir URL del archivo (NO usar encodeURI porque objectKey ya está sanitizado)
            const fileUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${objectKey}`;
            // Agregar fileUrl al body para que el controlador lo use
            req.body.fileUrl = fileUrl;
            console.log('✅ Archivo subido a S3:', { objectKey, fileUrl, size: req.file.size });
            next();
        }
        catch (error) {
            console.error('Error uploading file to S3:', error);
            return res.status(500).json({ message: "Error al subir archivo a S3" });
        }
    }
];
/**
 * Manejador de errores de multer
 */
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'El archivo es demasiado grande. Máximo 10MB.' });
        }
        return res.status(400).json({ message: `Error al subir archivo: ${error.message}` });
    }
    next(error);
};
exports.handleUploadError = handleUploadError;
/**
 * POST /api/uploads/teacher-task-upload-url
 * Genera URL firmada para que un docente suba un archivo de tarea
 */
const createTeacherTaskUploadUrl = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { filename, contentType } = req.body;
        if (!userId || !filename || !contentType) {
            return res.status(400).json({ message: "Datos incompletos" });
        }
        // Obtener teacher_external_id del usuario autenticado
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.external_id) {
            return res.status(403).json({ message: "Usuario no vinculado con un docente" });
        }
        const teacherId = parseInt(user.external_id);
        const { buildTaskObjectKey } = await Promise.resolve().then(() => __importStar(require("../services/s3")));
        const objectKey = buildTaskObjectKey(teacherId, filename);
        const { uploadUrl, fileUrl } = await (0, s3_1.getPresignedPutUrl)(objectKey, contentType);
        return res.json({ uploadUrl, fileUrl, objectKey });
    }
    catch (e) {
        console.error("createTeacherTaskUploadUrl error", e);
        return res.status(500).json({ message: "Error generando URL de subida" });
    }
};
exports.createTeacherTaskUploadUrl = createTeacherTaskUploadUrl;
/**
 * GET /api/uploads/task-download-url?fileRef=...
 * Genera URL firmada para descargar archivo de tarea
 * Compatible con URLs antiguas (con encodeURI) y nuevas (sin codificación)
 */
const getTaskFileDownloadUrl = async (req, res) => {
    try {
        const fileRef = req.query.fileRef;
        if (!fileRef || typeof fileRef !== "string") {
            return res.status(400).json({ message: "fileRef es requerido" });
        }
        const marker = ".amazonaws.com/";
        let objectKey;
        if (fileRef.includes(marker)) {
            const parts = fileRef.split(marker);
            objectKey = parts[1];
        }
        else {
            objectKey = fileRef;
        }
        console.log('🔍 Task Download - fileRef:', fileRef);
        console.log('🔍 Task Download - objectKey extraído:', objectKey);
        // Intentar generar URL firmada con el objectKey directo
        try {
            const url = await (0, s3_1.getPresignedGetUrl)(objectKey);
            return res.json({ url });
        }
        catch (firstError) {
            // Si falla, puede ser una URL antigua con encodeURI
            // Intentar con encodeURI del objectKey para compatibilidad
            console.log('⚠️ Primer intento falló, probando con encodeURI para compatibilidad con URLs antiguas');
            const encodedKey = encodeURI(objectKey);
            console.log('🔍 Task Download - objectKey codificado:', encodedKey);
            const url = await (0, s3_1.getPresignedGetUrl)(encodedKey);
            return res.json({ url });
        }
    }
    catch (e) {
        console.error("getTaskFileDownloadUrl error", e);
        return res.status(500).json({ message: "Error generando URL de descarga" });
    }
};
exports.getTaskFileDownloadUrl = getTaskFileDownloadUrl;
