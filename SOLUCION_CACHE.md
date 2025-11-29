# Solución al Error 404 - Caché del Navegador

## El Problema
El backend está funcionando correctamente (devuelve 401 = ruta existe, pero requiere auth).
El error 404 que ves es porque tu navegador está usando JavaScript antiguo en caché.

## Solución Inmediata (3 opciones, prueba en orden)

### Opción 1: Hard Refresh (Más Rápida)
1. Abre el navegador en `http://localhost:5173`
2. Presiona **Ctrl + Shift + R** (Windows)
3. O presiona **Ctrl + F5**
4. Espera a que recargue completamente

### Opción 2: Borrar Caché del Sitio
1. Abre DevTools (presiona **F12**)
2. Ve a la pestaña **Application** (o **Aplicación**)
3. En el menú izquierdo, busca **Storage** → **Clear site data**
4. Haz clic en **Clear site data**
5. Recarga la página

### Opción 3: Modo Incógnito (Para Confirmar)
1. Abre una ventana **Incógnito/Privada** (Ctrl + Shift + N en Chrome)
2. Ve a `http://localhost:5173`
3. Inicia sesión como docente
4. Si funciona aquí, confirma que es problema de caché

## Verificación Técnica

### Verificar que el backend funciona (PowerShell):
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/communications/teacher" -UseBasicParsing
# Debe devolver: 401 Unauthorized (esto es CORRECTO, significa que la ruta existe)
```

### Verificar en la Consola del Navegador (F12 → Console):
```javascript
// Pega esto en la consola del navegador
fetch('http://localhost:3000/api/communications/teacher', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log('✓ Respuesta:', data))
.catch(err => console.error('✗ Error:', err));
```

## Confirmación de que funciona
Después del hard refresh, deberías ver:
- **Antes del login**: Pantalla de Comunicados vacía o cargando
- **Después del login**: Lista de conversaciones (puede estar vacía si no hay datos)
- **NO deberías ver**: Error 404 en la consola

## Si TODAVÍA ves 404 después de hard refresh
Solo entonces ejecuta estos comandos:

```powershell
# 1. Detener todos los servidores
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Limpiar y recompilar backend
cd c:\Users\wande\OneDrive\Documentos\EduConecta\backend
npm run build

# 3. Iniciar backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\wande\OneDrive\Documentos\EduConecta\backend ; node dist\index.js"

# 4. Esperar 3 segundos
Start-Sleep -Seconds 3

# 5. Iniciar frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Users\wande\OneDrive\Documentos\EduConecta\frontend ; npm run dev"

# 6. Esperar 5 segundos
Start-Sleep -Seconds 5

# 7. Abrir navegador en modo incógnito
Start-Process "chrome.exe" -ArgumentList "--incognito", "http://localhost:5173"
```

## Estado Actual Confirmado
✅ Backend: Corriendo en puerto 3000
✅ Frontend: Corriendo en puerto 5173  
✅ Ruta `/api/communications/teacher`: Existe (devuelve 401 = requiere auth)
❌ Navegador: Usando JavaScript viejo en caché

**ACCIÓN REQUERIDA**: Hard refresh con Ctrl+Shift+R
