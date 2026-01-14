# 🎯 Integración de Componentes IA en la UI

## ✅ Estado Actual

**TODOS LOS SERVICIOS ESTÁN OPERATIVOS:**

- 🤖 **Servicio IA:** `http://localhost:8001` ✅
- 🔧 **Backend:** `http://localhost:3000` ✅  
- 🎨 **Frontend:** `http://localhost:5173` ✅
- 📦 **Modelo Fine-tuned:** `ft:gpt-4o-mini-2024-07-18:personal:educonecta-v1:CvoAbFcJ` ✅

---

## 📋 Componentes Disponibles

### 1. **PerformanceReport** - Reporte de Rendimiento

**Ubicación:** `frontend/src/components/AI/PerformanceReport.tsx`

**Funcionalidad:**
- Genera análisis completo del rendimiento del estudiante
- Muestra resumen ejecutivo, fortalezas, áreas de preocupación
- Proporciona recomendaciones y plan de acción
- Alertas tempranas sobre riesgos académicos

**Props:**
```typescript
interface PerformanceReportProps {
  studentExternalId: string; // ID del estudiante en MySQL
  onReportGenerated?: (report: any) => void; // Callback opcional
}
```

**Ejemplo de uso:**
```tsx
import { PerformanceReport } from '../../components/AI/PerformanceReport';

function ParentDashboard() {
  return (
    <div>
      <h1>Rendimiento Académico</h1>
      <PerformanceReport 
        studentExternalId="123" 
        onReportGenerated={(report) => console.log(report)}
      />
    </div>
  );
}
```

---

### 2. **TaskRecommendations** - Recomendación de Orden de Tareas

**Ubicación:** `frontend/src/components/AI/TaskRecommendations.tsx`

**Funcionalidad:**
- Analiza las tareas pendientes del estudiante
- Recomienda orden óptimo basado en prioridad, dificultad y fechas
- Genera plan diario estructurado
- Proporciona tips de productividad personalizados

**Props:**
```typescript
interface TaskRecommendationsProps {
  studentExternalId: string; // ID del estudiante en MySQL
  onRecommendationsReceived?: (recommendations: any) => void; // Callback opcional
}
```

**Ejemplo de uso:**
```tsx
import { TaskRecommendations } from '../../components/AI/TaskRecommendations';

function StudentTasksPage() {
  return (
    <div>
      <h1>Mis Tareas</h1>
      <TaskRecommendations 
        studentExternalId="123"
        onRecommendationsReceived={(recs) => console.log(recs)}
      />
    </div>
  );
}
```

---

## 🚀 Pasos de Integración

### Opción 1: Página de Padres de Familia

**Archivo a modificar:** `frontend/src/pages/parent/ParentDashboard.tsx` (o similar)

```tsx
import { PerformanceReport } from '../../components/AI/PerformanceReport';
import { TaskRecommendations } from '../../components/AI/TaskRecommendations';

export function ParentDashboard() {
  // Obtén el studentExternalId del contexto o props
  const studentExternalId = useContext(StudentContext).selectedStudent.externalId;
  
  return (
    <div className="parent-dashboard">
      <h1>Dashboard - Padre de Familia</h1>
      
      {/* Sección de rendimiento académico */}
      <section className="performance-section">
        <PerformanceReport studentExternalId={studentExternalId} />
      </section>
      
      {/* Sección de tareas recomendadas */}
      <section className="tasks-section">
        <h2>Organización de Tareas</h2>
        <TaskRecommendations studentExternalId={studentExternalId} />
      </section>
    </div>
  );
}
```

---

### Opción 2: Página de Estudiante

**Archivo a modificar:** `frontend/src/pages/student/StudentDashboard.tsx` (o similar)

```tsx
import { TaskRecommendations } from '../../components/AI/TaskRecommendations';

export function StudentDashboard() {
  // Obtén el studentExternalId del usuario autenticado
  const { user } = useAuth();
  const studentExternalId = user?.studentExternalId;
  
  return (
    <div className="student-dashboard">
      <h1>Mis Tareas Pendientes</h1>
      
      <TaskRecommendations 
        studentExternalId={studentExternalId}
        onRecommendationsReceived={(recs) => {
          // Opcional: guardar las recomendaciones en el estado
          console.log('Recomendaciones recibidas:', recs);
        }}
      />
    </div>
  );
}
```

---

## 🔍 Dónde Integrar (Sugerencias)

### Para Padres:
- `frontend/src/pages/parent/ParentDashboard.tsx`
- `frontend/src/pages/parent/StudentPerformance.tsx`
- Nueva página: `frontend/src/pages/parent/AIReports.tsx`

### Para Estudiantes:
- `frontend/src/pages/student/StudentDashboard.tsx`
- `frontend/src/pages/student/MyTasks.tsx`
- `frontend/src/pages/student/StudyPlanner.tsx`

### Para Inspectores/Directivos:
- `frontend/src/pages/inspector/StudentsList.tsx`
- Nueva sección en dashboard de inspector

---

## 🎨 Estilos Incluidos

