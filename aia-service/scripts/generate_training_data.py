"""Script para generar datos históricos sintéticos pero creíbles.

Genera 1600 ejemplos variados de reportes de rendimiento estudiantil
con alta variabilidad para evitar overfitting.
"""
# pylint: disable=line-too-long

import json
import os
import random

# Nombres ecuatorianos realistas
NOMBRES_BASE = [
    "Andrés", "Carla", "Diego", "Elena", "Fernando", "Gabriela",
    "Hugo", "Isabel", "Javier", "Karla", "Luis", "María",
    "Nicolás", "Paola", "Roberto", "Sofía", "Tomás", "Valentina",
    "William", "Ximena", "Adriana", "Benjamín", "Camila", "Daniel",
    "Emilia", "Francisco", "Gloria", "Héctor", "Inés", "Jorge",
    "Lucía", "Manuel", "Natalia", "Oscar", "Patricia", "Raúl",
    "Sandra", "Tania", "Ulises", "Verónica", "Xavier", "Yolanda",
    "Zaira", "Alberto", "Beatriz", "Carlos", "Daniela", "Eduardo",
    "Fernanda", "Gustavo", "Hernán", "Irene", "Juan", "Karina",
    "Leonardo", "Marcela", "Nelson", "Olivia", "Pedro", "Renata",
    "Sebastián", "Teresa", "Víctor", "Wendy", "Armando", "Blanca",
    "Claudio", "Delia", "Enrique", "Fabiola", "Germán", "Hilda",
    "Ignacio", "Julia", "Kevin", "Lorena", "Mauricio", "Nora",
    "Orlando", "Pilar", "Ramiro", "Silvia", "Rodrigo", "Úrsula",
    "Arturo", "Cecilia", "Darío", "Estela", "Felipe", "Graciela",
    "Iván", "Josefina", "Lorenzo", "Marta", "Néstor", "Ofelia",
    "Pablo", "Raquel", "Samuel", "Valeria"
]

APELLIDOS = [
    "Morales", "Jiménez", "Zambrano", "Castillo", "Vega", "Torres",
    "Paredes", "Mora", "Ortiz", "Ramírez", "Herrera", "González",
    "Silva", "Méndez", "Sánchez", "Vargas", "Aguirre", "Cruz",
    "Flores", "Ríos", "Lara", "Rojas", "Suárez", "Mendoza",
    "Castro", "Álvarez", "Peña", "Navarro", "Guerrero", "Romero",
    "Carrillo", "Soto", "Campos", "Reyes", "Vásquez", "Delgado",
    "Núñez", "Gómez", "Maldonado", "Molina", "Ruiz", "Ponce",
    "Ibarra", "Salazar", "Vera", "Palacios", "Muñoz", "León",
    "Acosta", "Chávez", "Solís", "Serrano", "Valdez", "Bautista",
    "Mejía", "Fuentes", "Arias", "Cervantes", "Cárdenas", "Ochoa",
    "Benítez", "Cordero", "Durán", "Espinoza", "Figueroa", "Guzmán",
    "Hidalgo", "Ibáñez", "Jaramillo", "Lozano", "Martínez",
    "Navarrete", "Ordóñez", "Pacheco", "Quevedo", "Ramos",
    "Salinas", "Tapia", "Ureña", "Villalobos", "Yépez", "Zavala",
    "Andrade", "Bravo", "Cáceres", "Domínguez", "Estrella",
    "Franco", "Gallegos", "Henríquez"
]

MATERIAS = ["Matemáticas", "Lengua y Literatura", "Ciencias Naturales", "Estudios Sociales", "Inglés"]


def generar_nombres_unicos(cantidad):
    """Genera nombres únicos combinando nombres y apellidos aleatorios."""
    nombres = []
    for _ in range(cantidad):
        nombre = random.choice(NOMBRES_BASE)
        apellido1 = random.choice(APELLIDOS)
        apellido2 = random.choice(APELLIDOS)
        while apellido2 == apellido1:
            apellido2 = random.choice(APELLIDOS)
        nombres.append(f"{nombre} {apellido1} {apellido2}")
    return nombres


NOMBRES = generar_nombres_unicos(3500)


