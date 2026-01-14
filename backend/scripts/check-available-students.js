const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function checkStudents() {
  try {
    console.log('🔍 VERIFICANDO ESTUDIANTES DISPONIBLES\n');
    console.log('='.repeat(60));
    
    // 1. Verificar estudiantes vinculados al padre
    console.log('\n1️⃣ Estudiantes vinculados a familia@educonecta.com:');
    console.log('-'.repeat(60));
    
    const user = await prisma.user.findUnique({
      where: { email: 'familia@educonecta.com' },
      include: {
        parent: {
          include: {
            student_links: true
          }
        }
      }
    });

    if (!user?.parent?.student_links || user.parent.student_links.length === 0) {
      console.log('❌ No hay estudiantes vinculados');
      return;
    }

    console.log(`✅ Encontrados ${user.parent.student_links.length} estudiante(s):`);
    user.parent.student_links.forEach(link => {
      console.log(`   - Student External ID: ${link.student_external_id}`);
    });

    // 2. Verificar si existen en la base de datos CEIAF (MySQL)
    console.log('\n2️⃣ Conectando a base de datos CEIAF (MySQL):');
    console.log('-'.repeat(60));
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'crossover.proxy.rlwy.net',
      port: parseInt(process.env.MYSQL_PORT || '36858'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'yJOzKQDfIwQSQnfnmWYzpZudXwRmhvpQ',
      database: process.env.MYSQL_DATABASE || 'colegio_db'
    });

    console.log('✅ Conexión exitosa a MySQL');

    // 3. Buscar cada estudiante
    console.log('\n3️⃣ Buscando estudiantes en CEIAF:');
    console.log('-'.repeat(60));
    
    for (const link of user.parent.student_links) {
      const studentId = link.student_external_id;
      
      const [rows] = await connection.execute(
        'SELECT id, nombre, apellido FROM estudiantes WHERE id = ?',
        [studentId]
      );

      if (rows.length > 0) {
        const student = rows[0];
        console.log(`✅ ID ${studentId}: ${student.nombre} ${student.apellido}`);
        
        // Buscar calificaciones
        const [grades] = await connection.execute(
          'SELECT COUNT(*) as count FROM calificaciones WHERE estudiante_id = ?',
          [studentId]
        );
        console.log(`   📊 Calificaciones: ${grades[0].count}`);
        
        // Buscar asistencias
        const [attendance] = await connection.execute(
          'SELECT COUNT(*) as count FROM asistencias WHERE estudiante_id = ?',
          [studentId]
        );
        console.log(`   📅 Registros de asistencia: ${attendance[0].count}`);
        
      } else {
        console.log(`❌ ID ${studentId}: NO ENCONTRADO en base de datos CEIAF`);
      }
    }

    await connection.end();
    
    // 4. Verificar configuración del endpoint AI
    console.log('\n4️⃣ Configuración de la API MySQL:');
    console.log('-'.repeat(60));
    const mysqlApiUrl = process.env.MYSQL_API_URL || 'http://localhost:8000';
    console.log(`MYSQL_API_URL: ${mysqlApiUrl}`);
    
    if (mysqlApiUrl === 'http://localhost:8000') {
      console.log('\n⚠️ PROBLEMA DETECTADO:');
      console.log('El endpoint AI está configurado para usar una API REST en puerto 8000');
      console.log('que probablemente no existe.');
      console.log('\n💡 SOLUCIONES:');
      console.log('1. Modificar aiRoutes.ts para consultar directamente a MySQL');
      console.log('2. O crear/configurar la API en puerto 8000');
      console.log('3. O modificar el código para usar los datos disponibles');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️ No se puede conectar a MySQL');
      console.log('Verifica las credenciales en el archivo .env');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();
