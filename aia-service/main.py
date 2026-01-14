"""Servicio de IA para EduConecta.

Provee endpoints de FastAPI para análisis de rendimiento estudiantil
y recomendaciones de tareas usando modelos fine-tuned de OpenAI.
"""
# Standard library imports
import json
import os
from typing import List, Optional

# Third party imports
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai

load_dotenv()

app = FastAPI(title="EduConecta AI Service", version="1.0.0")

# CORS para comunicación con backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar cliente OpenAI
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
FINE_TUNED_MODEL = os.getenv("FINE_TUNED_MODEL", "gpt-4o-mini")

# Modelos de datos
class TaskGrade(BaseModel):
    """Modelo para calificación de una tarea individual."""
    task_name: str
    grade: float
    max_grade: float
    date: Optional[str] = None

class Grade(BaseModel):
    """Modelo para calificación de una materia."""
    subject: str
    grade: float
    max_grade: float
    tasks: Optional[List[TaskGrade]] = None  # Lista de tareas individuales

class Attendance(BaseModel):
    """Modelo para registro de asistencia."""
    total_days: int
    attended_days: int
    absences: int

class Behavior(BaseModel):
    """Modelo para registro de comportamiento estudiantil."""
    incidents: int
    positive_notes: int
    behavior_score: float

class StudentPerformance(BaseModel):
    """Modelo completo de rendimiento estudiantil."""
    student_id: str
    student_name: str
    grades: List[Grade]
    attendance: Attendance
    behavior: Behavior

class Task(BaseModel):
    """Modelo para tarea escolar pendiente."""
    task_id: str
    title: str
    subject: str
    due_date: str
    difficulty: str
    estimated_time: Optional[int] = None

class TaskRecommendationRequest(BaseModel):
    """Solicitud para recomendación de orden de tareas."""
    student_id: str
    tasks: List[Task]
    current_performance: Optional[dict] = None

# Endpoints
@app.get("/")
def read_root():
    """Endpoint raíz con información del servicio."""
    return {
        "service": "EduConecta AI Service",
        "status": "active",
        "version": "1.0.0",
        "model": FINE_TUNED_MODEL
    }

@app.get("/health")
def health_check():
    """Verifica el estado de salud del servicio."""
    return {"status": "healthy", "model": FINE_TUNED_MODEL}

