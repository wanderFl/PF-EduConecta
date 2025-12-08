const { PrismaClient } = require('./backend/generated/prisma');

async function checkUsers() {
    const prisma = new PrismaClient();
    
    try {
        console.log('Verificando usuarios docentes...');
        const docentes = await prisma.user.findMany({ 
            where: { role: 'DOCENTE' },
            select: {
                email: true,
                external_id: true,
                is_active: true
            }
        });
        
        console.log('Docentes encontrados:');
        docentes.forEach(docente => {
            console.log(`- Email: ${docente.email}, External ID: ${docente.external_id}, Activo: ${docente.is_active}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();