def generate_performance_scenario():
    """Genera un escenario de rendimiento aleatorio pero coherente con distribución balanceada."""
    scenarios = [
        {"type": "excelente", "grade_range": (8.5, 10.0), "attendance_range": (95, 100), "behavior_score_range": (8.5, 10.0), "incidents_range": (0, 1), "positive_notes_range": (3, 7), "weight": 20},
        {"type": "bueno", "grade_range": (7.5, 8.4), "attendance_range": (85, 94), "behavior_score_range": (7.5, 8.9), "incidents_range": (0, 2), "positive_notes_range": (1, 4), "weight": 30},
        {"type": "regular", "grade_range": (7.0, 7.4), "attendance_range": (80, 89), "behavior_score_range": (6.5, 7.9), "incidents_range": (1, 3), "positive_notes_range": (0, 2), "weight": 25},
        {"type": "riesgo", "grade_range": (5.0, 6.9), "attendance_range": (75, 84), "behavior_score_range": (5.5, 6.9), "incidents_range": (2, 5), "positive_notes_range": (0, 1), "weight": 20},
        {"type": "critico", "grade_range": (2.0, 4.9), "attendance_range": (60, 79), "behavior_score_range": (3.0, 5.4), "incidents_range": (3, 7), "positive_notes_range": (0, 1), "weight": 5}
    ]
    # Selección ponderada para una distribución más realista
    weights = [s["weight"] for s in scenarios]
    return random.choices(scenarios, weights=weights, k=1)[0]


def generate_student_data(nombre):
    """Genera datos realistas de un estudiante."""
    scenario = generate_performance_scenario()
    grades = []
    base_avg = random.uniform(*scenario["grade_range"])

    for materia in MATERIAS:
        # Mayor variabilidad para evitar overfitting
        variation = random.uniform(-1.5, 1.5)
        grade = max(0, min(10, base_avg + variation))
        grades.append({"subject": materia, "grade": round(grade, 1), "max_grade": 10.0})

    total_days = random.randint(70, 90)
    attendance_pct = random.uniform(*scenario["attendance_range"]) / 100
    attended_days = int(total_days * attendance_pct)
    absences = total_days - attended_days

    incidents = random.randint(*scenario["incidents_range"])
    positive_notes = random.randint(*scenario["positive_notes_range"])
    behavior_score = round(random.uniform(*scenario["behavior_score_range"]), 1)

    return {
        "student_name": nombre,
        "grades": grades,
        "attendance": {"total_days": total_days, "attended_days": attended_days, "absences": absences},
        "behavior": {"incidents": incidents, "positive_notes": positive_notes, "behavior_score": behavior_score},
        "scenario_type": scenario["type"]
    }


