const mysql = require('mysql2/promise');

async function verifyData() {
  const conn = await mysql.createConnection({
    host: 'crossover.proxy.rlwy.net',
    port: 36858,
    user: 'root',
    password: 'VtpekYEGfcFxFvvODwsIQWNiWHyMhZJc',
    database: 'colegio_db'
  });

  console.log('=== VERIFICANDO DATOS DEL ESTUDIANTE ID 1 ===\n');

  // Calificaciones
  console.log('📝 CALIFICACIONES:');
  const [cal] = await conn.execute(`
    SELECT c.calificacion, m.nombre, c.trimestre 
    FROM calificaciones c 
    JOIN materias m ON c.id_materia = m.id_materia 
    WHERE c.id_estudiante = 1 
    ORDER BY m.nombre, c.trimestre
  `);
  cal.forEach(r => console.log(`   ${r.nombre} (T${r.trimestre}): ${r.calificacion}`));

  // Asistencias
  console.log('\n📅 ASISTENCIAS:');
  const [ast] = await conn.execute(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN estado = 'presente' THEN 1 ELSE 0 END) as presente,
           SUM(CASE WHEN estado = 'falta' THEN 1 ELSE 0 END) as faltas
    FROM asistencias 
    WHERE id_estudiante = 1
  `);
  console.log(`   Total días: ${ast[0].total}`);
  console.log(`   Presente: ${ast[0].presente}`);
  console.log(`   Faltas: ${ast[0].faltas}`);
  console.log(`   % Asistencia: ${((ast[0].presente / ast[0].total) * 100).toFixed(1)}%`);

  // Comportamiento
  console.log('\n🎯 COMPORTAMIENTO:');
  const [comp] = await conn.execute(`
    SELECT tipo, descripcion, puntos 
    FROM comportamiento 
    WHERE id_estudiante = 1 
    ORDER BY fecha DESC
  `);
  comp.forEach(c => console.log(`   [${c.tipo}] ${c.descripcion} (+${c.puntos})`));
  
  const totalPuntos = comp.reduce((sum, c) => sum + c.puntos, 0);
  console.log(`\n   Total puntos: ${totalPuntos}`);

  await conn.end();
}

verifyData();
