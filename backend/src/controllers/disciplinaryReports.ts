import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ceiafPool } from '../ext/ceiafDb';

import { sendNotification } from "../services/notificationSender";

const prisma = new PrismaClient();

// Obtener cursos y paralelos desde MySQL
export const getCoursesAndParalelos = async (req: Request, res: Response) => {
  try {
    const [courses] = await ceiafPool.query(`
      SELECT DISTINCT c.id_curso, c.nombre, c.paralelo, c.nivel
      FROM cursos c 
      ORDER BY c.nivel, c.nombre, c.paralelo
    `);
    
    res.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error al obtener cursos' });
  }
};

// Obtener estudiantes por curso y paralelo desde MySQL
export const getStudentsByCourse = async (req: Request, res: Response) => {
  try {
    const { courseId, paralelo } = req.query;
    
    if (!courseId || !paralelo) {
      return res.status(400).json({ message: 'Se requiere courseId y paralelo' });
    }
    
    const [students] = await ceiafPool.query(
      `
      SELECT DISTINCT 
        e.id_estudiante, 
        e.nombres, 
        e.apellidos,
        e.cedula,
        c.nombre AS nombre,
        c.paralelo
      FROM estudiantes e
      INNER JOIN cursos c ON e.id_curso = c.id_curso
      WHERE c.id_curso = ? AND c.paralelo = ?
      ORDER BY e.apellidos, e.nombres
      `,
      [courseId, paralelo]
    );
    
    res.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error al obtener estudiantes' });
  }
};

// Crear reporte disciplinario
export const createDisciplinaryReport = async (req: Request, res: Response) => {
  try {
    const {
      student_external_ids,
      course_external_id,
      paralelo,
      title,
      description,
      severity,
      category,
      incident_date
    } = req.body;
    
    const inspector_external_id = (req as any).user.userId;
    
    // Validaciones
    if (!student_external_ids || !Array.isArray(student_external_ids) || student_external_ids.length === 0) {
      return res.status(400).json({ message: 'Se requiere al menos un estudiante' });
    }
    
    if (!course_external_id || !paralelo || !title || !description || !severity || !category || !incident_date) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    // Validar severity
    const validSeverities = ['LEVE', 'MODERADA', 'GRAVE'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({ message: 'Severidad inválida' });
    }
    
    // Validar category
    const validCategories = ['COMPORTAMIENTO', 'ACADEMICO', 'ASISTENCIA', 'UNIFORME', 'OTROS'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Categoría inválida' });
    }
    
    // Crear reportes para cada estudiante seleccionado
    const reports = await Promise.all(
      student_external_ids.map((student_id: number) =>
        prisma.disciplinaryReport.create({
          data: {
            student_external_id: student_id,
            course_external_id: parseInt(course_external_id),
            inspector_external_id,
            title,
            description,
            severity,
            category,
            incident_date: new Date(incident_date),
            status: 'ENVIADA'
          }
        })
      )
    );
    
    // NOTIFICACIÓN: Novedad de Disciplina
    (async () => {
      try {
        for (const report of reports) {
          const link = await prisma.parentStudentLink.findFirst({
            where: { student_external_id: String(report.student_external_id) },
            include: { parent: { include: { user: true } } }
          });
          if (link?.parent?.user?.id) {
            sendNotification(
              link.parent.user.id,
              "Novedad de Disciplina",
              `Se ha registrado una novedad: ${title} (${severity})`,
              "DISCIPLINARY_REPORT",
              { reportId: report.id, severity }
            );
          }
        }
      } catch (e) {
        console.error("Error sending disciplinary notification:", e);
      }
    })();

    res.status(201).json({
      message: `Se crearon ${reports.length} reporte(s) exitosamente`,
      reports
    });
  } catch (error) {
    console.error('Error creating disciplinary report:', error);
    res.status(500).json({ message: 'Error al crear el reporte' });
  }
};

// Obtener reportes del inspector
export const getInspectorReports = async (req: Request, res: Response) => {
  try {
    const inspector_external_id = (req as any).user.userId;
    
    const reports = await prisma.disciplinaryReport.findMany({
      where: {
        inspector_external_id
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
};
