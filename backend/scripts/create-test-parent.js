/**
 * Script para crear un usuario padre de prueba con estudiantes vinculados
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

// Configuración de CEIAF
const ceiafConfig = {
  host: process.env.CEIAF_HOST || 'crossover.proxy.rlwy.net',
  port: parseInt(process.env.CEIAF_PORT || '36858'),
  user: process.env.CEIAF_USER || 'root',
  password: process.env.CEIAF_PASSWORD || 'VtpekYEGfcFxFvvODwsIQWNiWHyMhZJc',
  database: process.env.CEIAF_DATABASE || 'colegio_db'
};

async function main() {
  console.log('🚀 Creando usuario padre de prueba...\n');

  const testEmail = 'padre.test@educonecta.com';
  const testPassword = 'Test123!';
  const testCedula = '1234567890'; // Cédula ficticia válida

  // Verificar si ya existe
  const existing = await prisma.user.findUnique({ where: { email: testEmail } });
  if (existing) {
    console.log('⚠️  El usuario ya existe:', testEmail);
    console.log('   Usa estas credenciales para login:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}\n`);
    return;
  }

  // Conectar a CEIAF para obtener estudiantes
  const ceiafConnection = await mysql.createConnection(ceiafConfig);
  
  try {
    const [students] = await ceiafConnection.query(
      'SELECT id_estudiante, cedula, nombres, apellidos FROM estudiantes LIMIT 2'
    );

    if (students.length === 0) {
      console.log('❌ No hay estudiantes en CEIAF');
      return;
    }

    console.log(`📚 Estudiantes encontrados: ${students.length}`);
    students.forEach(s => {
      console.log(`   - ${s.nombres} ${s.apellidos} (ID: ${s.id_estudiante})`);
    });
    console.log('');

    // Crear parent y user en transacción
    const password_hash = await bcrypt.hash(testPassword, 10);
    const pin_hash = await bcrypt.hash('1234', 10);

    const result = await prisma.$transaction(async (tx) => {
      // Crear parent
      const parent = await tx.parent.create({
        data: {
          full_name: 'Padre de Prueba',
          cedula: testCedula,
          home_address: 'Quito, Ecuador',
          work_place: 'Empresa XYZ',
          security_pin_hash: pin_hash
        }
      });

      // Crear user
      const user = await tx.user.create({
        data: {
          email: testEmail,
          password_hash,
          role: 'FAMILIA',
          is_verified: true,
          is_active: true,
          parent_id: parent.id
        }
      });

      // Vincular estudiantes
      const links = await Promise.all(
        students.map(student =>
          tx.parentStudentLink.create({
            data: {
              parent_id: parent.id,
              student_external_id: String(student.id_estudiante)
            }
          })
        )
      );

      return { user, parent, links };
    });

    console.log('✅ Usuario padre creado exitosamente!\n');
    console.log('📝 Credenciales de prueba:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   PIN de seguridad: 1234`);
    console.log('');
    console.log('👨‍👩‍👧‍👦 Estudiantes vinculados:', result.links.length);
    console.log('');
    console.log('🔐 Usa estas credenciales para hacer login en la aplicación');

  } finally {
    await ceiafConnection.end();
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