def generate_report(student_data):
    """Genera reporte personalizado según el tipo de escenario."""
    avg_grade = sum(g["grade"] for g in student_data["grades"]) / len(student_data["grades"])
    attendance_pct = (student_data["attendance"]["attended_days"] / student_data["attendance"]["total_days"]) * 100
    scenario_type = student_data["scenario_type"]

    if scenario_type == "excelente":
        return {
            "summary": f"{student_data['student_name']} demuestra un rendimiento académico sobresaliente con promedio de {avg_grade:.1f}/10. Su disciplina, asistencia casi perfecta ({attendance_pct:.0f}%) y excelente comportamiento lo/la posicionan como estudiante modelo del curso.",
            "strengths": [
                f"Promedio general superior al estándar de excelencia ({avg_grade:.1f}/10)",
                f"Asistencia ejemplar del {attendance_pct:.0f}%",
                f"Comportamiento impecable ({student_data['behavior']['behavior_score']}/10) con {student_data['behavior']['positive_notes']} reconocimientos positivos",
                f"Desempeño destacado en {max(student_data['grades'], key=lambda x: x['grade'])['subject']} ({max(g['grade'] for g in student_data['grades']):.1f}/10)"
            ],
            "areas_of_concern": [
                "Ninguna área crítica identificada",
                f"Oportunidad de mejora marginal en {min(student_data['grades'], key=lambda x: x['grade'])['subject']} ({min(g['grade'] for g in student_data['grades']):.1f}/10)"
            ],
            "recommendations": [
                "Mantener la rutina de estudio que ha demostrado ser exitosa",
                "Considerar participación en olimpiadas académicas o concursos escolares",
                "Fomentar lectura avanzada y proyectos de investigación independientes",
                "Explorar actividades de liderazgo estudiantil o mentoría a compañeros",
                "Continuar reforzando hábitos de organización y disciplina que han probado ser efectivos"
            ],
            "early_warnings": [],
            "action_plan": "PLAN DE ENRIQUECIMIENTO: Buscar oportunidades de desafío académico adicional como proyectos especiales, clubes científicos o participación en competencias escolares. Mantener motivación intrínseca mediante reconocimiento y establecimiento de nuevas metas. Evaluar posibilidades de aceleración o programas para estudiantes sobresalientes."
        }

    if scenario_type == "bueno":
        weak_subject = min(student_data['grades'], key=lambda x: x['grade'])
        return {
            "summary": f"{student_data['student_name']} muestra un rendimiento académico bueno con promedio de {avg_grade:.1f}/10. Mantiene disciplina y asistencia satisfactoria ({attendance_pct:.0f}%), con oportunidades de optimización en algunas áreas para alcanzar la excelencia.",
            "strengths": [
                f"Promedio general por encima del mínimo aprobatorio ({avg_grade:.1f}/10)",
                f"Asistencia satisfactoria del {attendance_pct:.0f}%",
                f"Comportamiento adecuado ({student_data['behavior']['behavior_score']}/10)",
                f"Buen desempeño en {max(student_data['grades'], key=lambda x: x['grade'])['subject']} ({max(g['grade'] for g in student_data['grades']):.1f}/10)"
            ],
            "areas_of_concern": [
                f"{weak_subject['subject']} requiere mayor atención ({weak_subject['grade']}/10)",
                f"Asistencia puede mejorar para garantizar continuidad en el aprendizaje ({student_data['attendance']['absences']} faltas acumuladas)",
                "Oportunidad de aumentar participación en clase y tareas opcionales"
            ],
            "recommendations": [
                f"Programar sesiones de refuerzo en {weak_subject['subject']} (1-2 horas semanales)",
                "Establecer rutina de estudio diaria de 45-60 minutos",
                "Revisar tareas y evaluaciones junto con el estudiante semanalmente",
                "Monitorear asistencia de cerca para evitar acumulación de faltas",
                "Incentivar lectura recreativa y actividades extracurriculares",
                "Mantener comunicación regular con docentes para seguimiento"
            ],
            "early_warnings": [],
            "action_plan": "PLAN DE 30 DÍAS: Semana 1-2: Evaluación de hábitos de estudio y organización del tiempo. Semana 2-3: Implementar refuerzo en materias específicas con ejercicios prácticos. Semana 3-4: Monitoreo de progreso y ajuste de estrategias. Reunión familiar semanal para revisar avances y mantener motivación."
        }

    if scenario_type == "regular":
        weak_subjects = [g for g in student_data['grades'] if g['grade'] < 7.5]
        at_risk_subjects = [g for g in student_data['grades'] if g['grade'] < 7.0]
        return {
            "summary": f"{student_data['student_name']} presenta un rendimiento académico satisfactorio con promedio de {avg_grade:.1f}/10, dentro del rango aprobatorio. Con algo de refuerzo adicional puede mejorar y alcanzar mayores niveles de excelencia.",
            "strengths": [
                f"Mantiene promedio aprobatorio ({avg_grade:.1f}/10 - por encima del mínimo de 7.0)",
                f"Mejor desempeño en {max(student_data['grades'], key=lambda x: x['grade'])['subject']} ({max(g['grade'] for g in student_data['grades']):.1f}/10)",
                "Asiste regularmente a clases",
                "Ha logrado aprobar todas las materias" if not at_risk_subjects else "Muestra capacidad de mejora"
            ],
            "areas_of_concern": [
                "Promedio cercano al límite mínimo - con esfuerzo adicional puede alcanzar la excelencia",
                f"{len(weak_subjects)} materias pueden mejorar con refuerzo: {', '.join(s['subject'] for s in weak_subjects[:2])}" if weak_subjects else "Algunas materias tienen margen de mejora",
                f"{student_data['attendance']['absences']} faltas acumuladas - mantener mejor asistencia ayudará al aprendizaje",
                f"Comportamiento con {student_data['behavior']['incidents']} incidentes registrados" if student_data['behavior']['incidents'] > 0 else "Oportunidad de mejorar participación en clase"
            ],
            "recommendations": [
                f"Refuerzo académico en {weak_subjects[0]['subject']}" + (f" y {weak_subjects[1]['subject']}" if len(weak_subjects) > 1 else "") if weak_subjects else "Refuerzo académico para mejorar rendimiento general",
                "Tutorías o sesiones de estudio 1-2 horas semanales para consolidar conocimientos",
                "Rutina de estudio estructurada: 1 hora diaria con revisión de tareas",
                "Mantener comunicación con docentes para seguimiento del progreso",
                "Incentivar lectura y actividades educativas complementarias",
                "Establecer metas de mejora progresiva con sistema de reconocimiento",
                "Reforzar hábitos de organización y planificación del tiempo de estudio"
            ],
            "early_warnings": [] if not at_risk_subjects else [
                f"⚠️ {len(at_risk_subjects)} materia(s) por debajo de 7.0 requieren atención: {', '.join(s['subject'] for s in at_risk_subjects[:2])}"
            ],
            "action_plan": "PLAN DE MEJORA CONTINUA (30 DÍAS): Semana 1: Identificar áreas específicas de mejora con el estudiante. Semanas 2-3: Implementar rutina de estudio con ejercicios de refuerzo. Semana 4: Evaluación de progreso y ajuste de estrategias. Durante todo el período: Revisión semanal de tareas, comunicación con docentes, celebración de logros incrementales."
        }

    if scenario_type == "riesgo":
        critical_subjects = [g for g in student_data['grades'] if g['grade'] < 7.0]
        # Solo mostrar alerta si realmente está por debajo de 7.0
        if avg_grade < 7.0:
            summary_msg = f"{student_data['student_name']} presenta un rendimiento académico que requiere ATENCIÓN INMEDIATA con promedio de {avg_grade:.1f}/10, por debajo del mínimo aprobatorio de 7.0. Existe riesgo real de supletorios y complicaciones académicas si no se toman acciones correctivas urgentes."
        else:
            summary_msg = f"{student_data['student_name']} presenta un rendimiento académico que requiere atención con promedio de {avg_grade:.1f}/10. Aunque aprueba, hay materias específicas que necesitan refuerzo para evitar dificultades futuras."

        return {
            "summary": summary_msg,
            "strengths": [
                f"Mejor desempeño relativo en {max(student_data['grades'], key=lambda x: x['grade'])['subject']} ({max(g['grade'] for g in student_data['grades']):.1f}/10)",
                "Aún mantiene asistencia dentro del mínimo requerido" if attendance_pct >= 75 else "Asiste a clases ocasionalmente",
                "Promedio general aprueba el año" if avg_grade >= 7.0 else "Aún hay tiempo para recuperarse con apoyo adecuado"
            ],
            "areas_of_concern": [
                f"⚠️ PROMEDIO CRÍTICO: {avg_grade:.1f}/10 está {7.0 - avg_grade:.1f} puntos por debajo del mínimo" if avg_grade < 7.0 else f"Promedio de {avg_grade:.1f}/10 cerca del límite - necesita refuerzo preventivo",
                f"{len(critical_subjects)} materias en riesgo de supletorio: {', '.join(s['subject'] + ' (' + str(s['grade']) + '/10)' for s in critical_subjects[:3])}" if critical_subjects else "Algunas materias requieren atención especial",
                f"Asistencia del {attendance_pct:.0f}% - {student_data['attendance']['absences']} faltas comprometen el aprendizaje continuo",
                f"Comportamiento deficiente con {student_data['behavior']['incidents']} incidentes" if student_data['behavior']['incidents'] > 2 else "Comportamiento requiere mejora",
                "Probable falta de hábitos de estudio efectivos" if avg_grade < 6.5 else "Hábitos de estudio necesitan fortalecerse"
            ],
            "recommendations": [
                "🚨 INTERVENCIÓN URGENTE: Reunión inmediata con equipo docente y DECE" if avg_grade < 7.0 else "📋 Reunión con docentes para plan de mejora",
                f"Tutorías intensivas en {critical_subjects[0]['subject']}" + (f" y {critical_subjects[1]['subject']}" if len(critical_subjects) > 1 else " y otras materias críticas") + " (mínimo 3 horas semanales)" if critical_subjects else "Tutorías de refuerzo 2-3 horas semanales",
                "Plan de recuperación académica personalizado coordinado con institución" if avg_grade < 7.0 else "Plan de refuerzo académico personalizado",
                "Rutina de estudio supervisada: 2 horas diarias" if avg_grade < 7.0 else "Rutina de estudio: 1.5 horas diarias",
                "Evaluación psicopedagógica para identificar posibles dificultades de aprendizaje" if avg_grade < 6.0 else "Considerar evaluación de técnicas de estudio",
                "Control estricto de asistencia - comunicación inmediata por cualquier falta",
                "Establecer comunicación regular con docentes sobre progreso",
                "Organizar espacio de estudio libre de distracciones",
                "Sistema de seguimiento semanal con reportes de avance"
            ],
            "early_warnings": (
                [
                    f"🚨 RIESGO CRÍTICO: Promedio general de {avg_grade:.1f}/10 por debajo del mínimo aprobatorio",
                    f"🚨 {len(critical_subjects)} materias en riesgo de supletorio: {', '.join(s['subject'] for s in critical_subjects[:3])}",
                    f"🚨 Requiere subir {7.0 - avg_grade:.1f} puntos de promedio para aprobar el año",
                    "🚨 Sin intervención inmediata, alta probabilidad de repetir el año escolar"
                ] if avg_grade < 7.0 and critical_subjects
                else (
                    [f"⚠️ {len(critical_subjects)} materia(s) requieren atención urgente: {', '.join(s['subject'] for s in critical_subjects[:3])}"] if critical_subjects
                    else []
                )
            ),
            "action_plan": (
                "PLAN DE RESCATE ACADÉMICO URGENTE (60-90 DÍAS): FASE 1 (Días 1-15): Evaluación completa (académica, psicopedagógica, familiar). Reunión urgente con DECE y docentes. Inicio de tutorías intensivas. FASE 2 (Días 16-45): Refuerzo diario en materias críticas. Evaluaciones semanales de progreso. Intervención en comportamiento. FASE 3 (Días 46-90): Consolidación de aprendizajes. Preparación para evaluaciones finales. Evaluación de logro de metas mínimas. SEGUIMIENTO: Supervisión diaria de tareas, comunicación constante con docentes, reuniones semanales de seguimiento con padres."
                if avg_grade < 7.0
                else "PLAN DE REFUERZO Y MEJORA (30-45 DÍAS): SEMANAS 1-2: Evaluación de áreas específicas que necesitan refuerzo. Inicio de tutorías focalizadas en materias bajo 7.0. SEMANAS 3-4: Refuerzo intensivo con ejercicios prácticos y seguimiento de progreso. SEMANAS 5-6: Evaluaciones de mejora y consolidación de conocimientos. SEGUIMIENTO: Revisión semanal de tareas, comunicación con docentes, reuniones quincenales padres-estudiante."
            )
        }

    failing_subjects = [g for g in student_data['grades'] if g['grade'] < 5.0]
    return {
        "summary": f"{student_data['student_name']} se encuentra en SITUACIÓN ACADÉMICA CRÍTICA con promedio de {avg_grade:.1f}/10, significativamente por debajo del mínimo aprobatorio. Se requiere intervención institucional inmediata para evitar repitencia del año escolar.",
        "strengths": [
            "El estudiante aún asiste a la institución y muestra disposición para mejorar" if attendance_pct > 70 else "Se mantiene matriculado en la institución",
            f"Potencial de mejora identificado en {max(student_data['grades'], key=lambda x: x['grade'])['subject']}"
        ],
        "areas_of_concern": [
            f"🚨 SITUACIÓN CRÍTICA: Promedio de {avg_grade:.1f}/10 requiere mejora de {7.0 - avg_grade:.1f} puntos",
            f"{len(failing_subjects)} materias REPROBADAS: {', '.join(s['subject'] + ' (' + str(s['grade']) + '/10)' for s in failing_subjects)}",
            f"Asistencia crítica del {attendance_pct:.0f}% - {student_data['attendance']['absences']} faltas graves",
            f"Comportamiento muy deficiente ({student_data['behavior']['behavior_score']}/10) con {student_data['behavior']['incidents']} incidentes",
            "Ausencia evidente de hábitos de estudio",
            "Alto riesgo de deserción escolar",
            "Posible situación familiar o personal afectando rendimiento"
        ],
        "recommendations": [
            "🚨 CONVOCATORIA URGENTE: Reunión inmediata con Rector, DECE, docentes y padres de familia",
            "Evaluación integral por equipo multidisciplinario (psicólogo, trabajador social, docentes)",
            "Plan de contingencia académica institucional inmediato",
            "Tutorías de rescate diarias (4-5 horas semanales mínimo) con seguimiento individualizado",
            "Evaluación psicopedagógica completa para descartar dificultades de aprendizaje",
            "Explorar factores externos: situación familiar, problemas de salud, acoso escolar",
            "Considerar adaptaciones curriculares si aplica",
            "Programa de nivelación intensiva coordinado con la institución",
            "Seguimiento diario estricto de asistencia y comportamiento",
            "Compromiso escrito firmado por estudiante y padres con metas específicas",
            "Evaluación semanal de progresos con reportes documentados",
            "Considerar apoyo profesional externo (psicólogo, tutor especializado)"
        ],
        "early_warnings": [
            f"🚨🚨 RIESGO EXTREMO: {len(failing_subjects)} materias REPROBADAS - repetirá el año sin cambios inmediatos",
            "🚨 INTERVENCIÓN INSTITUCIONAL REQUERIDA - caso debe ser tratado por DECE",
            f"🚨 Necesita aprobar TODAS las materias y subir {7.0 - avg_grade:.1f} puntos de promedio",
            "🚨 Alta probabilidad de deserción escolar sin apoyo integral",
            f"⚠️ Asistencia del {attendance_pct:.0f}% cerca del límite mínimo - riesgo de perder el año por faltas"
        ],
        "action_plan": "PLAN DE RESCATE INTEGRAL URGENTE (90-120 DÍAS): SEMANA 1: Convocatoria inmediata a reunión institucional. Evaluación completa de la situación (académica, psicológica, social, familiar). Firma de compromiso de mejora. SEMANAS 2-4: Inicio de tutorías intensivas diarias. Seguimiento exhaustivo de asistencia. Intervención en comportamiento. Evaluaciones diagnósticas por materia. SEMANAS 5-8: Nivelación forzada en materias críticas. Evaluaciones semanales obligatorias. Seguimiento psicopedagógico. SEMANAS 9-12: Preparación intensiva para evaluaciones finales. Refuerzo en temas críticos. Simulacros de exámenes. CONTINUAMENTE: Comunicación diaria con docentes. Reuniones semanales obligatorias padres-DECE-docentes. Reportes documentados de cada avance. Sistema de alertas tempranas. IMPORTANTE: Sin compromiso total de estudiante y familia, la institución debe considerar otras alternativas educativas más apropiadas."
    }


