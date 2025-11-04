const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjODRhYjc2ZS1hNWJhLTQ0MDMtOTZmNC01ZWFjZWUzOWIwYTQiLCJlbWFpbCI6InRlc3Rkb2NlbnRlQGV4YW1wbGUuY29tIiwicm9sZSI6IkRPQ0VOVEUiLCJpYXQiOjE3NjIyMTc5OTV9.lEBq4LGv4AuZYKbYWy5m6hbFACYM7hzTckdPz';

const payload = JSON.stringify({
  nombre: 'Tarea de prueba backend',
  instrucciones: 'Resuelve los ejercicios de álgebra',
  puntuacion: 100,
  fechaVencimiento: '2025-12-01',
  cursoId: '8vo'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/protected/docente/tareas/create',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
});

req.on('error', (e) => console.error(`ERROR: ${e.message}`));
req.write(payload);
req.end();