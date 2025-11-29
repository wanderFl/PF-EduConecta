# EduConecta Backend

## Inicio Rápido

### Desarrollo
```bash
# Desde el directorio backend
cd "C:\Users\wande\OneDrive\Documentos\EduConecta\backend"
npm run dev
```

### Producción
```bash
# Desde el directorio backend
cd "C:\Users\wande\OneDrive\Documentos\EduConecta\backend"
npm run build
node dist/index.js
```

### Scripts de Ayuda
- `start-backend.bat` - Inicia el servidor de desarrollo
- `start-prod.bat` - Compila y ejecuta en modo producción

## Endpoints Disponibles

### Auth
- POST `/api/auth/login` - Iniciar sesión
- POST `/api/auth/register` - Registrar usuario

### Protected (requiere autenticación)
- POST `/api/protected/docente/tareas/create` - Crear tarea
- GET `/api/health` - Verificar estado del servidor

## Base de Datos

### Prisma
```bash
npm run prisma:generate  # Generar cliente
npm run prisma:migrate   # Aplicar migraciones
npm run prisma:studio    # Abrir interfaz visual
```

## Configuración

### Variables de Entorno (.env)
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/educonecta_dev?schema=public"
JWT_SECRET="your_jwt_secret_here"
PORT=3000
```

## Estado del Servidor
Cuando el servidor esté ejecutándose verás:
```
🚀 Backend server running on http://localhost:3000
📊 Health check: http://localhost:3000/api/health
🔐 Auth endpoints: http://localhost:3000/api/auth
🛡️  Protected endpoints: http://localhost:3000/api/protected
```