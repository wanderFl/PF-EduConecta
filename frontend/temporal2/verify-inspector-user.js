/**
 * Script para verificar automáticamente el usuario INSPECTOR creado
 */
const { PrismaClient } = require('./backend/generated/prisma');

async function verifyInspectorUser() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 === VERIFICANDO USUARIO INSPECTOR ===\n');
        
        const inspectorEmail = 'inspector.prueba@educacion.ec';
        
        // Buscar el usuario
        const user = await prisma.user.findUnique({
            where: { email: inspectorEmail }
        });
        
        if (!user) {
            console.log('❌ Usuario INSPECTOR no encontrado');
            console.log('💡 Ejecuta primero: node create-inspector-user.js');
            return;
        }
        
        console.log('📋 Usuario encontrado:');
        console.log('   ID:', user.id);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Verificado:', user.is_verified);
        console.log('   Activo:', user.is_active);
        
        if (!user.is_verified) {
            console.log('\n🔧 Marcando usuario como verificado...');
            
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { 
                    is_verified: true,
                    is_active: true
                }
            });
            
            console.log('✅ Usuario INSPECTOR verificado exitosamente');
            console.log('   Verificado:', updatedUser.is_verified);
        } else {
            console.log('ℹ️  Usuario ya está verificado');
        }
        
        console.log('\n🎯 USUARIO INSPECTOR LISTO PARA LOGIN');
        console.log('💡 Ahora ejecuta: node test-inspector-complete.js');
        
    } catch (error) {
        console.error('❌ Error verificando usuario:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    verifyInspectorUser();
}

module.exports = { verifyInspectorUser };