#!/usr/bin/env node

/**
 * EduConecta - Inspector Role Post-Implementation Setup
 * Configures and validates the Inspector role implementation
 * 
 * Usage:
 *   node setup-inspector.js
 *   node setup-inspector.js --create-user
 *   node setup-inspector.js --validate-only
 */

const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5174';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    header: (msg) => console.log(`${colors.bold}${colors.cyan}🔍 ${msg}${colors.reset}\n`),
    step: (num, msg) => console.log(`${colors.bold}${num}. ${msg}${colors.reset}`)
};

// Configuration
const config = {
    inspector: {
        email: 'inspector@educacion.ec',
        password: 'inspector123',
        role: 'INSPECTOR'
    }
};

async function checkServerStatus() {
    log.step(1, 'Verificando estado del servidor backend...');
    
    try {
        const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
        log.success('Servidor backend está corriendo');
        return true;
    } catch (error) {
        log.error('Servidor backend no está disponible');
        log.info('Ejecuta: cd backend && npm run dev');
        return false;
    }
}

async function checkFrontendStatus() {
    log.step(2, 'Verificando estado del servidor frontend...');
    
    try {
        const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
        log.success('Servidor frontend está corriendo');
        return true;
    } catch (error) {
        log.error('Servidor frontend no está disponible');
        log.info('Ejecuta: cd frontend && npm run dev');
        return false;
    }
}

async function validateInspectorRole() {
    log.step(3, 'Validando enum Role en Prisma...');
    
    // Check if we can create a test user with INSPECTOR role
    try {
        const testUser = {
            email: `test-inspector-${Date.now()}@test.com`,
            password: 'testpass',
            role: 'INSPECTOR'
        };
        
        const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
        
        if (response.data.user && response.data.user.role === 'INSPECTOR') {
            log.success('Enum Role incluye INSPECTOR correctamente');
            
            // Cleanup test user by trying to login and then we can delete later
            try {
                await axios.post(`${BASE_URL}/api/auth/login`, {
                    email: testUser.email,
                    password: testUser.password
                });
                log.success('Login con rol INSPECTOR funcional');
            } catch (loginError) {
                log.error('Error en login con rol INSPECTOR');
                return false;
            }
            
            return true;
        } else {
            log.error('Respuesta no incluye rol INSPECTOR correctamente');
            return false;
        }
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('role')) {
            log.error('Enum Role no incluye INSPECTOR - verifica backend/prisma/schema.prisma');
        } else {
            log.error(`Error validando rol INSPECTOR: ${error.message}`);
        }
        return false;
    }
}

