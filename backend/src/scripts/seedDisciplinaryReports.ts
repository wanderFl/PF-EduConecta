import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Config
const STUDENT_ID = 1;
const COURSE_ID = 1;
const INSPECTOR_ID = "5";

const titles = [
  "Incumplimiento de normas",
  "Comportamiento inadecuado en clase",
  "Falta de respeto a compañeros",
  "Distracciones constantes durante la jornada"
];

const descriptions = [
  "El estudiante presentó conductas contrarias al reglamento interno.",
  "Se registró un comportamiento inapropiado durante la clase asignada.",
  "Hubo un incidente de falta de respeto hacia otro estudiante.",
  "Se observaron múltiples distracciones afectando el desarrollo de la clase."
];

const severities = ["LEVE", "MODERADA", "GRAVE"];
const categories = ["COMPORTAMIENTO", "ASISTENCIA", "UNIFORME", "OTROS"];

// Función auxiliar para fecha reciente (últimos 10 días)
function randomRecentDate() {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * 10));
  return d;
}

async function main() {
  console.log("⏳ Generando 4 reportes disciplinarios de ejemplo…");

  for (let i = 0; i < 4; i++) {
    await prisma.disciplinaryReport.create({
      data: {
        student_external_id: STUDENT_ID,
        course_external_id: COURSE_ID,
        inspector_external_id: INSPECTOR_ID,

        title: titles[i],
        description: descriptions[i],

        severity: severities[Math.floor(Math.random() * severities.length)],
        category: categories[Math.floor(Math.random() * categories.length)],

        incident_date: randomRecentDate(),
        // status, created_at, updated_at se generan por default
      },
    });
  }

  console.log("✅ Seed completado: 4 reportes creados.");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
