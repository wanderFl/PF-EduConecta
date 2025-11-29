require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyMySQLDocentes() {
  let connection;
  
  try {
    console.log('🔍 Conectando a MySQL CEIAF...\n');
    console.log('DATABASE_CEIAF_URL:', process.env.DATABASE_CEIAF_URL ? 'Configurado' : 'No configurado');
    
    if (!process.env.DATABASE_CEIAF_URL) {
      throw new Error('DATABASE_CEIAF_URL no está configurado en .env');
    }
    
    connection = await mysql.createConnection(process.env.DATABASE_CEIAF_URL);
    
    console.log('✅ Conexión exitosa\n');
    
    // Verificar docentes en MySQL
    const [docentes] = await connection.execute(
      'SELECT * FROM docentes WHERE id_docente IN (1, 2, 5)'
    );
    
    console.log('📋 Docentes en MySQL CEIAF:\n');
    docentes.forEach(d => {
      console.log(`ID: ${d.id_docente}`);
      console.log(`Nombre: ${d.nombres} ${d.apellidos}`);
      console.log(`Columnas:`, Object.keys(d).join(', '));
      console.log('');
    });
    
    // Verificar relaciones docente-materia-curso
    console.log('📚 Verificando relaciones docente-materia-curso...\n');
    
    for (const docente of docentes) {
      const [relaciones] = await connection.execute(`
        SELECT dmc.*, m.nombre as materia, c.nombre as curso
        FROM docente_materia_curso dmc
        INNER JOIN materias m ON dmc.id_materia = m.id_materia
        INNER JOIN cursos c ON dmc.id_curso = c.id_curso
        WHERE dmc.id_docente = ?
      `, [docente.id_docente]);
      
      console.log(`Docente: ${docente.nombres} ${docente.apellidos} (ID: ${docente.id_docente})`);
      console.log(`Cursos asignados: ${relaciones.length}`);
      
      if (relaciones.length > 0) {
        relaciones.forEach(r => {
          console.log(`  - ${r.materia} en ${r.curso}`);
        });
      } else {
        console.log('  ⚠️  Sin cursos asignados');
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyMySQLDocentes();
