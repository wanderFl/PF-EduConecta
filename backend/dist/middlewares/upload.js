"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadError = exports.uploadTaskFile = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Ensure tasks subdirectory exists
const tasksUploadsDir = path_1.default.join(uploadsDir, 'tasks');
if (!fs_1.default.existsSync(tasksUploadsDir)) {
    fs_1.default.mkdirSync(tasksUploadsDir, { recursive: true });
}
// Configure multer for file storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tasksUploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-originalname
        const timestamp = Date.now();
        const originalName = file.originalname;
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}-${sanitizedName}`);
    }
});
// File filter (optional - only allow certain file types)
const fileFilter = (req, file, cb) => {
    // Allow common document and image formats
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten documentos PDF, Word, imágenes y archivos de texto.'));
    }
};
// Create multer instance
exports.uploadTaskFile = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('archivo'); // 'archivo' matches the FormData field name from frontend
// Middleware function to handle upload errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
            });
        }
        return res.status(400).json({
            error: `Error de carga: ${err.message}`
        });
    }
    if (err) {
        return res.status(400).json({
            error: err.message
        });
    }
    next();
};
exports.handleUploadError = handleUploadError;