Ambos componentes ya tienen sus estilos CSS:
- `PerformanceReport.css` - Diseño moderno con gradientes y cards
- `TaskRecommendations.css` - Diseño limpio con prioridades coloreadas

**No necesitas agregar estilos adicionales** (ya están importados en los componentes).

---

## 📊 Ejemplo de Respuesta del Backend

### Performance Report:
```json
{
  "summary": "El estudiante muestra un rendimiento académico bueno con algunas áreas de oportunidad...",
  "strengths": ["Excelente en Matemáticas", "Asistencia regular"],
  "concerns": ["Necesita mejorar en Ciencias Naturales"],
  "recommendations": ["Reforzar estudio en ciencias", "Practicar más ejercicios"],
  "early_warnings": ["Riesgo medio de bajo rendimiento en Ciencias"],
  "action_plan": "1. Sesiones de tutoría 2 veces por semana..."
}
```

### Task Recommendations:
```json
{
  "reasoning": "Basado en las fechas de entrega y nivel de dificultad...",
  "recommended_order": [
    {
      "task_id": 1,
      "title": "Tarea de Matemáticas",
      "priority": 1,
      "reason": "Entrega mañana y es la más importante"
    }
  ],
  "daily_plan": {
    "morning": ["Tarea de Matemáticas"],
    "afternoon": ["Proyecto de Ciencias"],
    "evening": ["Lectura de Historia"]
  },
  "tips": [
    "Comienza por las tareas más urgentes",
    "Toma descansos de 10 minutos cada hora"
  ]
}
```

---

## 🧪 Pruebas Rápidas

### 1. Probar desde consola del navegador:

Abre `http://localhost:5173` y en la consola ejecuta:

```javascript
// Probar servicio de IA directo
fetch('http://localhost:3000/api/ai/health')
  .then(r => r.json())
  .then(console.log);

// Probar reporte (reemplaza '123' con un ID real)
fetch('http://localhost:3000/api/ai/performance-report/123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer TU_TOKEN' }
})
  .then(r => r.json())
  .then(console.log);
```

### 2. Probar componente aislado:

Crea un archivo temporal `frontend/src/pages/TestAI.tsx`:

```tsx
import { PerformanceReport } from '../components/AI/PerformanceReport';
import { TaskRecommendations } from '../components/AI/TaskRecommendations';

export function TestAI() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test de Componentes IA</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>Performance Report</h2>
        <PerformanceReport studentExternalId="123" />
      </section>
      
      <section>
        <h2>Task Recommendations</h2>
        <TaskRecommendations studentExternalId="123" />
      </section>
    </div>
  );
}
```

Agrega la ruta en tu router:
```tsx
<Route path="/test-ai" element={<TestAI />} />
```

Visita: `http://localhost:5173/test-ai`

---

## 🐛 Troubleshooting

### Error: "Cannot connect to AI service"
- Verifica que el servicio de IA esté corriendo: `http://localhost:8001/health`
- Revisa que `backend/.env` tenga: `AI_SERVICE_URL="http://localhost:8001"`

### Error: "Unauthorized" o 401
- Los componentes asumen que tienes autenticación configurada
- Verifica que el token JWT se esté enviando en los headers
- Revisa `frontend/src/services/aiService.ts` línea ~11-15

### No se muestran datos
- Verifica que el `studentExternalId` sea válido y exista en MySQL
- Revisa la consola del navegador para errores específicos
- Verifica que el estudiante tenga datos de notas/asistencia/comportamiento

### Componente no renderiza
- Verifica que las rutas de importación sean correctas (ajusta `../../` según ubicación)
- Asegúrate de tener los estilos CSS importados
- Revisa que no haya errores de TypeScript en la consola

---

## 📝 Notas Importantes

1. **Autenticación requerida:** Los endpoints requieren token JWT válido
2. **studentExternalId:** Debe ser el ID del estudiante en la base MySQL (no Postgres)
3. **Modelo activo:** El sistema usa el modelo fine-tuned con 500 ejemplos de entrenamiento
4. **Cache:** Los reportes se guardan en la tabla `AIReport` de Postgres para consultas futuras
5. **Rate limits:** OpenAI tiene límites de requests, considera implementar cache en frontend

---

## 🎓 Próximos Pasos Recomendados

1. **Integrar en dashboard de padres** - Mayor valor para usuarios finales
2. **Agregar filtros por trimestre** - Ver evolución temporal
3. **Notificaciones automáticas** - Alertar a padres sobre reportes críticos
4. **Exportar reportes PDF** - Permitir descarga de análisis
5. **Dashboard de comparación** - Ver múltiples estudiantes (para inspectores)

---

## 📞 Soporte

Si tienes dudas sobre la integración, revisa:
- `GUIA_IMPLEMENTACION_IA.md` - Guía técnica completa
- `ESTADO_IMPLEMENTACION_IA.md` - Estado actual del sistema
- Código de componentes: `frontend/src/components/AI/`
- Backend routes: `backend/src/routes/aiRoutes.ts`

---

**¡Sistema IA completamente operativo y listo para usar! 🚀**
