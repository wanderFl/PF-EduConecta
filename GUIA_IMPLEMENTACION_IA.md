# 🚀 Guía de Implementación - Sistema de IA EduConecta

## ✅ ¡IMPLEMENTACIÓN COMPLETADA!

Todos los archivos necesarios para el sistema de IA han sido creados e integrados en tu proyecto EduConecta.

---

## 📋 PASOS A SEGUIR (EN ORDEN)

### **PASO 1: Instalar Python y Dependencias**

```powershell
# 1.1 - Verifica que tienes Python instalado (3.9 o superior)
python --version

# Si no tienes Python, descárgalo de: https://www.python.org/downloads/

# 1.2 - Ve al directorio del servicio de IA
cd aia-service

# 1.3 - Crea un entorno virtual de Python
python -m venv venv

# 1.4 - Activa el entorno virtual (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Si da error de permisos, ejecuta esto PRIMERO en PowerShell como Administrador:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 1.5 - Instala las dependencias
pip install -r requirements.txt

# Verifica que se instalaron correctamente
pip list
```

---

### **PASO 2: Generar Datos de Entrenamiento**

```powershell
# Asegúrate de estar en aia-service/ con el entorno virtual activado
# Deberías ver (venv) al inicio de la línea de comando

# 2.1 - Genera 60 ejemplos sintéticos de entrenamiento
python scripts/generate_training_data.py

# ✅ Esto creará el archivo: data/training_data.jsonl
# ✅ Contiene 60 ejemplos variados y creíbles de reportes estudiantiles
```

---

### **PASO 3: Subir Datos a OpenAI y Entrenar el Modelo**

```powershell
# 3.1 - Subir datos y crear job de fine-tuning
python scripts/upload_training_data.py

# ⏳ El script subirá el archivo y creará un job de entrenamiento
# ⏳ El entrenamiento tomará entre 10-60 minutos

# 3.2 - Verificar el estado del entrenamiento
# El script te dará un job_id. Cópialo y úsalo aquí:
python scripts/upload_training_data.py check <job_id>

# O simplemente (usará el último job creado):
python scripts/upload_training_data.py check

# 3.3 - Cuando el estado sea "succeeded", copia el nombre del modelo
# Ejemplo: ft:gpt-4o-mini-2024-07-18:educonecta::AbCdEfGh
```

---

### **PASO 4: Actualizar Configuración con Modelo Entrenado**

```powershell
# 4.1 - Edita aia-service/.env
# Reemplaza esta línea:
FINE_TUNED_MODEL=gpt-4o-mini

# Con el modelo entrenado (ejemplo):
FINE_TUNED_MODEL=ft:gpt-4o-mini-2024-07-18:educonecta::AbCdEfGh

# ⚠️ IMPORTANTE: Usa el modelo que te dio el script en el paso 3.3
```

---

### **PASO 5: Actualizar Base de Datos (Prisma)**

```powershell
# 5.1 - Abre una NUEVA terminal en el directorio backend/
cd backend

# 5.2 - Genera el cliente Prisma con el nuevo modelo AIReport
npm run prisma:generate

# 5.3 - Crea y aplica la migración
npm run prisma:migrate

# Te pedirá un nombre para la migración, escribe: add_ai_reports
```

---

### **PASO 6: Iniciar el Servicio de IA**

```powershell
# 6.1 - En una terminal, ve a aia-service/
cd aia-service

# 6.2 - Activa el entorno virtual si no está activo
.\venv\Scripts\Activate.ps1

# 6.3 - Inicia el servicio
python main.py

# ✅ Deberías ver:
# 🚀 Starting EduConecta AI Service on port 8001
# 🤖 Using model: ft:gpt-4o-mini-2024-07-18:educonecta::...

# ⚠️ DEJA ESTA TERMINAL ABIERTA - El servicio debe estar corriendo
```

---

### **PASO 7: Iniciar el Backend**

```powershell
# 7.1 - Abre OTRA terminal y ve a backend/
cd backend

# 7.2 - Inicia el servidor backend
npm run dev

# ✅ Deberías ver:
# Server running on port 3000

# ⚠️ DEJA ESTA TERMINAL ABIERTA
```

---

### **PASO 8: Iniciar el Frontend**

```powershell
# 8.1 - Abre OTRA terminal (tercera) y ve a frontend/
cd frontend

# 8.2 - Inicia el servidor de desarrollo
npm run dev

# ✅ Deberías ver:
# Local: http://localhost:5173

# ⚠️ DEJA ESTA TERMINAL ABIERTA
```

---

### **PASO 9: Integrar Componentes en tu Interfaz**

Los componentes ya están creados. Solo necesitas importarlos en las páginas de padres:

```tsx
// En alguna página de padres (ejemplo: frontend/src/pages/Familia/Dashboard.tsx)

import { PerformanceReport } from '../../components/AI/PerformanceReport';
import { TaskRecommendations } from '../../components/AI/TaskRecommendations';

// Dentro de tu componente:
function DashboardPadre() {
  const studentExternalId = "123"; // ID del estudiante
  const studentName = "Juan Pérez";

  return (
    <div>
      {/* Tus otros componentes */}
      
      <PerformanceReport 
        studentExternalId={studentExternalId}
        studentName={studentName}
      />

      <TaskRecommendations 
        studentExternalId={studentExternalId}
      />
    </div>
  );
}
```

