/* backend/scripts/seedAttendanceOct2025.ts
   Genera asistencia para octubre 2025 (solo lunes-viernes):
   - 80% PRESENT
   - 20% ABSENT_UNJUSTIFIED
   Uso:
     npx ts-node backend/scripts/seedAttendanceOct2025.ts --students=101,202
     npx ts-node backend/scripts/seedAttendanceOct2025.ts --student=101
*/
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ArgMap = Record<string, string | undefined>;
function parseArgs(): ArgMap {
  const args = process.argv.slice(2);
  const map: ArgMap = {};
  for (const a of args) {
    const [k, v] = a.split("=");
    map[k.replace(/^--/, "")] = v ?? "true";
  }
  return map;
}

function getWeekdaysUTC(year: number, monthIndex0: number): Date[] {
  // monthIndex0: 0=enero ... 9=octubre
  const days: Date[] = [];
  const start = new Date(Date.UTC(year, monthIndex0, 1));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 1)); // límite exclusivo
  for (let t = +start; t < +end; t += 24 * 60 * 60 * 1000) {
    const d = new Date(t);
    const dow = d.getUTCDay(); // 0=Dom ... 6=Sáb
    if (dow >= 1 && dow <= 5) {
      // normaliza a 00:00:00 UTC por prolijidad
      days.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
    }
  }
  return days;
}

// Fisher–Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function seedForStudent(studentId: number) {
  const YEAR = 2025;
  const OCT = 9; // 0-based => 9 es octubre
  const monthStart = new Date(Date.UTC(YEAR, OCT, 1));
  const monthEnd = new Date(Date.UTC(YEAR, OCT + 1, 1)); // exclusivo

  const weekdays = getWeekdaysUTC(YEAR, OCT);
  const total = weekdays.length;
  const absentCount = Math.round(total * 0.20);
  const presentCount = total - absentCount;

  const shuffled = shuffle(weekdays);
  const absentDays = new Set(shuffled.slice(0, absentCount).map(d => d.toISOString().slice(0,10)));
  const presentDays = shuffled.slice(absentCount); // resto

  // Limpia registros existentes del mes para este alumno
  await prisma.attendanceRecord.deleteMany({
    where: {
      student_external_id: studentId,
      date: { gte: monthStart, lt: monthEnd },
    },
  });

  // Prepara datos
  const data = [
    ...presentDays.map(d => ({
      student_external_id: studentId,
      date: d,
      status: "PRESENT" as const,
    })),
    ...Array.from(absentDays).map(ymd => ({
      student_external_id: studentId,
      date: new Date(ymd + "T00:00:00.000Z"),
      status: "ABSENT_UNJUSTIFIED" as const,
    })),
  ];

  // Inserta en bloque
  await prisma.attendanceRecord.createMany({
    data,
    skipDuplicates: true,
  });

  return { studentId, presentCount, absentCount, total };
}

async function main() {
  const args = parseArgs();
  const one = args.student ? [Number(args.student)] : [];
  const many = args.students ? String(args.students).split(",").map(s => Number(s.trim())) : [];
  const studentIds = (many.length ? many : one).filter(n => Number.isFinite(n));

  if (studentIds.length === 0) {
    console.error("❗ Debes pasar --student=ID o --students=ID1,ID2");
    process.exit(1);
  }

  console.log(`⏳ Generando asistencia de OCT-2025 para alumnos: ${studentIds.join(", ")}`);
  for (const sid of studentIds) {
    const { presentCount, absentCount, total } = await seedForStudent(sid);
    console.log(`✔ Alumno ${sid}: ${presentCount} PRESENT, ${absentCount} ABSENT_UNJUSTIFIED (total ${total} días hábiles)`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
