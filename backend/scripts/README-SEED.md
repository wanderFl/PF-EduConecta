# Script de Datos de Prueba Completos

Este script crea datos de prueba realistas en la base de datos para poder probar todas las funcionalidades y generar reportes con IA.

## 📦 Datos que crea:

1. **👨‍👩‍👧 Padres de Familia**: 5 usuarios padre vinculados a estudiantes
2. **📝 Tareas**: 15 tareas asignadas por docentes con diferentes materias
3. **✍️ Entregas y Calificaciones**: ~100 entregas con notas entre 5 y 10
4. **📅 Asistencia**: ~400 registros de asistencia (presente/ausente)
5. **⚠️ Novedades Disciplinarias**: ~10 reportes de comportamiento
6. **💬 Comunicados**: ~15 comunicaciones entre docentes y padres

## 🚀 Cómo ejecutar:

### Opción 1: Desde la carpeta backend
```bash
cd backend
node scripts/seed-complete-test-data.js
```

### Opción 2: Desde la raíz del proyecto
```bash
node backend/scripts/seed-complete-test-data.js
```

## 🔑 Credenciales generadas:

**Padres de Familia:**
- Email: `padre1@test.com` hasta `padre5@test.com`
- Password: `1234`
- PIN: `1234`

## ⚠️ Requisitos previos:

1. ✅ Base de datos PostgreSQL creada y migrada
2. ✅ Base de datos MySQL (CEIAF) con datos de estudiantes, docentes y cursos
3. ✅ Archivo `.env` configurado correctamente
4. ✅ Prisma Client generado: `cd backend && npm run prisma:generate`

## 📊 Verificar los datos:

Después de ejecutar el script, puedes verificar los datos con:

```bash
cd backend
npm run prisma:studio
```

O consultar directamente en PostgreSQL:

```sql
-- Ver padres creados
SELECT * FROM parents;

-- Ver tareas creadas
SELECT * FROM tasks;

-- Ver calificaciones
SELECT * FROM submissions_grades;

-- Ver asistencia
SELECT * FROM attendance_records;

-- Ver novedades
SELECT * FROM disciplinary_reports;
```

## 🤖 Para generar reportes con IA:

Una vez ejecutado el script, tendrás datos suficientes para:

1. **Dashboard de Directivo**: Ver indicadores de comportamiento
2. **Dashboard de Docente**: Ver tareas, calificaciones y asistencia
3. **Dashboard de Familia**: Ver calificaciones, tareas y comunicados del hijo
4. **Generar Reportes con IA**: La IA tendrá datos reales para analizar y generar reportes detallados

## 🔄 Limpiar datos de prueba:

Si quieres eliminar los datos de prueba y empezar de nuevo:

```sql
-- En PostgreSQL
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE communications CASCADE;
TRUNCATE TABLE disciplinary_reports CASCADE;
TRUNCATE TABLE attendance_records CASCADE;
TRUNCATE TABLE submissions_grades CASCADE;
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE parent_student_links CASCADE;
TRUNCATE TABLE parents CASCADE;
TRUNCATE TABLE users CASCADE;
```

O simplemente ejecuta el script nuevamente (creará datos adicionales).

## 📝 Notas importantes:

- El script usa datos de MySQL existentes (cursos, estudiantes, docentes)
- Si no hay suficientes datos en MySQL, el script creará menos registros
- Los datos son aleatorios pero realistas
- Las fechas están basadas en enero 2026
- Las calificaciones varían entre 5 y 10 puntos
- La asistencia es 85% presente, 10% ausente injustificada, 5% ausente justificada
