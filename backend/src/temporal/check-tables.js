const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_CEIAF_URL);
        console.log('✅ Conexión exitosa a MySQL\n');
        
        console.log('📋 Tablas en la base de datos:');
        const [tables] = await connection.execute('SHOW TABLES');
        tables.forEach(row => {
            console.log('  -', Object.values(row)[0]);
        });
        
        console.log('\n📊 Estructura de la tabla estudiantes:');
        const [structure] = await connection.execute('DESCRIBE estudiantes');
        console.table(structure);
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkTables();