@app.post("/api/analyze-performance")
async def analyze_performance(data: StudentPerformance):
    """Genera reporte y recomendaciones de rendimiento estudiantil"""
    try:
        # Calcular métricas
        avg_grade = (
            sum(g.grade for g in data.grades) / len(data.grades)
            if data.grades else 0
        )
        attendance_rate = (
            (data.attendance.attended_days / data.attendance.total_days * 100)
            if data.attendance.total_days > 0 else 0
        )

        # Formatear calificaciones con detalles de tareas
        grades_text_parts = []
        for g in data.grades:
            grade_pct = g.grade/g.max_grade*100
            grade_line = f"- {g.subject}: {g.grade}/{g.max_grade} ({grade_pct:.1f}%)"

            # Si hay tareas individuales, listarlas
            if g.tasks and len(g.tasks) > 0:
                task_details = []
                low_tasks = []  # Tareas con nota < 7.0

                for task in g.tasks:
                    task_grade = task.grade
                    task_line = f"  * {task.task_name}: {task.grade}/{task.max_grade}"
                    task_details.append(task_line)

                    # Identificar tareas con bajo rendimiento
                    if task_grade < 7.0:
                        low_tasks.append(f"{task.task_name} ({task_grade}/10)")

                if task_details:
                    grade_line += "\n" + "\n".join(task_details)

                # Agregar alerta si hay tareas bajas
                if low_tasks:
                    grade_line += f"\n  ⚠️ Tareas con bajo rendimiento: {', '.join(low_tasks)}"

            grades_text_parts.append(grade_line)

        grades_text = "\n".join(grades_text_parts)

        # Construir prompt contextual
        prompt = f"""Eres un asesor educativo experto analizando el rendimiento de
un estudiante ecuatoriano.

DATOS DEL ESTUDIANTE:
Nombre: {data.student_name}

CALIFICACIONES:
{grades_text}
Promedio general: {avg_grade:.2f}/10

ASISTENCIA:
- Días totales: {data.attendance.total_days}
- Días asistidos: {data.attendance.attended_days}
- Faltas: {data.attendance.absences}
- Porcentaje de asistencia: {attendance_rate:.1f}%

COMPORTAMIENTO:
- Incidentes disciplinarios: {data.behavior.incidents}
- Notas positivas: {data.behavior.positive_notes}
- Puntuación de comportamiento: {data.behavior.behavior_score}/10

CONTEXTO EDUCATIVO ECUADOR:
- Escala de calificaciones: 0-10 puntos
- Nota mínima para aprobar el año lectivo: 7.0/10
- Calificaciones 8.0-10.0: EXCELENTE/MUY BIEN - Rendimiento sobresaliente, sin riesgos
- Calificaciones 7.0-7.9: BIEN/APROBADO - Rendimiento satisfactorio, sin riesgo de supletorio
- Calificaciones 5.0-6.9: EN RIESGO - Requiere examen supletorio
- Calificaciones <5.0: REPROBADO - Requiere examen remedial
- Asistencia mínima requerida: 75% para aprobar el año
- Excelencia académica: ≥9.0 puntos

CRITERIOS IMPORTANTES:
1. FORTALEZAS: Materias o tareas con nota ≥ 8.0/10
2. ÁREAS DE ATENCIÓN: TODAS las materias/tareas con nota ≤ 7.0/10
3. Si ves tareas individuales con ⚠️ y nota < 7.0, DEBES mencionarlas TODAS
4. Identifica patrones en el tipo de evaluaciones con bajo rendimiento
5. ANALIZA LAS TAREAS: Observa el volumen de tareas, fechas de entrega, y tipos de evaluaciones

ESTRUCTURA OBLIGATORIA DEL REPORTE EN JSON:

1. "resumen_general": String (2-3 líneas)
   - Visión general del desempeño académico del estudiante
   - Menciona si hay tareas específicas con bajo rendimiento
   - Tono empático y constructivo

2. "promedios": Object con:
   - "promedio_general": número del promedio total
   - "materias": Array de objetos con:
     * "nombre": nombre de la materia
     * "promedio": nota promedio de la materia
     * "estado": "Excelente" (≥8), "Aprobado" (7-7.9), o "Requiere atención" (<7)

3. "fortalezas_identificadas": Array de strings
   - Lista TODAS las materias/tareas con nota ≥ 8.0
   - Formato: "Materia: [nombre] con [nota]/10" o "Tarea '[nombre]' en [materia]: [nota]/10"
   - Aspectos positivos del comportamiento y asistencia
   - Mínimo 2-3 fortalezas

4. "areas_requieren_atencion": Array de strings - CRÍTICO
   - **Lista TODAS las tareas y materias con nota ≤ 7.0**
   - Formato obligatorio para tareas: 
     "📌 [Materia] - Tarea '[Nombre exacto]': [nota]/10 - Requiere refuerzo"
   - Formato para materias: 
     "📚 [Materia]: Promedio [nota]/10 - Necesita mejorar"
   - Incluye detalles del comportamiento/asistencia si son problemáticos
   - IMPORTANTE: No omitas ninguna tarea con nota baja

5. "consejos_estudiante": Array de 4-6 strings - NUEVO
   - **Consejos prácticos para que el ESTUDIANTE organice sus tareas y mejore su rendimiento**
   - Basado en el análisis de las tareas actuales y áreas débiles
   - Formato con emoji: "💡 [Consejo específico y accionable]"
   - Ejemplos: 
     * "💡 Establece un horario de estudio diario y cúmplelo"
     * "💡 Utiliza técnicas de estudio activas como resúmenes y mapas mentales"
     * "💡 Toma descansos cortos entre tareas para mantener la concentración"
     * "💡 Revisa tus notas y materiales de clase junto con las tareas"
   - Enfocados en: organización del tiempo, técnicas de estudio, gestión de tareas pendientes
   - Debe ser motivacional pero realista

6. "recomendaciones_padres": Array de 5-8 strings
   - **Una recomendación específica por cada tarea con nota < 7.0**
   - Formato: "Para [tarea] en [materia] ([nota]/10): [acción concreta]"
   - Ejemplo: "Para 'Examen de Álgebra' en Matemáticas (5.5/10): Repasar 
     ecuaciones lineales 30 minutos diarios usando el libro páginas 45-60"
   - Luego estrategias generales de estudio
   - Deben ser concretas, específicas y accionables

7. "plan_accion": String estructurado por semanas
   - Semana 1: Enfoque en tareas más críticas (< 6.0)
   - Semana 2: Refuerzo de tareas entre 6.0-6.9
   - Semana 3: Consolidación de materias en riesgo
   - Semana 4: Preparación y evaluación del progreso
   - Incluye horarios específicos y recursos concretos

INSTRUCCIONES CRÍTICAS:
- TODO debe estar en español
- NO omitas ninguna tarea o materia con nota ≤ 7.0
- Sé específico con los nombres de las tareas
- Las recomendaciones deben ser accionables y concretas
- El plan de acción debe tener pasos semanales claros
- Los consejos para el estudiante deben ser motivacionales y prácticos

Responde SOLO con el JSON válido, sin texto adicional.
"""

        response = client.chat.completions.create(
            model=FINE_TUNED_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Eres un asesor educativo experto de EduConecta "
                        "especializado en analizar el rendimiento académico "
                        "de estudiantes ecuatorianos. Tu trabajo es generar "
                        "reportes COMPLETOS en español que listen TODAS las "
                        "tareas con nota ≤ 7.0, identificar fortalezas (≥8.0), "
                        "y crear recomendaciones específicas por cada tarea con "
                        "bajo rendimiento. Usa un tono empático, constructivo "
                        "y orientado a soluciones concretas para los padres."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        analysis = json.loads(response.choices[0].message.content)

        return {
            "student_id": data.student_id,
            "analysis": analysis,
            "metrics": {
                "average_grade": round(avg_grade, 2),
                "attendance_rate": round(attendance_rate, 2),
                "behavior_score": data.behavior.behavior_score
            }
        }

    except openai.OpenAIError as e:
        print(f"Error in analyze_performance: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing performance: {str(e)}"
        ) from e
    except Exception as e:
        print(f"Unexpected error in analyze_performance: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.post("/api/recommend-task-order")
async def recommend_task_order(data: TaskRecommendationRequest):
    """Recomienda orden óptimo de tareas basado en múltiples factores"""
    try:
        tasks_info = "\n".join([
            (
                f"- ID: {t.task_id} | {t.title} | "
                f"Materia: {t.subject} | Vence: {t.due_date} | "
                f"Dificultad: {t.difficulty} | "
                f"Tiempo: {t.estimated_time or 'N/A'}min"
            )
            for t in data.tasks
        ])

        performance_text = ""
        if data.current_performance:
            performance_text = "\n".join([
                f"- {subject}: {score}/10"
                for subject, score in data.current_performance.items()
            ])

        prompt = f"""Eres un asistente de planificación educativa especializado en
organización de tareas escolares.

TAREAS PENDIENTES:
{tasks_info}

RENDIMIENTO DEL ESTUDIANTE POR MATERIA:
{performance_text if performance_text else "No disponible"}

CRITERIOS DE PRIORIZACIÓN:
1. Fecha de vencimiento (más urgente primero)
2. Dificultad (balancear tareas difíciles con fáciles para mantener
   motivación)
3. Materia (priorizar materias con bajo rendimiento que necesitan refuerzo)
4. Tiempo estimado (intercalar tareas largas y cortas para evitar
   agotamiento)

ESTRATEGIAS PEDAGÓGICAS:
- Comenzar con una tarea de dificultad media para "calentar"
- Intercalar tareas difíciles con fáciles
- Dejar tareas creativas/agradables como recompensa
- No acumular todas las tareas difíciles al final

TAREA:
Genera un JSON con esta estructura EXACTA:
1. "recommended_order": Array de objetos con esta estructura:
   [
     {{
       "task_id": <número ID de la tarea>,
       "title": "<título exacto de la tarea>",
       "priority": <número de prioridad 1-N>,
       "reason": "<explicación breve de por qué va en este orden>"
     }}
   ]
2. "reasoning": Explicación breve de la estrategia general (2-3 líneas)
3. "daily_plan": Objeto con días de la semana y TÍTULOS de tareas:
   {{
     "Lunes": ["<título tarea 1>", "<título tarea 2>"],
     "Martes": ["<título tarea 3>"]
   }}
4. "tips": Array de 3-5 consejos prácticos para el estudiante

IMPORTANTE:
- En "recommended_order" usa los task_id numéricos y los títulos EXACTOS de las tareas
- En "daily_plan" usa los TÍTULOS de las tareas, NO los IDs
- Distribuye las tareas a lo largo de la semana de forma realista

Responde SOLO con el JSON.
"""

        response = client.chat.completions.create(
            model=FINE_TUNED_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Eres un planificador educativo que optimiza el "
                        "tiempo de estudio para estudiantes ecuatorianos."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.6,
            response_format={"type": "json_object"}
        )

        recommendation = json.loads(response.choices[0].message.content)

        return {
            "student_id": data.student_id,
            "recommendation": recommendation
        }

    except openai.OpenAIError as e:
        print(f"Error in recommend_task_order: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}"
        ) from e
    except Exception as e:
        print(f"Unexpected error in recommend_task_order: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        ) from e

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    print(f"🚀 Starting EduConecta AI Service on port {port}")
    print(f"🤖 Using model: {FINE_TUNED_MODEL}")
    uvicorn.run(app, host="0.0.0.0", port=port)
