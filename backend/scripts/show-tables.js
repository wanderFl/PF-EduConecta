const mysql = require('mysql2/promise');

async function showTables() {
  const conn = await mysql.createConnection({
    host: 'crossover.proxy.rlwy.net',
    port: 36858,
    user: 'root',
    password: 'VtpekYEGfcFxFvvODwsIQWNiWHyMhZJc',
    database: 'colegio_db'
  });

  console.log('\n📋 TABLAS DISPONIBLES:');
  const [tables] = await conn.execute('SHOW TABLES');
  tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));

  console.log('\n📚 COLUMNAS DE estudiantes:');
  const [columns] = await conn.execute('SHOW COLUMNS FROM estudiantes');
  columns.forEach(c => console.log(`  - ${c.Field} (${c.Type})`));

  await conn.end();
}

showTables();
