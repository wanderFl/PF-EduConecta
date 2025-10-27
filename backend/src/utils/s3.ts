import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const AWS_REGION = process.env.AWS_REGION!;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
if (!AWS_REGION) throw new Error("AWS_REGION is required");
if (!AWS_BUCKET_NAME) throw new Error("AWS_BUCKET_NAME is required");

// El SDK detecta credentials por env (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
export const s3 = new S3Client({ region: AWS_REGION });

/**
 * submissions/{studentId}/{taskId}/{timestamp}_{fileName}
 */
export function buildObjectKey(studentId: number, taskId: string, filename: string) {
  const safe = filename.replace(/[^\w.\-]+/g, "_"); // sanitizar
  const ts = Date.now();
  return `submissions/${studentId}/${taskId}/${ts}_${safe}`;
}

/**
 * Devuelve URL firmada (PUT) para subir desde el navegador
 * y la URL "pública" (no accesible si el bucket es privado, pero sirve como referencia).
 * Para descargas seguras, luego generamos un GET firmado.
 */
export async function getPresignedPutUrl(objectKey: string, contentType: string) {
  const put = new PutObjectCommand({
    Bucket: AWS_BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType || "application/octet-stream",
  });

  // V4 presigned URL, 15 minutos
  const uploadUrl = await getSignedUrl(s3, put, { expiresIn: 15 * 60 });

  // URL HTTPS (si el bucket es privado, no será accesible públicamente)
  const fileUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${encodeURI(objectKey)}`;

  return { uploadUrl, fileUrl };
}

export function buildJustificationKey(studentId: number, ymd: string, filename: string) {
  // ymd = "YYYY-MM-DD"
  const safe = filename.replace(/[^\w.\-]+/g, "_");
  const ts = Date.now();
  return `attendance/${studentId}/${ymd}/${ts}_${safe}`;
}

