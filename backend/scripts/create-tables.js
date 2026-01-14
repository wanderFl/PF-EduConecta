const mysql = require('mysql2/promise');

async function createTables() {
  const conn = await mysql.createConnection({
    host: 'crossover.proxy.rlwy.net',
    port: 36858,
    user: 'root',
    password: 'VtpekYEGfcFxFvvODwsIQWNiWHyMhZJc',
    database: 'colegio_db'
  });

  console.log('🏗️  Creando tablas necesarias para el sistema...\n');

  try {
    // 1. Tabla calificaciones
    console.log('📝 Creando tabla calificaciones...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS calificaciones (
        id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
        id_estudiante INT NOT NULL,
        id_materia INT NOT NULL,
        trimestre INT NOT NULL,
        calificacion DECIMAL(4,2) NOT NULL,
        observaciones TEXT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE,
        FOREIGN KEY (id_materia) REFERENCES materias(id_materia) ON DELETE CASCADE,
        INDEX idx_estudiante (id_estudiante),
        INDEX idx_materia (id_materia),
        INDEX idx_trimestre (trimestre)
      )
    `);
    console.log('   ✅ Tabla calificaciones creada');

    // 2. Tabla asistencias
    console.log('\n📅 Creando tabla asistencias...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS asistencias (
        id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
        id_estudiante INT NOT NULL,
        id_curso INT NOT NULL,
        fecha DATE NOT NULL,
        estado ENUM('presente', 'falta', 'tardanza', 'justificada') NOT NULL,
        observaciones TEXT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE,
        FOREIGN KEY (id_curso) REFERENCES cursos(id_curso) ON DELETE CASCADE,
        INDEX idx_estudiante (id_estudiante),
        INDEX idx_fecha (fecha),
        INDEX idx_estado (estado),
        UNIQUE KEY unique_estudiante_fecha (id_estudiante, fecha)
      )
    `);
    console.log('   ✅ Tabla asistencias creada');

    // 3. Tabla comportamiento
    console.log('\n🎯 Creando tabla comportamiento...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS comportamiento (
        id_comportamiento INT AUTO_INCREMENT PRIMARY KEY,
        id_estudiante INT NOT NULL,
        id_curso INT NOT NULL,
        fecha DATE NOT NULL,
        tipo ENUM('positivo', 'negativo', 'neutral') NOT NULL,
        descripcion TEXT NOT NULL,
        puntos INT DEFAULT 0,
        reportado_por VARCHAR(200),
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE,
        FOREIGN KEY (id_curso) REFERENCES cursos(id_curso) ON DELETE CASCADE,
        INDEX idx_estudiante (id_estudiante),
        INDEX idx_fecha (fecha),
        INDEX idx_tipo (tipo)
      )
    `);
    console.log('   ✅ Tabla comportamiento creada');

    console.log('\n' + '='.repeat(50));
    console.log('✅ TODAS LAS TABLAS CREADAS EXITOSAMENTE');
    console.log('='.repeat(50));
    console.log('\n💡 Ahora ejecuta: node scripts/create-student-data.js');
    console.log('   para poblar las tablas con datos de prueba\n');

    await conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await conn.end();
  }
}

createTables();