---

## 🧪 PASO 10: Probar el Sistema

### Prueba 1: Verificar Servicios

```powershell
# En tu navegador o con curl:

# 1. Verifica que el servicio IA esté corriendo
# Abre: http://localhost:8001
# Deberías ver: {"service": "EduConecta AI Service", "status": "active"}

# 2. Verifica el backend
# Abre: http://localhost:3000/api/test
# Deberías ver: {"message": "Backend server is working!"}

# 3. Verifica health check de IA
# Abre: http://localhost:3000/api/ai/health
# Deberías ver: {"ai_service": "healthy", "backend": "healthy"}
```

### Prueba 2: Generar un Reporte

1. Inicia sesión como padre de familia en http://localhost:5173
2. Navega a la sección donde incluiste el componente `PerformanceReport`
3. Haz clic en "Generar Reporte Inteligente"
4. Espera 10-30 segundos
5. ✅ Deberías ver un reporte completo con análisis, métricas y recomendaciones

### Prueba 3: Generar Recomendaciones de Tareas

1. En la misma interfaz, busca el componente `TaskRecommendations`
2. Haz clic en "Obtener Orden Recomendado"
3. ✅ Deberías ver el orden sugerido de tareas con plan diario y consejos

---

## 📊 Estructura de Archivos Creados

```
EduConecta/
├── aia-service/                    ✅ CREADO
│   ├── .env                        ✅ Con tu API key
│   ├── .gitignore                  ✅
│   ├── requirements.txt            ✅
│   ├── main.py                     ✅ Servicio FastAPI
│   ├── data/                       ✅
│   │   └── training_data.jsonl     ✅ 60 ejemplos
│   └── scripts/                    ✅
│       ├── generate_training_data.py  ✅
│       └── upload_training_data.py    ✅
│
├── backend/
│   ├── .env                        ✅ Actualizado con AI_SERVICE_URL
│   ├── prisma/
│   │   └── schema.prisma           ✅ Agregado modelo AIReport
│   └── src/
│       ├── index.ts                ✅ Rutas IA registradas
│       ├── services/
│       │   └── aiService.ts        ✅ CREADO
│       └── routes/
│           └── aiRoutes.ts         ✅ CREADO
│
└── frontend/
    └── src/
        ├── services/
        │   └── aiService.ts        ✅ CREADO
        └── components/
            └── AI/                 ✅ CREADO
                ├── PerformanceReport.tsx      ✅
                ├── PerformanceReport.css      ✅
                ├── TaskRecommendations.tsx    ✅
                └── TaskRecommendations.css    ✅
```

---

## 🔧 Troubleshooting

### Error: "AI Service is not responding"
**Solución:** Verifica que el servicio de IA esté corriendo en puerto 8001
```powershell
cd aia-service
.\venv\Scripts\Activate.ps1
python main.py
```

### Error: "Module not found" en Python
**Solución:** Reinstala las dependencias
```powershell
cd aia-service
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Error: "Invalid API key" de OpenAI
**Solución:** Verifica que la API key en `aia-service/.env` sea correcta
```
OPENAI_API_KEY=sk-proj-F5M5loA1Tll...
```

### Error: Prisma "Unknown field AIReport"
**Solución:** Regenera el cliente Prisma
```powershell
cd backend
npm run prisma:generate
```

### El fine-tuning falla
**Solución:** 
1. Verifica que el archivo `data/training_data.jsonl` se haya creado correctamente
2. Verifica tu saldo en OpenAI: https://platform.openai.com/usage
3. Intenta con menos ejemplos (modifica el script para generar 30 en vez de 60)

---

## 💰 Costos Estimados

### Fine-tuning (Una vez)
- **60 ejemplos (~150K tokens)**: $0.12 USD
- **Duración**: 10-30 minutos

### Uso Mensual (100 reportes/día)
- **GPT-4o-mini fine-tuned**: ~$30/mes
- **Alternativa sin fine-tuning**: $25/mes (GPT-4o-mini base)

---

## 📚 Recursos Adicionales

- **Monitorear entrenamiento**: https://platform.openai.com/finetune
- **Ver uso y costos**: https://platform.openai.com/usage
- **Documentación OpenAI**: https://platform.openai.com/docs
- **Regenerar ejemplos**: `python scripts/generate_training_data.py`

---

## ✨ ¡Listo!

El sistema de IA está completamente implementado. Sigue los pasos en orden y tendrás:

✅ Reportes de rendimiento con análisis inteligente  
✅ Recomendaciones de orden de tareas  
✅ Alertas tempranas automáticas  
✅ Planes de acción personalizados  
✅ Historial de reportes guardado en base de datos  

¿Necesitas ayuda con algún paso? Revisa la sección de troubleshooting o contacta al equipo técnico.
