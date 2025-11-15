import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { uploadTaskFile, handleUploadError } from '../middlewares/upload';
import { Role, PrismaClient } from '../../generated/prisma';
import { ceiafPool } from '../ext/ceiafDb';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Protected routes examples
router.get(
  '/directivo/dashboard',
  authenticate,
  authorize(Role.DIRECTIVO),
  (req: Request, res: Response) => {
    res.json({ message: 'Directivo dashboard data' });
  }
);

router.get(
  '/docente/courses',
  authenticate,
  authorize(Role.DOCENTE),
  (req: Request, res: Response) => {
    res.json({ message: 'Docente courses data' });
  }
);

// Endpoint para crear tarea con soporte de archivos adjuntos
router.post(
  '/docente/tareas/create',
  authenticate,
  authorize(Role.DOCENTE),
  uploadTaskFile,
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      const { nombre, instrucciones, puntuacion, fechaVencimiento, cursoId, paralelo } = req.body;
      
      console.log('📝 Datos recibidos para crear tarea:', {
        nombre, 
        instrucciones, 
        puntuacion, 
        fechaVencimiento, 
        cursoId,
        paralelo,
        hasFile: !!req.file
      });
      
      // Validaciones básicas
      if (!nombre || !fechaVencimiento || !cursoId) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, fecha de vencimiento y curso son requeridos'
        });
      }

      // Validar puntuación
      const puntuacionNum = puntuacion ? parseFloat(puntuacion) : 0;
      if (isNaN(puntuacionNum) || puntuacionNum < 0 || puntuacionNum > 10) {
        return res.status(400).json({
          success: false,
          message: 'La puntuación debe ser un número entre 0 y 10'
        });
      }

      // Validar fecha
      const fechaDate = new Date(fechaVencimiento);
      if (isNaN(fechaDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de vencimiento inválida'
        });
      }

      // Resolver teacher_external_id: buscar usuario y tomar su external_id si existe
      const teacherUser = await prisma.user.findUnique({ where: { id: req.user?.userId } });
      const teacherExternalId = teacherUser && teacherUser.external_id ? parseInt(teacherUser.external_id, 10) : 0;

      // Resolver course_external_id: aceptar tanto valores numéricos como aliases (8vo, 9no...)
      const parseCourseId = (cid: string) => {
        const asInt = parseInt(cid, 10);
        if (!isNaN(asInt)) return asInt;
        const map: Record<string, number> = {
          '8vo': 8,
          '9no': 9,
          '10mo': 10,
          '1bgu': 11,
          '2bgu': 12,
          '3bgu': 13,
        };
        return map[cid.toLowerCase()] ?? 0;
      };

      const courseExternalId = parseCourseId(String(cursoId));
      
      if (courseExternalId === 0) {
        return res.status(400).json({
          success: false,
          message: `Curso inválido: ${cursoId}. Use un número (8-13) o formato válido (8vo, 9no, etc.)`
        });
      }

      console.log('✅ Datos validados:', {
        courseExternalId,
        puntuacionNum,
        teacherExternalId
      });

      // Procesar archivo adjunto si existe
      let fileReference = null;
      if (req.file) {
        // Guardar la ruta relativa del archivo
        fileReference = `uploads/tasks/${req.file.filename}`;
        console.log('Archivo adjunto guardado:', {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: fileReference,
          size: req.file.size
        });
      }

      // Crear registro en la tabla tasks de Prisma
      const task = await prisma.task.create({
        data: {
          title: nombre,
          instructions: instrucciones || null,
          max_points: puntuacionNum || null,
          file_reference: fileReference,
          due_date: fechaDate,
          teacher_external_id: teacherExternalId,
          course_external_id: courseExternalId,
          paralelo: paralelo || null
        }
      });

      console.log('Tarea guardada en Prisma:', { 
        id: task.id, 
        title: task.title,
        fileReference: task.file_reference
      });

      res.status(201).json({
        success: true,
        message: 'Tarea creada exitosamente',
        task: {
          id: task.id,
          title: task.title,
          instructions: task.instructions,
          max_points: task.max_points,
          file_reference: task.file_reference,
          due_date: task.due_date,
          course_external_id: task.course_external_id,
          paralelo: task.paralelo
        }
      });

    } catch (error) {
      console.error('❌ Error creating task:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

router.get(
  '/familia/students',
  authenticate,
  authorize(Role.FAMILIA),
  (req: Request, res: Response) => {
    res.json({ message: 'Familia students data' });
  }
);

// Endpoint para obtener tareas de un curso específico con estudiantes y calificaciones
router.get(
  '/docente/tareas/:cursoId',
  authenticate,
  authorize(Role.DOCENTE),
  async (req: Request, res: Response) => {
    try {
      const { cursoId } = req.params;

      // Convertir cursoId a course_external_id
      const parseCourseId = (cid: string) => {
        const asInt = parseInt(cid, 10);
        if (!isNaN(asInt)) return asInt;
        const map: Record<string, number> = {
          '8vo': 8,
          '9no': 9,
          '10mo': 10,
          '1bgu': 11,
          '2bgu': 12,
          '3bgu': 13,
        };
        return map[cid.toLowerCase()] ?? 0;
      };

      const courseExternalId = parseCourseId(cursoId);

      // Obtener tareas del curso
      const tasks = await prisma.task.findMany({
        where: {
          course_external_id: courseExternalId
        },
        include: {
          submissions: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // Obtener estudiantes del curso desde MySQL
      let students = [];
      try {
        const [rows] = await ceiafPool.execute(
          'SELECT id_estudiante as id, CONCAT(nombres, " ", apellidos) as nombre_completo FROM estudiantes WHERE id_curso = ?',
          [courseExternalId]
        ) as any;
        students = rows || [];
      } catch (error) {
        console.error('Error fetching students from MySQL:', error);
        // Si no se puede conectar a MySQL, devolver array vacío
        students = [];
      }

      // Formatear respuesta
      const formattedTasks = tasks.map(task => ({
        id: task.id,
        title: task.title,
        instructions: task.instructions,
        due_date: task.due_date,
        max_points: task.max_points,
        file_reference: task.file_reference,
        created_at: task.created_at,
        students: students.map((student: any) => {
          const submission = task.submissions.find(
            sub => sub.student_external_id === student.id
          );
          return {
            id: student.id,
            nombre_completo: student.nombre_completo,
            grade: submission?.grade ? parseFloat(submission.grade.toString()) : null,
            file_reference: submission?.file_reference || null,
            submission_id: submission?.id || null,
            comment_student: submission?.comment_student || null,
            comment_teacher: submission?.comment_teacher || null,
            submitted_at: submission?.submitted_at || null,
            graded_at: submission?.graded_at || null,
            has_submission: !!submission
          };
        })
      }));

      res.json({
        success: true,
        tasks: formattedTasks
      });

    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Endpoint para calificar una tarea específica de un estudiante
router.post(
  '/docente/tareas/:tareaId/calificar',
  authenticate,
  authorize(Role.DOCENTE),
  async (req: Request, res: Response) => {
    try {
      const { tareaId } = req.params;
      const { studentId, grade, comment } = req.body;

      // Validaciones
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'ID del estudiante es requerido'
        });
      }

      if (grade === null || grade === undefined) {
        return res.status(400).json({
          success: false,
          message: 'La calificación es requerida'
        });
      }

      const gradeNum = parseFloat(grade);
      if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
        return res.status(400).json({
          success: false,
          message: 'La calificación debe ser un número entre 0 y 10'
        });
      }

      // Verificar que la tarea existe
      const task = await prisma.task.findUnique({
        where: { id: tareaId }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      // Verificar que el estudiante existe en MySQL
      try {
        const [rows] = await ceiafPool.execute(
          'SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?',
          [studentId]
        ) as any;
        
        if (!rows || rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Estudiante no encontrado'
          });
        }
      } catch (error) {
        console.error('Error validating student in MySQL:', error);
        return res.status(500).json({
          success: false,
          message: 'Error validando estudiante'
        });
      }

      // Buscar si ya existe una calificación
      let submission = await prisma.submissionGrade.findFirst({
        where: {
          task_id: tareaId,
          student_external_id: parseInt(studentId)
        }
      });

      if (submission) {
        // Actualizar calificación existente
        submission = await prisma.submissionGrade.update({
          where: { id: submission.id },
          data: { 
            grade: gradeNum,
            comment_teacher: comment || null,
            graded_at: new Date()
          }
        });
      } else {
        // Crear nueva calificación
        submission = await prisma.submissionGrade.create({
          data: {
            task_id: tareaId,
            student_external_id: parseInt(studentId),
            grade: gradeNum,
            comment_teacher: comment || null,
            graded_at: new Date()
          }
        });
      }

      res.json({
        success: true,
        message: 'Calificación registrada exitosamente',
        submission: {
          id: submission.id,
          grade: parseFloat(submission.grade?.toString() || '0'),
          comment_teacher: submission.comment_teacher,
          comment_student: submission.comment_student,
          student_id: submission.student_external_id,
          graded_at: submission.graded_at,
          submitted_at: submission.submitted_at
        }
      });

    } catch (error) {
      console.error('Error saving grade:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Endpoint para descargar archivos de entregas de estudiantes
router.get(
  '/docente/files/submissions/:filename',
  authenticate,
  authorize(Role.DOCENTE),
  (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      
      // Construir la ruta segura del archivo de entrega
      const filePath = path.join(process.cwd(), 'uploads', 'submissions', filename);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo de entrega no encontrado'
        });
      }

      // Enviar el archivo
      res.download(filePath, (err) => {
        if (err) {
          console.error('Error downloading submission file:', err);
          res.status(500).json({
            success: false,
            message: 'Error descargando archivo de entrega'
          });
        }
      });

    } catch (error) {
      console.error('Error accessing submission file:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Endpoint para descargar archivos de tareas
router.get(
  '/docente/files/tasks/:filename',
  authenticate,
  authorize(Role.DOCENTE),
  (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      
      // Construir la ruta segura del archivo
      const filePath = path.join(process.cwd(), 'uploads', 'tasks', filename);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      // Enviar el archivo
      res.download(filePath, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          res.status(500).json({
            success: false,
            message: 'Error descargando archivo'
          });
        }
      });

    } catch (error) {
      console.error('Error accessing file:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);


export default router;