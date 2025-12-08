/**
 * Script para descubrir el esquema de MySQL y encontrar las relaciones correctas
 * Ejecutar: node scripts/discover-mysql-schema.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function discoverSchema() {
  let connection;
  
  try {
    console.log('🔍 Descubriendo esquema de MySQL CEIAF...\n');
    
    connection = await mysql.createConnection({
      uri: process.env.DATABASE_CEIAF_URL
    });
    
    console.log('✅ Conectado a MySQL\n');
    
    // Obtener todas las tablas
    console.log('📊 TABLAS EN LA BASE DE DATOS:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    for (const tableName of tableNames) {
      const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`📋 ${tableName} - ${count[0].count} registros`);
    }
    
    // Describir estructura de tablas clave
    console.log('\n\n🔍 ESTRUCTURA DE TABLAS CLAVE:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const keyTables = ['docentes', 'cursos', 'materias', 'estudiantes'];
    
    for (const tableName of keyTables) {
      if (tableNames.includes(tableName)) {
        console.log(`\n📋 Estructura de '${tableName}':`);
        console.log('─────────────────────────────────────────────────────────────');
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        columns.forEach(col => {
          console.log(`  ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Key ? `[${col.Key}]` : ''}`);
        });
      }
    }
    
    // Buscar tablas que puedan relacionar docentes con cursos
    console.log('\n\n🔍 BUSCANDO RELACIONES DOCENTE-CURSO:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Buscar tablas que contengan id_docente e id_curso
    for (const tableName of tableNames) {
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      const columnNames = columns.map(c => c.Field);
      
      const hasDocente = columnNames.some(c => c.toLowerCase().includes('docente'));
      const hasCurso = columnNames.some(c => c.toLowerCase().includes('curso'));
      const hasMateria = columnNames.some(c => c.toLowerCase().includes('materia'));
      
      if ((hasDocente && hasCurso) || (hasDocente && hasMateria)) {
        console.log(`✅ Tabla potencial: '${tableName}'`);
        console.log(`   Columnas: ${columnNames.join(', ')}`);
        
        // Mostrar algunos registros de ejemplo
        const [sample] = await connection.query(`SELECT * FROM ${tableName} LIMIT 3`);
        if (sample.length > 0) {
          console.log(`   Ejemplo:`, JSON.stringify(sample[0], null, 2));
        }
        console.log('');
      }
    }
    
    // Verificar si hay foreign keys
    console.log('\n🔍 FOREIGN KEYS:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const [fks] = await connection.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM
        information_schema.KEY_COLUMN_USAGE
      WHERE
        REFERENCED_TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (fks.length > 0) {
      fks.forEach(fk => {
        console.log(`📌 ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('⚠️  No se encontraron foreign keys definidas.');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

discoverSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
