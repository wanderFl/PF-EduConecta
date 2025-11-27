"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3 = void 0;
exports.buildObjectKey = buildObjectKey;
exports.buildTaskObjectKey = buildTaskObjectKey;
exports.getPresignedPutUrl = getPresignedPutUrl;
exports.buildJustificationKey = buildJustificationKey;
exports.getPresignedGetUrl = getPresignedGetUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_s3_2 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const AWS_REGION = process.env.AWS_REGION;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
if (!AWS_REGION)
    throw new Error("AWS_REGION is required");
if (!AWS_BUCKET_NAME)
    throw new Error("AWS_BUCKET_NAME is required");
// El SDK detecta credentials por env (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
exports.s3 = new client_s3_2.S3Client({ region: AWS_REGION });
/**
 * submissions/{studentId}/{taskId}/{timestamp}_{fileName}
 */
function buildObjectKey(studentId, taskId, filename) {
    const safe = filename.replace(/[^\w.\-]+/g, "_"); // sanitizar
    const ts = Date.now();
    return `submissions/${studentId}/${taskId}/${ts}_${safe}`;
}
/**
 * tasks/{teacherId}/{timestamp}_{fileName}
 */
function buildTaskObjectKey(teacherId, filename) {
    const safe = filename.replace(/[^\w.\-]+/g, "_"); // sanitizar
    const ts = Date.now();
    return `tasks/${teacherId}/${ts}_${safe}`;
}
/**
 * Devuelve URL firmada (PUT) para subir desde el navegador
 * y la URL "pública" (no accesible si el bucket es privado, pero sirve como referencia).
 * Para descargas seguras, luego generamos un GET firmado.
 */
async function getPresignedPutUrl(objectKey, contentType) {
    const put = new client_s3_2.PutObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: objectKey,
        ContentType: contentType || "application/octet-stream",
    });
    // V4 presigned URL, 15 minutos
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(exports.s3, put, { expiresIn: 15 * 60 });
    // URL HTTPS (si el bucket es privado, no será accesible públicamente)
    const fileUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${encodeURI(objectKey)}`;
    return { uploadUrl, fileUrl };
}
function buildJustificationKey(studentId, ymd, filename) {
    // ymd = "YYYY-MM-DD"
    const safe = filename.replace(/[^\w.\-]+/g, "_");
    const ts = Date.now();
    return `attendance/${studentId}/${ymd}/${ts}_${safe}`;
}
// 🔽 NUEVO: URL firmada para DESCARGA (GET)
async function getPresignedGetUrl(objectKey) {
    const get = new client_s3_1.GetObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: objectKey,
    });
    // URL GET firmada, por ejemplo 10 minutos
    const downloadUrl = await (0, s3_request_presigner_1.getSignedUrl)(exports.s3, get, { expiresIn: 10 * 60 });
    return downloadUrl;
}
