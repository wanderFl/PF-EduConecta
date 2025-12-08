# Dashboard de Agenda Escolar - EduConecta

## 📋 Descripción

El Dashboard de Agenda Escolar es un nuevo módulo agregado al sistema EduConecta que permite visualizar y gestionar las tareas académicas de manera integral. Este módulo proporciona una vista completa de todas las tareas asignadas con información detallada sobre fechas, cursos, materias y estado de las entregas.

## ✨ Características Principales

### 📊 Estadísticas en Tiempo Real
- **Total de Tareas**: Muestra el número total de tareas en el sistema
- **Tareas Vencidas**: Contador de tareas que han pasado su fecha límite
- **Próximas (7 días)**: Tareas que vencen en la próxima semana
- **Pendientes de Calificar**: Entregas que aún no han sido calificadas

### 🔍 Sistema de Filtros Avanzado
- **Por Curso**: Filtrar tareas específicas de un curso determinado
- **Por Docente**: Ver tareas asignadas por un docente específico
- **Por Fecha**: Establecer rango de fechas para visualizar tareas
- **Filtros Combinados**: Posibilidad de combinar múltiples filtros

### 📅 Visualización de Tareas
Cada tarea muestra:
- **Título y Descripción**: Información básica de la tarea
- **Estado de Prioridad**: Badges de color según urgencia (Vencida, Urgente, Próxima, Normal)
- **Información del Curso**: Curso al que pertenece la tarea
- **Docente Responsable**: ID del docente que asignó la tarea
- **Fechas Importantes**: Fecha de creación y fecha de vencimiento
- **Estadísticas de Entregas**: Número de entregas recibidas y calificadas
- **Archivos Adjuntos**: Indicador si la tarea tiene archivos asociados

### 🎨 Interfaz Intuitiva
- **Diseño Responsivo**: Adaptable a diferentes tamaños de pantalla
- **Códigos de Color**: Sistema visual para identificar prioridades rápidamente
- **Iconografía Clara**: Iconos FontAwesome para mejor comprensión visual
- **Animaciones Suaves**: Transiciones que mejoran la experiencia de usuario

## 🚀 Cómo Acceder

### Para Docentes:
1. Iniciar sesión en el sistema EduConecta
2. Seleccionar el curso correspondiente
3. En el Dashboard del Docente, hacer clic en **"Agenda Escolar Digital"**
4. Se abrirá el Dashboard de Agenda Escolar completo

### URL Directa:
- Ruta: `/docente/agenda`
- Requiere autenticación previa como docente

## 🛠️ Implementación Técnica

### Backend
- **Nuevas Rutas API**: `/api/tasks/*` para gestión completa de tareas
- **Servicio de Tareas**: `backend/src/services/tasks.ts` con funciones especializadas
- **Controladores**: `backend/src/routes/tasks.ts` para manejo de peticiones
- **Base de Datos**: Utiliza el modelo `Task` existente en Prisma

### Frontend
- **Componente Principal**: `AgendaEscolar.tsx` con lógica completa
- **Página Dedicada**: `AgendaPage.tsx` para navegación independiente
- **Servicio API**: `agenda.ts` para comunicación con el backend
- **Estilos Personalizados**: CSS modular para mantener consistencia visual

## 📊 Modelo de Datos

El sistema utiliza las siguientes entidades principales:

```typescript
interface Task {
  id: string;
  title: string;
  instructions: string | null;
  due_date: string;
  max_points: number | null;
  teacher_external_id: number;
  course_external_id: number;
  created_at: string;
  updated_at: string;
  submissions?: SubmissionGrade[];
}
```

## 🔧 Funcionalidades del API

### Endpoints Disponibles:

#### GET `/api/tasks`
- **Descripción**: Obtener todas las tareas
- **Autenticación**: Requerida
- **Respuesta**: Array de tareas con estadísticas

