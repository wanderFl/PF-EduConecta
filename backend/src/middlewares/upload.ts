import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure tasks subdirectory exists
const tasksUploadsDir = path.join(uploadsDir, 'tasks');
if (!fs.existsSync(tasksUploadsDir)) {
  fs.mkdirSync(tasksUploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
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
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten documentos PDF, Word, imágenes y archivos de texto.'));
  }
};

// Create multer instance
export const uploadTaskFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('archivo'); // 'archivo' matches the FormData field name from frontend

// Middleware function to handle upload errors
export const handleUploadError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
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
