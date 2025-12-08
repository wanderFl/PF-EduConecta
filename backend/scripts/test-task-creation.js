const axios = require('axios');

(async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjODRhYjc2ZS1hNWJhLTQ0MDMtOTZmNC01ZWFjZWUzOWIwYTQiLCJlbWFpbCI6InRlc3Rkb2NlbnRlQGV4YW1wbGUuY29tIiwicm9sZSI6IkRPQ0VOVEUiLCJpYXQiOjE3NjIyMTc5OTV9.lEBq4LGv4AuZYKbYWy5m6hbFACYM7hzTckdPz';
  
  try {
    const response = await axios.post('http://localhost:3000/api/protected/docente/tareas/create', {
      nombre: 'Tarea de prueba backend',
      instrucciones: 'Resuelve los ejercicios de álgebra',
      puntuacion: 100,
      fechaVencimiento: '2025-12-01',
      cursoId: '8vo'
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.error('ERROR:', error.response?.data || error.message);
  }
})();