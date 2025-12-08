const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkParalelosInDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'gondola.proxy.rlwy.net',
      port: 19107,
      user: 'root',
      password: 'XotKFvWRPfJGEummiHzAZhcexswLtOTY',
      database: 'colegio_db'
    });

    console.log('🔍 Verificando paralelos en la base de datos CEIAF...\n');

    // Consultar todos los cursos y sus paralelos
    const [allCourses] = await connection.execute(`
      SELECT DISTINCT c.id_curso, c.nombre, c.nivel, c.paralelo, COUNT(e.id_estudiante) as estudiantes
      FROM cursos c
      LEFT JOIN estudiantes e ON e.id_curso = c.id_curso
      GROUP BY c.id_curso, c.nombre, c.nivel, c.paralelo
      ORDER BY c.id_curso, c.paralelo
    `);

    console.log('📊 Cursos y paralelos disponibles:');
    console.table(allCourses);

    // Consultar paralelos específicos para curso 8
    console.log('\n🎯 Paralelos específicos para curso 8:');
    const [course8Paralelos] = await connection.execute(`
      SELECT DISTINCT c.paralelo, COUNT(e.id_estudiante) as estudiantes
      FROM cursos c
      LEFT JOIN estudiantes e ON e.id_curso = c.id_curso
      WHERE c.id_curso = 8 AND c.paralelo IS NOT NULL AND c.paralelo != ''
      GROUP BY c.paralelo
      ORDER BY c.paralelo
    `);
    console.table(course8Paralelos);

    // Consultar paralelos para otros cursos también
    for (let courseId = 9; courseId <= 13; courseId++) {
      console.log(`\n🎯 Paralelos para curso ${courseId}:`);
      const [paralelos] = await connection.execute(`
        SELECT DISTINCT c.paralelo, COUNT(e.id_estudiante) as estudiantes
        FROM cursos c
        LEFT JOIN estudiantes e ON e.id_curso = c.id_curso
        WHERE c.id_curso = ? AND c.paralelo IS NOT NULL AND c.paralelo != ''
        GROUP BY c.paralelo
        ORDER BY c.paralelo
      `, [courseId]);
      console.table(paralelos);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkParalelosInDB();