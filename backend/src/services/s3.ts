import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configurar AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

export class S3Service {
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_BUCKET_NAME || 'educonecta-uploads-dev';
  }

  /**
   * Subir archivo a S3
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'tasks'): Promise<UploadResult> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const key = `${folder}/${fileName}`;

      const uploadParams = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private', // Archivo privado, acceso controlado
      };

      console.log('Subiendo archivo a S3:', { key, size: file.size, type: file.mimetype });

      const result = await s3.upload(uploadParams).promise();

      return {
        key: key,
        url: result.Location,
        bucket: this.bucket,
      };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Error al subir archivo a S3');
    }
  }

  /**
   * Generar URL presignada para acceso temporal al archivo
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn, // Tiempo en segundos
      };

      return s3.getSignedUrl('getObject', params);
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Error al generar URL del archivo');
    }
  }

  /**
   * Eliminar archivo de S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      };

      await s3.deleteObject(params).promise();
      console.log('Archivo eliminado de S3:', key);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error('Error al eliminar archivo de S3');
    }
  }

  /**
   * Verificar si el archivo existe en S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await s3.headObject({
        Bucket: this.bucket,
        Key: key,
      }).promise();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Instancia singleton del servicio
export const s3Service = new S3Service();