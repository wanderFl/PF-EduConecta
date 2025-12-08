# Colección Postman - Usuario Docente de Prueba

## Credenciales de Prueba
- **Email**: `docente.test@educativo.ec`
- **Contraseña**: `Test123!`
- **External ID**: `5` (María García en MySQL CEIAF)

---

## 1. Login (Obtener Token)

**POST** `http://localhost:3000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "docente.test@educativo.ec",
  "password": "Test123!"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "bce72509-2637-4c6d-aa9b-5b2c12b3b75b",
    "email": "docente.test@educativo.ec",
    "role": "DOCENTE",
    "external_id": "5"
  }
}
```

⚠️ **Importante**: Copiar el token de la respuesta para usarlo en las siguientes peticiones.

---

## 2. Obtener Cursos del Docente

**GET** `http://localhost:3000/api/teachers/5/courses`

**Headers:**
```
Authorization: Bearer {token_del_paso_1}
```

**Respuesta esperada:**
```json
[
  {
    "course_external_id": 13,
    "course_name": "3RO BGU",
    "student_count": 45
  },
  {
    "course_external_id": 12,
    "course_name": "2DO BGU",
    "student_count": 42
  }
]
```

---

## 3. Obtener Materias por Curso

**GET** `http://localhost:3000/api/teachers/5/courses/13/subjects`

**Headers:**
```
Authorization: Bearer {token_del_paso_1}
```

**Respuesta esperada:**
```json
[
  {
    "subject_external_id": 5,
    "subject_name": "MATEMÁTICAS",
    "parallel_name": "A"
  },
  {
    "subject_external_id": 5,
    "subject_name": "MATEMÁTICAS",
    "parallel_name": "B"
  }
]
```

---

## 4. Obtener Estudiantes por Curso y Materia

**GET** `http://localhost:3000/api/teachers/5/courses/13/subjects/5/students`

**Headers:**
```
Authorization: Bearer {token_del_paso_1}
```

**Respuesta esperada:**
```json
[
  {
    "student_external_id": 301,
    "full_name": "Juan Pérez López",
    "parallel": "A"
  },
  {
    "student_external_id": 302,
    "full_name": "María González Ruiz",
    "parallel": "A"
  }
]
```

---

## 5. Crear Tarea (con subject_external_id obligatorio)

**POST** `http://localhost:3000/api/tasks`

**Headers:**
```
Authorization: Bearer {token_del_paso_1}
Content-Type: multipart/form-data
```

**Body (form-data):**
```
nombre: Tarea de Matemáticas - Ecuaciones
instrucciones: Resolver los ejercicios del capítulo 5
fechaEntrega: 2025-12-15
puntuacion: 10
teacherExternalId: 5
courseExternalId: 13
subjectId: 5
trimestre: 2
aporte: 1
```

**Opcional (si desea adjuntar archivo):**
```
file: [seleccionar archivo PDF/imagen]
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Tarea creada exitosamente",
  "task": {
    "id": "uuid-de-la-tarea",
    "title": "Tarea de Matemáticas - Ecuaciones",
    "instructions": "Resolver los ejercicios del capítulo 5",
    "max_points": 10,
    "file_reference": "tasks/archivo.pdf",
    "due_date": "2025-12-15T00:00:00.000Z",
    "course_external_id": 13,
    "subject_external_id": 5
  }
}
```

---

## 6. Obtener Tareas del Docente

**GET** `http://localhost:3000/api/tasks/teacher/5`

**Headers:**
```
Authorization: Bearer {token_del_paso_1}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "uuid-de-la-tarea",
      "title": "Tarea de Matemáticas - Ecuaciones",
      "course_external_id": 13,
      "subject_external_id": 5,
      "due_date": "2025-12-15T00:00:00.000Z",
      "submissions": [
        {
          "student_external_id": 301,
          "nombre_completo": "Juan Pérez López",
          "grade": 8.5,
          "submitted_at": "2025-12-10T10:30:00.000Z"
        }
      ]
    }
  ]
}
```

---

## 7. Registrar Calificación

**POST** `http://localhost:3000/api/calificaciones/registrar`

**Headers:**
```
Authorization: Bearer {token_del_paso_1}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "tareaId": "uuid-de-la-tarea",
  "studentId": "301",
  "grade": 9.5,
  "comment": "Excelente trabajo, muy bien explicado"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Calificación registrada exitosamente",
  "submission": {
    "id": "uuid-del-submission",
    "grade": 9.5,
    "comment_teacher": "Excelente trabajo, muy bien explicado",
    "student_id": 301,
    "graded_at": "2025-11-26T20:30:00.000Z"
  }
}
```

---

## Notas Importantes

### Campos Obligatorios en Creación de Tareas
- ✅ `teacherExternalId` (debe coincidir con el external_id del docente logueado)
- ✅ `courseExternalId` (ID del curso en MySQL)
- ✅ `subjectId` (ID de la materia en MySQL) - **NUEVO CAMPO OBLIGATORIO**
- ✅ `nombre` (título de la tarea)
- ✅ `fechaEntrega` (fecha de entrega)

### Campos Opcionales
- `instrucciones`
- `puntuacion` (puntos máximos)
- `trimestre` (1, 2, 3)
- `aporte` (1, 2)
- `file` (archivo adjunto)

### Validaciones
- El backend valida que el `teacherExternalId` corresponda al usuario autenticado
- El `subject_external_id` es obligatorio y debe existir en la base de datos MySQL
- Las calificaciones deben estar entre 0 y el `max_points` de la tarea

### Cambios Importantes
1. ❌ **Campo `paralelo` eliminado**: Ya no se usa en tareas (estaba en el código pero no en el schema)
2. ✅ **Campo `subject_external_id` obligatorio**: Toda tarea debe tener materia asignada
3. ✅ **Campos de comentarios**: Usar `student_comment` y `teacher_comment` (mapeados en Prisma)

---

## Flujo Completo de Prueba

1. **Login** → Obtener token
2. **Ver cursos** → GET /api/teachers/5/courses
3. **Elegir curso** → GET /api/teachers/5/courses/{courseId}/subjects
4. **Ver estudiantes** → GET /api/teachers/5/courses/{courseId}/subjects/{subjectId}/students
5. **Crear tarea** → POST /api/tasks (con subjectId)
6. **Ver tareas** → GET /api/tasks/teacher/5
7. **Calificar** → POST /api/calificaciones/registrar

---

## Errores Comunes

### 401 Unauthorized
- Token inválido o expirado
- Falta el header `Authorization: Bearer {token}`

### 403 Forbidden
- El usuario no tiene el rol DOCENTE
- El `teacherExternalId` no coincide con el usuario logueado

### 400 Bad Request - "Subject ID is required"
- Falta el campo `subjectId` en la creación de tarea
- El `subjectId` no es un número válido

### 404 Not Found
- El curso, materia o estudiante no existe en MySQL
- El docente no tiene asignada esa materia
