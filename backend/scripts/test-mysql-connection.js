/**
 * Script para probar la conexión a MySQL CEIAF y verificar las tablas
 * Ejecutar: node scripts/test-mysql-connection.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testMySQLConnection() {
  let connection;
  
  try {
    console.log('🔍 Probando conexión a MySQL CEIAF...\n');
    
    const DATABASE_CEIAF_URL = process.env.DATABASE_CEIAF_URL;
    
    if (!DATABASE_CEIAF_URL) {
      console.error('❌ ERROR: DATABASE_CEIAF_URL no está definida en .env');
      console.log('\n💡 Agrega esta variable en tu archivo .env:');
      console.log('DATABASE_CEIAF_URL=mysql://user:password@host:port/database\n');
      return;
    }
    
    console.log('📋 Conectando a MySQL...');
    connection = await mysql.createConnection({
      uri: DATABASE_CEIAF_URL
    });
    
    console.log('✅ Conexión establecida exitosamente!\n');
    
    // Probar consulta simple
    console.log('🔍 Probando consulta SELECT 1...');
    const [testResult] = await connection.query('SELECT 1 as test');
    console.log('✅ Consulta exitosa:', testResult);
    
    // Verificar tablas necesarias
    console.log('\n📊 Verificando tablas necesarias...');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const tables = ['docentes', 'cursos', 'docente_materia_curso', 'materias', 'estudiantes'];
    
    for (const table of tables) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        console.log(`✅ Tabla '${table}' - ${count} registros`);
      } catch (err) {
        console.log(`❌ Tabla '${table}' - ERROR:`, err.message);
      }
    }
    
    // Probar consulta de docente específico
    console.log('\n🔍 Probando consulta de docente (id_docente = 5)...');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    try {
      const [docente] = await connection.query(
        'SELECT * FROM docentes WHERE id_docente = ?',
        [5]
      );
      
      if (docente.length > 0) {
        console.log('✅ Docente encontrado:', docente[0]);
      } else {
        console.log('⚠️  No se encontró docente con id_docente = 5');
      }
    } catch (err) {
      console.log('❌ Error al consultar docente:', err.message);
    }
    
    // Probar consulta de cursos del docente
    console.log('\n🔍 Probando consulta de cursos del docente (id_docente = 5)...');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    try {
      const [cursos] = await connection.query(`
        SELECT DISTINCT
          c.id_curso,
          c.nombre,
          c.nivel,
          c.paralelo,
          c.ano_lectivo,
          COUNT(DISTINCT e.id_estudiante) as cantidad_estudiantes
        FROM cursos c
        INNER JOIN docente_materia_curso dmc ON c.id_curso = dmc.id_curso
        INNER JOIN estudiantes e ON c.id_curso = e.id_curso
        WHERE dmc.id_docente = ?
        GROUP BY c.id_curso, c.nombre, c.nivel, c.paralelo, c.ano_lectivo
        ORDER BY c.nivel, c.nombre, c.paralelo
      `, [5]);
      
      if (cursos.length > 0) {
        console.log(`✅ Se encontraron ${cursos.length} curso(s):\n`);
        cursos.forEach((curso, index) => {
          console.log(`${index + 1}. ${curso.nombre} - ${curso.nivel} (Paralelo ${curso.paralelo})`);
          console.log(`   Estudiantes: ${curso.cantidad_estudiantes}`);
          console.log(`   Año Lectivo: ${curso.ano_lectivo}\n`);
        });
      } else {
        console.log('⚠️  No se encontraron cursos para el docente con id_docente = 5');
        console.log('\n💡 Posibles causas:');
        console.log('   - El docente no tiene asignaciones en la tabla "docente_materia_curso"');
        console.log('   - Los cursos no tienen estudiantes asignados');
        console.log('   - El id_docente es incorrecto\n');
      }
    } catch (err) {
      console.log('❌ Error al consultar cursos:', err.message);
      console.log('\n💡 Detalles del error:', err);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Prueba de conexión completada');
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error.message);
    console.error('\n📋 Stack trace:', error.stack);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 El host de la base de datos no fue encontrado.');
      console.log('   Verifica que DATABASE_CEIAF_URL tenga el host correcto.\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Acceso denegado a la base de datos.');
      console.log('   Verifica el usuario y contraseña en DATABASE_CEIAF_URL.\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 Tiempo de espera agotado.');
      console.log('   Verifica que el servidor MySQL esté disponible y accesible.\n');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada.\n');
    }
  }
}

// Ejecutar
testMySQLConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
