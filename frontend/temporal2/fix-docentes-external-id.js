// Script para vincular docentes existentes con sus external_id de MySQL
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'backend', 'generated', 'prisma'));
const mysql = require(path.join(__dirname, 'backend', 'node_modules', 'mysql2', 'promise'));

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Iniciando vinculación de docentes con MySQL...\n');
  
  // Conexión a MySQL
  const ceiafPool = mysql.createPool({
    host: 'switchyard.proxy.rlwy.net',
    port: 22717,
    user: 'root',
    password: 'ZklQndRZIHzTalNqrHZNhEsrhyAjypKX',
    database: 'colegio_db',
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    // Buscar docentes sin external_id
    const docentesSinVincular = await prisma.user.findMany({
      where: {
        role: 'DOCENTE',
        external_id: null
      },
      select: {
        id: true,
        email: true
      }
    });

    if (docentesSinVincular.length === 0) {
      console.log('✅ Todos los docentes ya están vinculados con MySQL');
      return;
    }

    console.log(`📋 Se encontraron ${docentesSinVincular.length} docentes sin vincular:\n`);
    
    let vinculados = 0;
    let noEncontrados = 0;

    for (const docente of docentesSinVincular) {
      console.log(`Buscando: ${docente.email}`);
      
      try {
        const [rows] = await ceiafPool.query(
          'SELECT id_docente, nombres, apellidos FROM docentes WHERE email = ? LIMIT 1',
          [docente.email]
        );

        if (rows && rows.length > 0) {
          const teacherData = rows[0];
          const external_id = teacherData.id_docente.toString();
          
          await prisma.user.update({
            where: { id: docente.id },
            data: { external_id: external_id }
          });

          console.log(`✅ Vinculado: ${docente.email} → ID ${external_id} (${teacherData.nombres} ${teacherData.apellidos})`);
          vinculados++;
        } else {
          console.log(`❌ No encontrado en MySQL: ${docente.email}`);
          noEncontrados++;
        }
      } catch (err) {
        console.error(`❌ Error procesando ${docente.email}:`, err.message);
        noEncontrados++;
      }
      
      console.log('');
    }

    console.log('\n📊 Resumen:');
    console.log(`✅ Docentes vinculados: ${vinculados}`);
    console.log(`❌ Docentes no encontrados en MySQL: ${noEncontrados}`);
    
    if (noEncontrados > 0) {
      console.log('\n💡 Para los docentes no encontrados:');
      console.log('   1. Verifica que el email en PostgreSQL coincida con el email en MySQL');
      console.log('   2. O regístralos en la base de datos MySQL (tabla docentes)');
    }

    // Mostrar estado final
    console.log('\n📋 Estado final de docentes:');
    const todosLosDocentes = await prisma.user.findMany({
      where: { role: 'DOCENTE' },
      select: {
        email: true,
        external_id: true
      }
    });

    todosLosDocentes.forEach((doc) => {
      const estado = doc.external_id ? `✅ ID: ${doc.external_id}` : '❌ Sin vincular';
      console.log(`   ${doc.email}: ${estado}`);
    });

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error(error);
  } finally {
    await ceiafPool.end();
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
