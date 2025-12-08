# Guía del Rol INSPECTOR - EduConecta 🔍

## Introducción

El rol **INSPECTOR** está diseñado para personal de supervisión y control educativo que necesita acceso especializado para monitorear, evaluar y generar reportes sobre el desempeño institucional y académico.

## 🎯 Funcionalidades del Inspector

### 1. **Supervisión Académica**
- **Monitoreo de rendimiento estudiantil** por curso, materia y periodo
- **Seguimiento de metas académicas** y cumplimiento de objetivos
- **Análisis comparativo** entre diferentes periodos académicos
- **Identificación de estudiantes en riesgo** académico

### 2. **Control de Asistencia**
- **Reportes detallados de ausentismo** estudiantil y docente  
- **Análisis de patrones de inasistencia** por diferentes variables
- **Alertas automáticas** por ausentismo crítico
- **Validación de justificaciones** de faltas

### 3. **Evaluación Docente**
- **Revisión de planificaciones** y cumplimiento curricular
- **Observación de metodologías** aplicadas en aula
- **Análisis de resultados académicos** por docente
- **Recomendaciones de mejora** pedagógica

### 4. **Reportes Oficiales**
- **Informes ejecutivos** para autoridades educativas
- **Estadísticas institucionales** consolidadas
- **Reportes de cumplimiento** normativo y regulatorio
- **Documentación para inspecciones** externas

### 5. **Comunicaciones Oficiales**
- **Notificaciones a directivos** sobre hallazgos importantes
- **Comunicados a docentes** con observaciones y recomendaciones
- **Reportes a familias** sobre situaciones que requieren atención
- **Coordinación interinstitucional** con otras entidades

## 🚀 Acceso al Sistema

### Login Web (Recomendado)

1. **Acceder a la aplicación**
   ```
   URL: http://localhost:5174/login
   ```

2. **Introducir credenciales**
   ```
   Email: inspector@educacion.ec
   Password: inspector123
   ```

3. **Redirección automática**
   - El sistema redirige automáticamente a `/inspector`
   - Dashboard específico con herramientas de supervisión
   - Menú lateral con todas las funcionalidades

### API Login (Para integración)

```bash
# Obtener token de autenticación
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inspector@educacion.ec",
    "password": "inspector123"
  }'
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": "uuid-del-inspector",
    "email": "inspector@educacion.ec", 
    "role": "INSPECTOR"
  },
  "token": "jwt-token-here"
}
```

## 📊 Navegación del Dashboard

### Panel Principal
```
┌─────────────────────────────────────────────────────┐
│ 🔍 Dashboard Inspector - EduConecta                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📚 Supervisión    📋 Control de    👨‍🏫 Evaluación    │
│    Académica         Asistencia        Docente      │
│                                                     │
│ 📄 Reportes      💬 Comunicaciones  📊 Estadísticas │
│    Oficiales         Oficiales        en Tiempo    │
│                                        Real         │
└─────────────────────────────────────────────────────┘
```

### Módulos Disponibles

#### 🎓 Supervisión Académica
- **Rendimiento por Curso**: Métricas detalladas de cada curso
- **Análisis de Materias**: Desempeño específico por asignatura
- **Seguimiento Individual**: Progreso de estudiantes específicos
- **Metas Académicas**: Cumplimiento de objetivos institucionales

#### 📋 Control de Asistencia  
- **Reporte Diario**: Ausentismo del día actual
- **Análisis Mensual**: Patrones de inasistencia por mes
- **Alertas Críticas**: Estudiantes con ausentismo alto
- **Justificaciones**: Revisión de excusas presentadas

#### 👨‍🏫 Evaluación Docente
- **Planificaciones**: Revisión de planes de clase
- **Observaciones**: Registro de visitas al aula
- **Metodologías**: Análisis de estrategias pedagógicas
- **Resultados**: Correlación entre enseñanza y aprendizaje

#### 📄 Reportes Oficiales
- **Informe Ejecutivo**: Resumen para directivos
- **Estadísticas**: Datos consolidados institucionales
- **Cumplimiento**: Verificación de requisitos legales
- **Inspecciones**: Preparación de documentación externa

## 🔐 Permisos y Accesos

### Endpoints Disponibles

El rol INSPECTOR tiene acceso a endpoints específicos según la configuración de autorización:

```typescript
// Ejemplos de acceso autorizado
GET /api/students              // Ver estudiantes
GET /api/teachers              // Ver docentes  
GET /api/attendance/reports    // Reportes de asistencia
GET /api/grades/analytics      // Análisis de calificaciones
POST /api/inspections          // Crear inspecciones
PUT /api/observations/:id      // Actualizar observaciones
```

### Restricciones de Seguridad

- ✅ **Solo lectura** en datos sensibles de estudiantes
- ✅ **Acceso completo** a reportes y estadísticas
- ✅ **Creación permitida** de observaciones e inspecciones
- ❌ **Sin acceso** a modificación de calificaciones
- ❌ **Sin acceso** a configuraciones del sistema
- ❌ **Sin acceso** a datos financieros o administrativos

## 🛠️ Casos de Uso Típicos

### Caso 1: Inspección de Rutina Semanal