async function createInspectorUser() {
    log.step(4, 'Creando usuario Inspector principal...');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, config.inspector);
        
        if (response.data.user && response.data.user.role === 'INSPECTOR') {
            log.success(`Usuario Inspector creado: ${config.inspector.email}`);
            log.info(`Credenciales: ${config.inspector.email} / ${config.inspector.password}`);
            return true;
        } else {
            log.error('Error en la respuesta del registro');
            return false;
        }
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
            log.warning(`Usuario ${config.inspector.email} ya existe`);
            return true; // Not an error, user exists
        } else {
            log.error(`Error creando usuario Inspector: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }
}

async function testInspectorLogin() {
    log.step(5, 'Probando login del Inspector...');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: config.inspector.email,
            password: config.inspector.password
        });
        
        const { user, token } = response.data;
        
        if (user.role === 'INSPECTOR' && token) {
            log.success('Login exitoso - Token JWT generado');
            log.success(`Usuario ID: ${user.id}`);
            log.success(`Email: ${user.email}`);
            log.success(`Role: ${user.role}`);
            
            // Test protected endpoint
            try {
                const protectedResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                log.success('Acceso a endpoints protegidos funcional');
                return { user, token };
            } catch (protectedError) {
                log.warning('Token válido pero endpoints protegidos podrían tener problemas');
                return { user, token };
            }
        } else {
            log.error('Login exitoso pero datos incorrectos');
            return null;
        }
    } catch (error) {
        log.error(`Error en login: ${error.response?.data?.message || error.message}`);
        return null;
    }
}

async function testFrontendIntegration() {
    log.step(6, 'Verificando integración frontend...');
    
    const frontendChecks = [
        {
            file: 'frontend/src/types/index.ts',
            check: 'Tipos TypeScript incluyen INSPECTOR',
            expected: 'Role type con INSPECTOR'
        },
        {
            file: 'frontend/src/pages/DashboardInspector.tsx',
            check: 'Dashboard Inspector existe',
            expected: 'Componente DashboardInspector'
        },
        {
            file: 'frontend/src/routes/AppRoutes.tsx',
            check: 'Rutas configuradas para Inspector',
            expected: 'Ruta /inspector protegida'
        }
    ];
    
    log.success('Verificación manual requerida:');
    frontendChecks.forEach((check, index) => {
        log.info(`  ${index + 1}. ${check.check} (${check.file})`);
    });
    
    log.info('\n📱 Para probar frontend completo:');
    log.info(`  1. Visita: ${FRONTEND_URL}/login`);
    log.info(`  2. Usa credenciales: ${config.inspector.email} / ${config.inspector.password}`);
    log.info(`  3. Deberías ser redirigido a: ${FRONTEND_URL}/inspector`);
    
    return true;
}

async function showPostSetupInstructions() {
    log.header('CONFIGURACIÓN COMPLETA - PRÓXIMOS PASOS');
    
    console.log(`${colors.bold}🎯 Usuario Inspector Listo:${colors.reset}`);
    console.log(`   Email: ${colors.cyan}${config.inspector.email}${colors.reset}`);
    console.log(`   Password: ${colors.cyan}${config.inspector.password}${colors.reset}`);
    console.log(`   Role: ${colors.cyan}INSPECTOR${colors.reset}\n`);
    
    console.log(`${colors.bold}🔗 URLs de Acceso:${colors.reset}`);
    console.log(`   Backend API: ${colors.blue}${BASE_URL}${colors.reset}`);
    console.log(`   Frontend App: ${colors.blue}${FRONTEND_URL}${colors.reset}`);
    console.log(`   Prisma Studio: ${colors.blue}http://localhost:5556${colors.reset}\n`);
    
    console.log(`${colors.bold}📋 Pruebas Recomendadas:${colors.reset}`);
    console.log(`   1. ${colors.green}Login Frontend${colors.reset}: Visita ${FRONTEND_URL}/login`);
    console.log(`   2. ${colors.green}API Testing${colors.reset}: Usar Postman o curl`);
    console.log(`   3. ${colors.green}Database View${colors.reset}: Abrir Prisma Studio`);
    console.log(`   4. ${colors.green}Role Testing${colors.reset}: Crear más usuarios Inspector\n`);
    
    console.log(`${colors.bold}🛠️  Comandos Útiles:${colors.reset}`);
    console.log(`   Prisma Studio: ${colors.yellow}cd backend && npx prisma studio${colors.reset}`);
    console.log(`   Ver DB: ${colors.yellow}cd backend && npx prisma db pull${colors.reset}`);
    console.log(`   Testing: ${colors.yellow}node test-inspector-e2e.js${colors.reset}\n`);
    
    console.log(`${colors.bold}📄 Documentación:${colors.reset}`);
    console.log(`   Ver: ${colors.cyan}INSPECTOR_IMPLEMENTATION.md${colors.reset} para detalles completos\n`);
}

async function askUserConfirmation(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(`${colors.yellow}${question} (y/n): ${colors.reset}`, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    const createUser = args.includes('--create-user');
    const validateOnly = args.includes('--validate-only');
    
    log.header('CONFIGURACIÓN POST-IMPLEMENTACIÓN ROL INSPECTOR');
    
    console.log(`${colors.bold}Este script configura y valida la implementación del rol INSPECTOR${colors.reset}\n`);
    
    // Check server status
    const backendOk = await checkServerStatus();
    if (!backendOk) {
        log.error('Backend requerido para continuar');
        process.exit(1);
    }
    
    const frontendOk = await checkFrontendStatus();
    if (!frontendOk) {
        log.warning('Frontend no disponible - solo se validará backend');
    }
    
    // Validate implementation
    const roleValidated = await validateInspectorRole();
    if (!roleValidated) {
        log.error('Validación del rol INSPECTOR falló');
        process.exit(1);
    }
    
    if (validateOnly) {
        log.success('Validación completada exitosamente');
        process.exit(0);
    }
    
    // Create user if requested or ask
    let shouldCreateUser = createUser;
    if (!createUser) {
        shouldCreateUser = await askUserConfirmation('¿Crear usuario Inspector principal?');
    }
    
    let loginData = null;
    if (shouldCreateUser) {
        const userCreated = await createInspectorUser();
        if (userCreated) {
            loginData = await testInspectorLogin();
        }
    } else {
        // Try to login with existing credentials
        loginData = await testInspectorLogin();
    }
    
    if (loginData) {
        if (frontendOk) {
            await testFrontendIntegration();
        }
        await showPostSetupInstructions();
        log.success('Configuración completada exitosamente! 🎉');
    } else {
        log.error('Configuración incompleta - revisa los errores anteriores');
        process.exit(1);
    }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
    log.error(`Error inesperado: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    log.error(`Promise rechazada: ${error.message}`);
    process.exit(1);
});

// Run if called directly
if (require.main === module) {
    main().catch((error) => {
        log.error(`Error en configuración: ${error.message}`);
        process.exit(1);
    });
}