import api from "./api";

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  objectKey: string;
}

/**
 * Obtiene una URL firmada para subir un archivo de conversación a S3.
 * @param studentId ID del estudiante
 * @param conversationId ID de la conversación
 * @param file Archivo a subir
 */
export async function getPresignedConversationUploadUrl(
  studentId: number,
  conversationId: string,
  file: File
): Promise<PresignedUploadResponse> {
  const { data } = await api.post("/familia/comunicados/upload-url", {
    studentId,
    conversationId,
    filename: file.name,
    contentType: file.type,
  });
  return data;
}

/**
 * Sube el archivo directamente a S3 usando la URL firmada.
 * @param uploadUrl URL firmada obtenida del backend
 * @param file Archivo a subir
 */
export async function uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });
}

/**
 * Helper que combina ambos pasos: obtener URL y subir.
 * Retorna la URL final del archivo y su nombre.
 */
export async function uploadConversationAttachment(
  studentId: number,
  conversationId: string,
  file: File
): Promise<{ url: string; file_name: string; mime_type: string; size_bytes: number }> {
  const { uploadUrl, fileUrl } = await getPresignedConversationUploadUrl(studentId, conversationId, file);
  await uploadFileToS3(uploadUrl, file);
  
  return {
    url: fileUrl,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size
  };
}

/**
 * Obtiene una URL firmada para descargar un archivo.
 * @param fileRef URL completa o key del archivo
 */
export async function getFileDownloadUrl(fileRef: string): Promise<string> {
  const { data } = await api.get("/familia/download-url", {
    params: { fileRef },
  });
  return data.url;
}