```typescript
// 1. Revisar asistencia de la semana
const attendanceReport = await getWeeklyAttendance();

// 2. Identificar cursos con problemas
const problematicCourses = attendanceReport.filter(
  course => course.absenteeismRate > 15
);

// 3. Generar observaciones
for (const course of problematicCourses) {
  await createObservation({
    type: 'ATTENDANCE_CONCERN',
    courseId: course.id,
    description: `Ausentismo elevado: ${course.absenteeismRate}%`,
    recommendations: ['Reunión con tutor', 'Contactar familias']
  });
}

// 4. Crear reporte semanal
await generateWeeklyReport({
  attendanceAnalysis: attendanceReport,
  observations: problematicCourses.length,
  recommendations: calculateRecommendations()
});
```

### Caso 2: Evaluación Docente Mensual

```typescript
// 1. Obtener lista de docentes a evaluar
const teachers = await getTeachersForEvaluation();

// 2. Revisar planificaciones entregadas
const planificationStatus = await checkPlanificationCompliance();

// 3. Programar observaciones de clase
const classObservations = await scheduleClassObservations(teachers);

// 4. Generar informe de cumplimiento
await generateTeacherEvaluationReport({
  totalTeachers: teachers.length,
  planificationsReceived: planificationStatus.received,
  observationsScheduled: classObservations.length,
  complianceRate: calculateComplianceRate()
});
```

### Caso 3: Preparación para Inspección Externa

```typescript
// 1. Consolidar datos institucionales
const institutionalData = await consolidateInstitutionalData();

// 2. Verificar cumplimiento normativo
const complianceCheck = await verifyRegulatoryCompliance();

// 3. Preparar documentación requerida
const requiredDocs = await prepareInspectionDocuments();

// 4. Generar informe de preparación
await generatePreInspectionReport({
  dataCompleteness: institutionalData.completenessRate,
  complianceStatus: complianceCheck.status,
  documentsReady: requiredDocs.readyCount,
  recommendedActions: complianceCheck.pendingActions
});
```

## 📋 Lista de Verificación Diaria

### ✅ Al Iniciar el Día
- [ ] Revisar ausentismo del día anterior
- [ ] Verificar notificaciones críticas
- [ ] Consultar agenda de observaciones programadas
- [ ] Revisar mensajes de directivos/docentes

### ✅ Durante el Día
- [ ] Realizar observaciones de clase programadas
- [ ] Registrar hallazgos y recomendaciones
- [ ] Monitorear alertas automáticas del sistema
- [ ] Atender consultas de docentes y directivos

### ✅ Al Finalizar el Día
- [ ] Completar reportes de observaciones realizadas
- [ ] Actualizar seguimientos pendientes
- [ ] Programar actividades del día siguiente
- [ ] Enviar comunicaciones necesarias

## 🔧 Solución de Problemas Comunes

### Problema 1: No puedo acceder al sistema
```bash
# Verificar que el servidor esté ejecutándose
curl http://localhost:3000/health

# Si no responde, iniciar backend
cd backend && npm run dev
```

### Problema 2: Dashboard no carga correctamente
```bash
# Verificar frontend
curl http://localhost:5174

# Si no responde, iniciar frontend
cd frontend && npm run dev
```

### Problema 3: Token JWT expira muy rápido
- Los tokens tienen validez por defecto de 24 horas
- Para sesiones más largas, solicitar al administrador ajustar la configuración
- Usar "Recordarme" en el login para tokens de larga duración

### Problema 4: Reportes no se generan
- Verificar permisos de escritura en directorio `/uploads`
- Comprobar que existan datos suficientes para el periodo consultado
- Revisar logs del backend para errores específicos

## 📞 Soporte y Contacto

### Soporte Técnico
- **Email**: soporte@educonecta.ec
- **Teléfono**: +593-XX-XXX-XXXX
- **Horario**: Lunes a Viernes, 8:00 AM - 5:00 PM

### Capacitación
- **Manual Completo**: Disponible en `/docs/manual-inspector.pdf`
- **Videos Tutorial**: Portal de capacitación interno
- **Sesiones Presenciales**: Coordinación con administrador del sistema

### Reporte de Errores
```bash
# Para reportar errores técnicos, incluir:
1. URL donde ocurrió el problema
2. Mensaje de error exacto (captura de pantalla)
3. Pasos para reproducir el problema
4. Navegador y versión utilizada
5. Hora exacta del incidente
```

## 🔄 Actualizaciones y Mantenimiento

### Actualizaciones Automáticas
- El sistema se actualiza automáticamente cada noche a las 2:00 AM
- Las actualizaciones incluyen correcciones de seguridad y mejoras
- Tiempo estimado de inactividad: 5-10 minutos

### Mantenimiento Programado
- **Semanal**: Domingos 6:00 AM - 8:00 AM
- **Mensual**: Primer sábado del mes, 10:00 PM - 2:00 AM
- **Anual**: Periodo de vacaciones estudiantiles (fechas específicas comunicadas)

### Respaldo de Datos
- Los datos se respaldan automáticamente cada 6 horas
- Respaldos locales conservados por 30 días
- Respaldos externos (nube) conservados por 1 año
- Recuperación de datos disponible en menos de 2 horas

---

*Esta guía se actualiza regularmente. Versión actual: 1.0 | Fecha: $(Get-Date)*