#### GET `/api/tasks/course/:courseId`
- **Descripción**: Obtener tareas por curso específico
- **Parámetros**: `courseId` (número)
- **Respuesta**: Tareas filtradas por curso

#### GET `/api/tasks/teacher/:teacherId`
- **Descripción**: Obtener tareas por docente
- **Parámetros**: `teacherId` (número)
- **Respuesta**: Tareas del docente especificado

#### GET `/api/tasks/stats`
- **Descripción**: Obtener estadísticas generales
- **Query Parameters**: `teacher_id`, `course_id`, `start_date`, `end_date`
- **Respuesta**: Objeto con estadísticas calculadas

#### POST `/api/tasks`
- **Descripción**: Crear nueva tarea
- **Body**: Datos de la tarea
- **Respuesta**: Tarea creada con ID asignado

#### PUT `/api/tasks/:taskId`
- **Descripción**: Actualizar tarea existente
- **Parámetros**: `taskId` (string)
- **Body**: Campos a actualizar
- **Respuesta**: Tarea actualizada

#### DELETE `/api/tasks/:taskId`
- **Descripción**: Eliminar tarea
- **Parámetros**: `taskId` (string)
- **Respuesta**: Confirmación de eliminación

## 🎯 Estados de Prioridad

El sistema clasifica las tareas automáticamente según su fecha de vencimiento:

- 🔴 **VENCIDA**: Tareas que ya pasaron su fecha límite
- 🟠 **URGENTE**: Tareas que vencen en 1 día o menos
- 🟡 **PRÓXIMA**: Tareas que vencen en 2-3 días
- 🟢 **NORMAL**: Tareas que vencen en más de 3 días

## 📱 Compatibilidad

### Navegadores Soportados:
- Chrome (recomendado)
- Firefox
- Safari
- Edge

### Dispositivos:
- 💻 Desktop (1024px+)
- 📱 Tablet (768px-1023px)
- 📱 Móvil (hasta 767px)

## 🔒 Seguridad

- **Autenticación JWT**: Todas las rutas requieren token válido
- **Autorización por Roles**: Solo docentes pueden acceder al dashboard
- **Validación de Datos**: Validación tanto en frontend como backend
- **Sanitización**: Prevención de inyección de datos maliciosos

## 🚀 Datos de Prueba

Para probar el sistema, se incluye un script que crea tareas de ejemplo:

```bash
cd backend
npx ts-node src/scripts/seed-tasks.ts
```

Este script crea 6 tareas de muestra con diferentes estados y algunas entregas de ejemplo.

## 🛡️ Compatibilidad con Sistema Existente

✅ **Garantías de Compatibilidad:**
- No modifica funcionalidades existentes
- Utiliza la base de datos actual sin cambios estructurales
- Mantiene todas las rutas y componentes previos
- Se integra sin conflictos con el sistema de autenticación existente
- Respeta los permisos y roles establecidos

## 🔄 Futuras Mejoras

### Funcionalidades Planificadas:
- **Notificaciones Push**: Alertas automáticas para tareas próximas a vencer
- **Calendario Visual**: Vista de calendario integrada
- **Exportación de Reportes**: Generación de reportes en PDF/Excel
- **Búsqueda Avanzada**: Filtros por texto, materias específicas
- **Dashboard para Estudiantes**: Vista desde la perspectiva del estudiante
- **Integración con Sistema de Calificaciones**: Conexión directa con módulo de notas

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades:
- Crear issue en el repositorio del proyecto
- Contactar al equipo de desarrollo
- Revisar la documentación técnica en `/docs/`

---

## 🎉 Resumen de Implementación

El Dashboard de Agenda Escolar ha sido **exitosamente integrado** al sistema EduConecta sin afectar ninguna funcionalidad existente. Los usuarios pueden acceder inmediatamente a través del dashboard del docente y comenzar a utilizar todas las características avanzadas de gestión de tareas.

**Estado**: ✅ **COMPLETADO Y LISTO PARA PRODUCCIÓN**