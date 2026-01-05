const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Probando conexión a MySQL CEIAF...');
  console.log('URL:', process.env.DATABASE_CEIAF_URL);

  try {
    const connection = await mysql.createConnection({
      uri: process.env.DATABASE_CEIAF_URL,
      connectTimeout: 15000,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Conexión exitosa!');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query de prueba exitosa:', rows);
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Tablas disponibles:', tables.length);
    console.log('Tablas:', tables.map(t => Object.values(t)[0]));
    
    await connection.end();
    console.log('✅ Conexión cerrada correctamente');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('Código:', error.code);
    if (error.errno) console.error('Error número:', error.errno);
  }
}

testConnection();
