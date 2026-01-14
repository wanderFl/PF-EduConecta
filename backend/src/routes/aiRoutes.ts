import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AIService } from '../services/aiService';
import { authenticate } from '../middlewares/auth';
import mysql from 'mysql2/promise';

const router = Router();
const prisma = new PrismaClient();

// Crear pool de conexiones MySQL para CEIAF
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'crossover.proxy.rlwy.net',
  port: parseInt(process.env.MYSQL_PORT || '36858'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'VtpekYEGfcFxFvvODwsIQWNiWHyMhZJc',
  database: process.env.MYSQL_DATABASE || 'colegio_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * POST /api/ai/performance-report/:studentExternalId
 * Genera reporte de rendimiento con IA para un estudiante
 */
router.post('/performance-report/:studentExternalId', authenticate, async (req: any, res: Response) => {
  try {
    const { studentExternalId } = req.params;
    const parentId = req.user.userId; // ID del padre autenticado desde JWT

    console.log(`[AI Routes] Generating performance report for student ${studentExternalId}`);

    // Verificar que el usuario es padre del estudiante
    const parent = await prisma.parent.findFirst({
      where: {
        user: { id: parentId },
        student_links: {
          some: { student_external_id: studentExternalId }
        }
      }
    });

    if (!parent) {
      return res.status(403).json({ 
        error: 'No tienes permiso para ver este estudiante' 
      });
    }

    // Obtener datos del estudiante desde MySQL CEIAF (nombre)
    const connection = await mysqlPool.getConnection();
    let studentName = 'Estudiante';
    
    try {
      // Obtener información básica del estudiante de MySQL
      const [studentRows]: any = await connection.execute(
        'SELECT id_estudiante, nombres, apellidos FROM estudiantes WHERE id_estudiante = ?',
        [studentExternalId]
      );

      if (studentRows.length > 0) {
        const student = studentRows[0];
        studentName = `${student.nombres} ${student.apellidos}`;
      }

      connection.release();
    } catch (mysqlError) {
      connection.release();
      console.error('[AI Routes] Error getting student name from MySQL:', mysqlError);
      // Continuar con los datos de PostgreSQL aunque falle MySQL
    }

    // ====== OBTENER DATOS DESDE POSTGRESQL ======
    
    // 1. Obtener calificaciones desde SubmissionGrade (PostgreSQL)
    const studentExternalIdInt = parseInt(studentExternalId);
    
    const submissions = await prisma.submissionGrade.findMany({
      where: { 
        student_external_id: studentExternalIdInt,
        grade: { not: null }
      },
      include: {
        task: {
          select: {
            title: true,
            subject_external_id: true
          }
        }
      },
      orderBy: { submitted_at: 'desc' },
      take: 50
    });

    // Mapear materias
    const subjectNames: Record<number, string> = {
      1: 'Matemática',
      2: 'Lengua y Literatura', 
      3: 'Ciencias Naturales',
      4: 'Estudios Sociales',
      5: 'Inglés'
    };

    // 2. Obtener asistencias desde AttendanceRecord (PostgreSQL)
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { student_external_id: studentExternalIdInt }
    });

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => a.status === 'PRESENT').length;
    const absentUnj = attendanceRecords.filter(a => a.status === 'ABSENT_UNJUSTIFIED').length;
    const absentJustPending = attendanceRecords.filter(a => a.status === 'ABSENT_JUSTIFIED_PENDING').length;
    const absentJustAccepted = attendanceRecords.filter(a => a.status === 'ABSENT_JUSTIFIED_ACCEPTED').length;
    const absences = absentUnj + absentJustPending + absentJustAccepted;

    // 3. Obtener comportamiento desde DisciplinaryReport (PostgreSQL)
    const disciplinaryReports = await prisma.disciplinaryReport.findMany({
      where: { student_external_id: studentExternalIdInt },
      orderBy: { incident_date: 'desc' },
      take: 20
    });

    // 4. Obtener comunicaciones positivas (buscar en mensajes)
    const communications = await prisma.communication.findMany({
      where: { 
        student_external_id: studentExternalIdInt,
        is_behavioral_note: true // Notas de comportamiento
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Contar mensajes positivos basados en palabras clave
    const positiveNotes = communications.filter(c => {
      const latestMessage = c.messages[0];
      if (!latestMessage?.body) return false;
      const body = latestMessage.body.toLowerCase();
      return (
        body.includes('excelente') ||
        body.includes('muy bien') ||
        body.includes('felicitaciones') ||
        body.includes('destacado')
      );
    }).length;
    
    // Calcular métricas de comportamiento
    const incidents = disciplinaryReports.length;
    
    // Score: 10 base, -0.5 por cada incidente, +0.3 por cada nota positiva
    const behaviorScore = Math.min(10, Math.max(0, 
      10 - (incidents * 0.5) + (positiveNotes * 0.3)
    ));



      // Preparar datos para el servicio IA con datos de PostgreSQL
      // Agrupar tareas por materia
      const gradesBySubject = new Map<number, {
        subject_name: string;
        tasks: Array<{ task_name: string; grade: number; date: string | null; }>
      }>();

      for (const s of submissions) {
        const subjectId = s.task?.subject_external_id || 0;
        const subjectName = subjectId ? (subjectNames[subjectId] || 'General') : 'General';
        const taskName = s.task?.title || 'Tarea sin nombre';
        const grade = s.grade ? parseFloat(s.grade.toString()) : 0;
        const submittedDate = s.submitted_at;

        if (!gradesBySubject.has(subjectId)) {
          gradesBySubject.set(subjectId, {
            subject_name: subjectName,
            tasks: []
          });
        }

        gradesBySubject.get(subjectId)!.tasks.push({
          task_name: taskName,
          grade: grade,
          date: submittedDate ? submittedDate.toISOString() : null
        });
      }

      // Calcular promedio por materia y formatear datos
      const grades = Array.from(gradesBySubject.values()).map(subjectData => {
        const tasks = subjectData.tasks;
        const avgGrade = tasks.length > 0
          ? tasks.reduce((sum, t) => sum + t.grade, 0) / tasks.length
          : 0;

        return {
          subject: subjectData.subject_name,
          grade: Math.round(avgGrade * 10) / 10, // Redondear a 1 decimal
          max_grade: 10,
          tasks: tasks.map(t => ({
            task_name: t.task_name,
            grade: t.grade,
            max_grade: 10,
            date: t.date
          }))
        };
      });

      const performanceData = {
        student_id: studentExternalId,
        student_name: studentName,
        grades: grades,
        attendance: {
          total_days: totalDays || 0,
          attended_days: presentDays || 0,
          absences: absences || 0
        },
        behavior: {
          incidents: incidents,
          positive_notes: positiveNotes,
          behavior_score: behaviorScore
        }
      };

      console.log('[AI Routes] Performance data prepared:', JSON.stringify(performanceData, null, 2));

      // Llamar al servicio de IA
      console.log('[AI Routes] Calling AI service...');
      const aiResult = await AIService.analyzePerformance(performanceData);

      // Guardar reporte en la base de datos
      const report = await prisma.aIReport.create({
        data: {
          student_external_id: parseInt(studentExternalId),
          parent_id: parentId,
          report_type: 'performance',
          content: aiResult.analysis,
          metrics: aiResult.metrics
        }
      });

      console.log(`[AI Routes] Report saved with ID: ${report.id}`);
      console.log('[AI Routes] AI Result:', JSON.stringify(aiResult, null, 2));

      res.json({ 
        success: true, 
        report: {
          id: report.id,
          created_at: report.created_at
        },
        analysis: aiResult.analysis,
        metrics: aiResult.metrics
      });

  } catch (error: any) {
    console.error('[AI Routes] Error generating performance report:', error);
    res.status(500).json({ 
      error: 'Error al generar el reporte',
      details: error.message 
    });
  }
});

/**
 * POST /api/ai/task-recommendations/:studentExternalId
 * Genera recomendaciones de orden de tareas con IA
 */
router.post('/task-recommendations/:studentExternalId', authenticate, async (req: any, res: Response) => {
  try {
    const { studentExternalId } = req.params;
    const parentId = req.user.userId;

    console.log(`[AI Routes] Generating task recommendations for student ${studentExternalId}`);

    // Verificar permiso
    const parent = await prisma.parent.findFirst({
      where: {
        user: { id: parentId },
        student_links: {
          some: { student_external_id: studentExternalId }
        }
      }
    });

    if (!parent) {
      return res.status(403).json({ 
        error: 'No tienes permiso para ver este estudiante' 
      });
    }

    // Obtener tareas pendientes del estudiante
    const tasks = await prisma.task.findMany({
      where: {
        due_date: { gte: new Date() }, // Solo tareas futuras
        submissions: {
          none: {
            student_external_id: parseInt(studentExternalId),
            grade: { not: null } // Sin calificar aún
          }
        }
      },
      orderBy: { due_date: 'asc' },
      take: 10
    });

    if (tasks.length === 0) {
      return res.json({
        success: true,
        message: 'No hay tareas pendientes',
        recommendation: null
      });
    }

    // Obtener rendimiento por materia desde PostgreSQL (SubmissionGrade)
    const studentExternalIdInt = parseInt(studentExternalId);
    
    const submissions = await prisma.submissionGrade.findMany({
      where: { 
        student_external_id: studentExternalIdInt,
        grade: { not: null }
      },
      select: {
        grade: true,
        subject_external_id: true
      }
    });
    
    // Mapear materias
    const subjectNames: Record<number, string> = {
      1: 'Matemática',
      2: 'Lengua y Literatura',
      3: 'Ciencias Naturales',
      4: 'Estudios Sociales',
      5: 'Inglés'
    };
    
    // Calcular promedio por materia
    let performanceBySubject: Record<string, number> = {};
    const gradesBySubject: Record<string, number[]> = {};
    
    submissions.forEach(s => {
      if (s.subject_external_id && s.grade) {
        const subjectName = subjectNames[s.subject_external_id];
        if (subjectName) {
          if (!gradesBySubject[subjectName]) {
            gradesBySubject[subjectName] = [];
          }
          gradesBySubject[subjectName].push(parseFloat(s.grade.toString()));
        }
      }
    });
    
    // Calcular promedios
    Object.keys(gradesBySubject).forEach(subject => {
      const grades = gradesBySubject[subject];
      const average = grades.reduce((sum, g) => sum + g, 0) / grades.length;
      performanceBySubject[subject] = parseFloat(average.toFixed(2));
    });
    
    console.log('[AI Routes] Performance by subject:', performanceBySubject);

    // Preparar datos para IA
    const recommendationData = {
      student_id: studentExternalId,
      tasks: tasks.map(t => ({
        task_id: t.id,
        title: t.title,
        subject: t.subject_external_id ? subjectNames[t.subject_external_id] || 'General' : 'General',
        due_date: t.due_date.toISOString(),
        difficulty: 'medium', // Podrías calcularlo basándote en max_points
        estimated_time: t.max_points ? t.max_points * 10 : 60 // Estimación simple
      })),
      current_performance: performanceBySubject
    };

    // Llamar al servicio de IA
    console.log('[AI Routes] Calling AI service for task recommendations...');
    console.log('[AI Routes] Sending tasks:', tasks.map(t => ({ id: t.id, title: t.title })));
    const aiResult = await AIService.recommendTaskOrder(recommendationData);

    console.log('[AI Routes] Raw AI Result:', JSON.stringify(aiResult.recommendation, null, 2));

    // Crear mapa de tareas para referencia rápida (por UUID)
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Procesar recommended_order
    if (aiResult.recommendation.recommended_order && Array.isArray(aiResult.recommendation.recommended_order)) {
      aiResult.recommendation.recommended_order = aiResult.recommendation.recommended_order.map((item: any, index: number) => {
        const taskId = item.task_id || item;
        const task = taskMap.get(taskId);
        
        if (task) {
          console.log(`[AI Routes] Mapped task ${index + 1}: ${task.title}`);
          return {
            task_id: task.id,
            title: task.title,
            priority: item.priority || (index + 1),
            reason: item.reason || `Prioridad ${index + 1} según análisis de IA`
          };
        } else {
          console.warn(`[AI Routes] Task not found for ID: ${taskId}, using fallback`);
          // Si la IA devolvió el título directamente, intentar buscar por título
          const taskByTitle = tasks.find(t => t.title === item.title);
          if (taskByTitle) {
            return {
              task_id: taskByTitle.id,
              title: taskByTitle.title,
              priority: item.priority || (index + 1),
              reason: item.reason || `Prioridad ${index + 1} según análisis de IA`
            };
          }
          
          return {
            task_id: taskId,
            title: item.title || 'Tarea sin identificar',
            priority: item.priority || (index + 1),
            reason: item.reason || `Prioridad ${index + 1} según análisis de IA`
          };
        }
      });
    }

    // Procesar daily_plan: reemplazar UUIDs con títulos
    if (aiResult.recommendation.daily_plan) {
      const correctedDailyPlan: Record<string, string[]> = {};
      
      Object.entries(aiResult.recommendation.daily_plan).forEach(([day, items]: [string, any]) => {
        const taskTitles: string[] = [];
        const itemsArray = Array.isArray(items) ? items : [items];
        
        itemsArray.forEach((item: any) => {
          // Intentar buscar por UUID
          let task = taskMap.get(item);
          
          if (task) {
            taskTitles.push(task.title);
          } else if (typeof item === 'string') {
            // Si es un string que no es UUID, verificar si es un título
            const taskByTitle = tasks.find(t => t.title === item);
            if (taskByTitle) {
              taskTitles.push(taskByTitle.title);
            } else {
              // Usar el string directamente (podría ser una descripción de la IA)
              taskTitles.push(item);
            }
          } else {
            taskTitles.push(String(item));
          }
        });
        
        correctedDailyPlan[day] = taskTitles;
      });
      
      aiResult.recommendation.daily_plan = correctedDailyPlan;
    }

    console.log('[AI Routes] Final processed recommendation:', JSON.stringify({
      recommended_order_count: aiResult.recommendation.recommended_order?.length || 0,
      daily_plan_keys: Object.keys(aiResult.recommendation.daily_plan || {}),
      tips_count: aiResult.recommendation.tips?.length || 0
    }));

    // Guardar recomendación
    const report = await prisma.aIReport.create({
      data: {
        student_external_id: parseInt(studentExternalId),
        parent_id: parentId,
        report_type: 'task_order',
        content: aiResult.recommendation
      }
    });

    console.log(`[AI Routes] Recommendation saved with ID: ${report.id}`);

    res.json({ 
      success: true,
      report: {
        id: report.id,
        created_at: report.created_at
      },
      recommendation: aiResult.recommendation 
    });

  } catch (error: any) {
    console.error('[AI Routes] Error generating task recommendations:', error);
    res.status(500).json({ 
      error: 'Error al generar recomendaciones',
      details: error.message 
    });
  }
});

/**
 * GET /api/ai/reports/:studentExternalId
 * Obtiene el historial de reportes de IA para un estudiante
 */
router.get('/reports/:studentExternalId', authenticate, async (req: any, res: Response) => {
  try {
    const { studentExternalId } = req.params;
    const { type } = req.query;
    const parentId = req.user.userId;

    // Verificar permiso
    const parent = await prisma.parent.findFirst({
      where: {
        user: { id: parentId },
        student_links: {
          some: { student_external_id: studentExternalId }
        }
      }
    });

    if (!parent) {
      return res.status(403).json({ 
        error: 'No tienes permiso para ver este estudiante' 
      });
    }

    // Obtener reportes
    const reports = await prisma.aIReport.findMany({
      where: {
        student_external_id: parseInt(studentExternalId),
        ...(type && { report_type: type as string })
      },
      orderBy: { created_at: 'desc' },
      take: 20
    });

    res.json({ 
      success: true,
      count: reports.length,
      reports 
    });

  } catch (error: any) {
    console.error('[AI Routes] Error fetching reports:', error);
    res.status(500).json({ 
      error: 'Error al obtener reportes',
      details: error.message 
    });
  }
});

/**
 * GET /api/ai/health
 * Verifica el estado del servicio de IA
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await AIService.healthCheck();
    
    res.json({
      ai_service: isHealthy ? 'healthy' : 'unavailable',
      backend: 'healthy'
    });
  } catch (error) {
    res.json({
      ai_service: 'unavailable',
      backend: 'healthy'
    });
  }
});

export default router;