def create_training_examples():
    """Genera 1600 ejemplos de entrenamiento variados y creíbles."""
    print("📄 Generando 1600 ejemplos de entrenamiento con alta variabilidad...")
    training_examples = []
    nombres_shuffled = NOMBRES.copy()
    random.shuffle(nombres_shuffled)

    for i, nombre in enumerate(nombres_shuffled[:1600]):
        student_data = generate_student_data(nombre)
        report = generate_report(student_data)
        avg_grade = sum(g["grade"] for g in student_data["grades"]) / len(student_data["grades"])
        attendance_pct = (student_data["attendance"]["attended_days"] / student_data["attendance"]["total_days"]) * 100
        grades_text = "\n".join([f"- {g['subject']}: {g['grade']}/{g['max_grade']} ({g['grade']/g['max_grade']*100:.1f}%)" for g in student_data["grades"]])

        example = {
            "messages": [
                {"role": "system", "content": "Eres un asesor educativo de EduConecta que analiza el rendimiento estudiantil en Ecuador. Generas reportes objetivos con recomendaciones para padres de familia."},
                {"role": "user", "content": f"""Analiza el rendimiento del estudiante:
Nombre: {student_data['student_name']}

Calificaciones:
{grades_text}
Promedio general: {avg_grade:.2f}/10

Asistencia:
- Días totales: {student_data['attendance']['total_days']}
- Días asistidos: {student_data['attendance']['attended_days']}
- Faltas: {student_data['attendance']['absences']}
- Porcentaje de asistencia: {attendance_pct:.1f}%

Comportamiento:
- Incidentes disciplinarios: {student_data['behavior']['incidents']}
- Notas positivas: {student_data['behavior']['positive_notes']}
- Puntuación de comportamiento: {student_data['behavior']['behavior_score']}/10"""},
                {"role": "assistant", "content": json.dumps(report, ensure_ascii=False, indent=2)}
            ]
        }
        training_examples.append(example)
        if (i + 1) % 100 == 0:
            print(f"✅ Generados {i + 1}/1600 ejemplos...")

    return training_examples


def save_training_file(training_data, output_path="data/training_data.jsonl"):
    """Guarda ejemplos en formato JSONL."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        for example in training_data:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')
    print(f"\n✅ {len(training_data)} ejemplos guardados en {output_path}")
    print(f"📊 Tamaño del archivo: {os.path.getsize(output_path) / 1024:.1f} KB")


if __name__ == "__main__":
    random.seed(42)
    examples = create_training_examples()
    save_training_file(examples, "data/training_data.jsonl")
    print("\n📝 Archivo de entrenamiento listo para subir a OpenAI")
    print("💡 Próximo paso: python scripts/upload_training_data.py")
