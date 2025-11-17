// prisma/seed_directivo_demo.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ===== Config =====
const COURSE_ID = 1;      // id_curso = 1
const STUDENT_ID = 1;     // 👈 Solo este estudiante

// Mapeo id_materia -> id_docente (según tu captura)
const SUBJECT_TEACHER_MAP = [
  { subjectId: 1, teacherId: 1 },   // Matemática
  { subjectId: 2, teacherId: 2 },   // Lengua y Literatura
  { subjectId: 3, teacherId: 5 },   // Inglés
  { subjectId: 4, teacherId: 3 },   // Ciencias Naturales
  { subjectId: 5, teacherId: 4 },   // Estudios Sociales
  { subjectId: 6, teacherId: 11 },  // Educación Cultural y Artística
  { subjectId: 7, teacherId: 6 },   // Educación Física
  { subjectId: 8, teacherId: 19 },  // Informática
  { subjectId: 9, teacherId: 12 },  // Emprendimiento y Gestión
];

// Nombres por materia
const SUBJECT_NAMES: Record<number, string> = {
  1: "Matemática",
  2: "Lengua y Literatura",
  3: "Inglés",
  4: "Ciencias Naturales",
  5: "Estudios Sociales",
  6: "Educación Cultural y Artística",
  7: "Educación Física",
  8: "Informática",
  9: "Emprendimiento y Gestión",
};

// 4 títulos por materia
const SUBJECT_TASK_TITLES: Record<number, string[]> = {
  1: ["Evaluación de fracciones", "Ecuaciones de primer grado", "Geometría: polígonos", "Estadística básica"],
  2: ["Ensayo breve: tema libre", "Comprensión lectora", "Análisis de poema", "Gramática: oraciones compuestas"],
  3: ["Simple past worksheet", "Vocabulary quiz: School", "Reading: Short story", "Listening practice A1"],
  4: ["Ciclo del agua", "Ecosistemas locales", "Estados de la materia", "Fotosíntesis (informe)"],
  5: ["Mapas políticos de Sudamérica", "Revolución Industrial (línea de tiempo)", "Pueblos originarios", "Causas de la I Guerra Mundial"],
  6: ["Boceto de paisaje", "Apreciación de mural", "Proyecto collage", "Crítica de obra local"],
  7: ["Rutina de calentamiento", "Prueba de resistencia (Cooper)", "Técnica de pase", "Flexibilidad y estiramiento"],
  8: ["Algoritmos con pseudocódigo", "HTML: mi primera página", "CSS básico", "Introducción a variables (JS)"],
  9: ["Canvas de modelo de negocio", "Idea de emprendimiento", "Costos fijos y variables", "Pitch de negocio (borrador)"],
};

const BASE_DATE = new Date(Date.UTC(2025, 9, 1)); // 2025-10-01 UTC
const SEED_TAG = "[SEED:directivo-demo]";

function addDays(date: Date, d: number) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + d);
  return copy;
}

function randomGrade(): string {
  const n = 6 + Math.random() * 4; // [6,10)
  return (Math.round(n * 100) / 100).toFixed(2);
}

// (Opcional) si quieres también randomizar trimestre y aporte:
function randomTrimestre(): number {
  return Math.floor(Math.random() * 3) + 1; // 1..3
}
function randomAporte(): number {
  return Math.floor(Math.random() * 2) + 1; // 1..2
}

async function main() {
  console.log("⏳ Limpiando datos previos del seed…");

  const oldTasks = await prisma.task.findMany({
    where: {
      course_external_id: COURSE_ID,
      instructions: { contains: SEED_TAG },
    },
    select: { id: true },
  });

  if (oldTasks.length > 0) {
    const taskIds = oldTasks.map(t => t.id);

    const delSubs = await prisma.submissionGrade.deleteMany({
      where: { task_id: { in: taskIds } },
    });

    const delTasks = await prisma.task.deleteMany({
      where: { id: { in: taskIds } },
    });

    console.log(`🧹 Eliminadas ${delSubs.count} SubmissionGrades y ${delTasks.count} Tasks.`);
  }

  console.log("🚀 Creando tareas + calificaciones solo para el estudiante 1…");

  let createdTasks = 0;
  let createdSubs = 0;

  for (const { subjectId, teacherId } of SUBJECT_TEACHER_MAP) {
    const subjectName = SUBJECT_NAMES[subjectId];
    const titles = SUBJECT_TASK_TITLES[subjectId];

    for (let i = 0; i < 4; i++) {
      const title = `${subjectName}: ${titles[i]}`;
      const due = addDays(BASE_DATE, (i * 6) + (subjectId % 3));

      // Opcional: reparto trimestre/aporte "bonito" en vez de 100% random
      const trimestre = randomTrimestre();
      const aporte = randomAporte();

      // 1) Task
      const task = await prisma.task.create({
        data: {
          title,
          instructions: `${SEED_TAG} Tarea #${i + 1} de ${subjectName} para estudiante ${STUDENT_ID}`,
          due_date: due,
          subject_external_id: subjectId,
          teacher_external_id: teacherId,
          course_external_id: COURSE_ID,
          trimestre,
          aporte,
        },
        select: { id: true },
      });
      createdTasks++;

      // 2) SubmissionGrade
      await prisma.submissionGrade.create({
        data: {
          task_id: task.id,
          student_external_id: STUDENT_ID,
          grade: randomGrade(),
          file_reference: null,
          student_comment: null,
          subject_external_id: subjectId,
          course_external_id: COURSE_ID,
        },
      });
      createdSubs++;
    }
  }

  console.log(`✅ Hecho. Tasks: ${createdTasks} — SubmissionGrades: ${createdSubs}.`);
  // Ahora será: 9 materias * 4 tareas = 36 tasks y 36 submissions para el estudiante 1.
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
