# 🎓 Usuario de Prueba Creado - EduConecta

## ✅ Credenciales del Usuario Docente

```
📧 Email: docente.test@educativo.ec
🔑 Contraseña: Test123!
👤 Rol: DOCENTE
🆔 External ID: 5 (María García en MySQL CEIAF)
```

---

## 🚀 Inicio Rápido con Postman

### 1. Login para obtener token
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "docente.test@educativo.ec",
  "password": "Test123!"
}
```

**Copiar el `token` de la respuesta** para usarlo en los siguientes requests.

---

### 2. Ver cursos asignados
```http
GET http://localhost:3000/api/teachers/5/courses
Authorization: Bearer {tu_token_aqui}
```

---

### 3. Ver materias de un curso
```http
GET http://localhost:3000/api/teachers/5/courses/13/subjects
Authorization: Bearer {tu_token_aqui}
```

---

### 4. Crear tarea (ahora con subjectId obligatorio)
```http
POST http://localhost:3000/api/tasks
Authorization: Bearer {tu_token_aqui}
Content-Type: multipart/form-data

Form Data:
- nombre: Tarea de Prueba
- instrucciones: Descripción de la tarea
- fechaEntrega: 2025-12-15
- puntuacion: 10
- teacherExternalId: 5
- courseExternalId: 13
- subjectId: 5
- trimestre: 2
- aporte: 1
```

---

## 📋 Documentación Completa

Ver el archivo `POSTMAN_COLLECTION.md` para:
- Colección completa de endpoints
- Ejemplos de todas las peticiones
- Respuestas esperadas
- Validaciones y errores comunes
- Flujo completo de prueba

---

## 🔧 Script de Creación

El usuario fue creado con el script:
```bash
node backend/scripts/create-test-docente.js
```

Este script:
- ✅ Verifica si el usuario ya existe
- ✅ Permite recrearlo si es necesario
- ✅ Hashea la contraseña con bcrypt
- ✅ Asigna el external_id correcto
- ✅ Muestra instrucciones de uso

---

## ⚙️ Cambios Implementados

### ✅ Eliminado campo `paralelo`
- Ya no se requiere al crear tareas
- No existe en el schema Prisma

### ✅ Campo `subject_external_id` obligatorio
- Toda tarea debe tener materia asignada
- Se valida contra la base de datos MySQL

### ✅ Campos de comentarios corregidos
- `comment_student` → `student_comment`
- `comment_teacher` → `teacher_comment`

### ✅ Estados de asistencia mapeados
- `PRESENTE` → `PRESENT`
- `AUSENTE` → `ABSENT_UNJUSTIFIED`
- `JUSTIFICADO` → `ABSENT_JUSTIFIED_ACCEPTED`

---

## 🎯 Flujo de Navegación Frontend

1. **Login** con credenciales
2. **Selección de curso** → `/docente/courses`
3. **Selección de materia** → `/docente/subjects`
4. **Dashboard docente** → `/docente/dashboard`
5. Desde ahí: crear tareas, ver calificaciones, etc.

---

## 📦 Archivos Creados

1. `backend/scripts/create-test-docente.js` - Script de creación del usuario
2. `POSTMAN_COLLECTION.md` - Colección completa de peticiones
3. `USUARIO_PRUEBA.md` - Este archivo con resumen rápido

---

## ✨ Listo para Probar

El backend está compilado y sin errores. Puedes:

1. **Iniciar el servidor backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Iniciar el frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Probar en Postman** con las credenciales de arriba

4. **O probar en el frontend** navegando a `http://localhost:5173` y haciendo login

---

## 🔍 Información del Docente en MySQL

El external_id `5` corresponde a un docente que tiene:
- Materias asignadas en varios cursos
- Estudiantes específicos por materia y paralelo
- Permisos para crear tareas solo en sus cursos/materias

Toda la información se filtra desde MySQL según las asignaciones reales del docente.
