"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const uuid_1 = require("uuid");
// Configurar AWS
aws_sdk_1.default.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const s3 = new aws_sdk_1.default.S3();
class S3Service {
    constructor() {
        this.bucket = process.env.AWS_BUCKET_NAME || 'educonecta-uploads-dev';
    }
    /**
     * Subir archivo a S3
     */
    async uploadFile(file, folder = 'tasks') {
        try {
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${(0, uuid_1.v4)()}.${fileExtension}`;
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
        }
        catch (error) {
            console.error('Error uploading file to S3:', error);
            throw new Error('Error al subir archivo a S3');
        }
    }
    /**
     * Generar URL presignada para acceso temporal al archivo
     */
    async getSignedUrl(key, expiresIn = 3600) {
        try {
            const params = {
                Bucket: this.bucket,
                Key: key,
                Expires: expiresIn, // Tiempo en segundos
            };
            return s3.getSignedUrl('getObject', params);
        }
        catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error('Error al generar URL del archivo');
        }
    }
    /**
     * Eliminar archivo de S3
     */
    async deleteFile(key) {
        try {
            const params = {
                Bucket: this.bucket,
                Key: key,
            };
            await s3.deleteObject(params).promise();
            console.log('Archivo eliminado de S3:', key);
        }
        catch (error) {
            console.error('Error deleting file from S3:', error);
            throw new Error('Error al eliminar archivo de S3');
        }
    }
    /**
     * Verificar si el archivo existe en S3
     */
    async fileExists(key) {
        try {
            await s3.headObject({
                Bucket: this.bucket,
                Key: key,
            }).promise();
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.S3Service = S3Service;
// Instancia singleton del servicio
exports.s3Service = new S3Service();
