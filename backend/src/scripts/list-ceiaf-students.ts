/**
 * Script para listar estudiantes desde la base de datos MySQL (CEIAF)
 * Muestra: ID, cédula, nombre completo y curso
 * 
 * Uso: npx ts-node src/scripts/list-ceiaf-students.ts
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function listCeiafStudents() {
  let connection;
  
  try {
    console.log('🔌 Conectando a base de datos MySQL CEIAF...\n');

    // Crear conexión a MySQL usando la URL de conexión del .env
    const dbUrl = process.env.DATABASE_CEIAF_URL;
    
    if (!dbUrl) {
      throw new Error('DATABASE_CEIAF_URL no está configurado en el archivo .env');
    }

    // Parsear la URL: mysql://user:pass@host:port/database
    const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!urlMatch) {
      throw new Error('Formato de DATABASE_CEIAF_URL inválido');
    }

    const [, user, password, host, port, database] = urlMatch;

    connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port: parseInt(port)
    });

    console.log('✅ Conectado a MySQL CEIAF\n');

    // Consultar estudiantes
    const [rows] = await connection.query(`
      SELECT 
        e.id_estudiante,
        e.cedula,
        e.nombres,
        e.apellidos,
        c.nombre AS curso_nombre,
        c.nivel AS curso_nivel,
        c.paralelo AS curso_paralelo,
        c.ano_lectivo
      FROM estudiantes e
      LEFT JOIN cursos c ON c.id_curso = e.id_curso
      ORDER BY e.apellidos, e.nombres
    `);

    const students = rows as any[];

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('           📚 ESTUDIANTES REGISTRADOS EN CEIAF (MySQL)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (students.length === 0) {
      console.log('❌ No hay estudiantes registrados en la base de datos CEIAF.');
      console.log('💡 Verifica la conexión a MySQL o carga datos de prueba.\n');
    } else {
      students.forEach((student, index) => {
        console.log(`${index + 1}. 👤 ${student.nombres} ${student.apellidos}`);
        console.log(`   📋 Cédula: ${student.cedula || 'Sin cédula'}`);
        console.log(`   🆔 ID: ${student.id_estudiante}`);
        
        if (student.curso_nombre) {
          console.log(`   🎓 Curso: ${student.curso_nivel || ''} "${student.curso_nombre}" ${student.curso_paralelo || ''}`);
          console.log(`   📅 Año lectivo: ${student.ano_lectivo || 'N/A'}`);
        } else {
          console.log(`   🎓 Curso: Sin asignar`);
        }
        
        console.log('───────────────────────────────────────────────────────────────');
      });

      console.log(`\n✅ Total: ${students.length} estudiante(s) encontrado(s)`);
      
      // Mostrar solo estudiantes con cédula
      const conCedula = students.filter(s => s.cedula);
      
      if (conCedula.length > 0) {
        console.log('\n📋 CÉDULAS DISPONIBLES PARA REGISTRO DE PADRES:');
        console.log('───────────────────────────────────────────────────────────────');
        conCedula.forEach(s => {
          console.log(`   ${s.cedula.padEnd(12)} → ${s.nombres} ${s.apellidos}`);
        });
        console.log('───────────────────────────────────────────────────────────────');
        console.log('\n💡 Copia una cédula y úsala en el formulario "Agregar hijo por cédula"');
      } else {
        console.log('\n⚠️  No hay estudiantes con cédula asignada');
        console.log('💡 Necesitas actualizar la base de datos CEIAF con cédulas válidas');
      }
    }

  } catch (error) {
    console.error('\n❌ Error al consultar estudiantes:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      if (error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 El servidor MySQL no está corriendo o no es accesible');
        console.error('   Verifica que MySQL esté corriendo y las credenciales en .env sean correctas');
      }
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión MySQL cerrada');
    }
  }
}

// Ejecutar el script
listCeiafStudents()
  .then(() => {
    console.log('\n✨ Script completado exitosamente\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
