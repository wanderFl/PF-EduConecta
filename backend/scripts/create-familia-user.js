/**
 * Script para crear usuario FAMILIA con estudiante vinculado
 * Usa información real de la base de datos CEIAF
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

// Configuración de CEIAF
const ceiafConfig = {
  host: 'crossover.proxy.rlwy.net',
  port: 36858,
  user: 'root',
  password: 'VtpekYEGfcFxFvvODwsIQWNiWHyMhZJc',
  database: 'colegio_db'
};

async function main() {
  console.log('🚀 Creando usuario FAMILIA con estudiante vinculado...\n');

  // Credenciales del nuevo usuario
  const email = 'familia@educonecta.com';
  const password = 'Familia2026!';
  const pin = '1234';

  // Verificar si ya existe
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('⚠️  El usuario ya existe');
    console.log('\n📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('📌 PIN:', pin);
    console.log('\n💡 Usa estas credenciales para hacer login\n');
    return;
  }

  // Conectar a CEIAF para obtener estudiante real
  const ceiafConnection = await mysql.createConnection(ceiafConfig);
  
  try {
    // Obtener un estudiante con todos sus datos
    const [students] = await ceiafConnection.query(`
      SELECT 
        e.id_estudiante, 
        e.cedula, 
        e.nombres, 
        e.apellidos,
        c.nombre as curso_nombre,
        c.nivel as curso_nivel,
        c.paralelo as curso_paralelo
      FROM estudiantes e
      LEFT JOIN cursos c ON e.id_curso = c.id_curso
      WHERE e.id_estudiante = 1
      LIMIT 1
    `);

    if (students.length === 0) {
      console.log('❌ No se encontró estudiante en la base de datos');
      return;
    }

    const student = students[0];
    console.log('👨‍🎓 Estudiante seleccionado:');
    console.log(`   Nombre: ${student.nombres} ${student.apellidos}`);
    console.log(`   Cédula: ${student.cedula || 'N/A'}`);
    console.log(`   Curso: ${student.curso_nivel || 'N/A'} ${student.curso_paralelo || ''}`);
    console.log(`   ID: ${student.id_estudiante}\n`);

    // Crear usuario y vinculación en una transacción
    const password_hash = await bcrypt.hash(password, 10);
    const pin_hash = await bcrypt.hash(pin, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear Parent
      const parent = await tx.parent.create({
        data: {
          full_name: `Padre/Madre de ${student.nombres}`,
          cedula: `99${Math.floor(Math.random() * 100000000)}`, // Cédula única
          home_address: 'Quito, Ecuador',
          work_place: 'Empresa XYZ',
          security_pin_hash: pin_hash
        }
      });

      // 2. Crear User vinculado al Parent
      const user = await tx.user.create({
        data: {
          email,
          password_hash,
          role: 'FAMILIA',
          is_verified: true,
          is_active: true,
          parent_id: parent.id
        }
      });

      // 3. Vincular estudiante
      const link = await tx.parentStudentLink.create({
        data: {
          parent_id: parent.id,
          student_external_id: String(student.id_estudiante)
        }
      });

      return { user, parent, link };
    });

    console.log('✅ Usuario FAMILIA creado exitosamente!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 CREDENCIALES DE ACCESO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`📌 PIN:      ${pin}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('👨‍👩‍👧‍👦 Estudiante vinculado:');
    console.log(`   ${student.nombres} ${student.apellidos} (ID: ${student.id_estudiante})\n`);
    
    console.log('🌐 Para usar:');
    console.log('   1. Ve a http://localhost:5173/login');
    console.log(`   2. Ingresa email: ${email}`);
    console.log(`   3. Ingresa password: ${password}`);
    console.log('   4. Verás el dashboard con el estudiante vinculado\n');

  } finally {
    await ceiafConnection.end();
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
