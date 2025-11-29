const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStudents() {
    try {
        console.log('🔍 Conectando a la base de datos MySQL...');
        
        const connection = await mysql.createConnection(process.env.DATABASE_CEIAF_URL);
        console.log('✅ Conexión exitosa a MySQL');
        
        // First, let's see the table structure
        console.log('\n� Estructura de la tabla estudiantes:');
        const [structure] = await connection.execute('DESCRIBE estudiantes');
        console.log(structure);
        
        console.log('\n📋 Primeros 10 estudiantes:');
        const [rows] = await connection.execute(`
            SELECT * FROM estudiantes LIMIT 10
        `);
        
        for (const row of rows) {
            console.log(row);
        }
        
        await connection.end();
        console.log('\n✅ Consulta completada');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkStudents();