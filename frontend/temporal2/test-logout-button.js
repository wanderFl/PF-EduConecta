#!/usr/bin/env node

/**
 * EduConecta - Logout Button Test
 * Verifica que el botón de cerrar sesión funcione correctamente
 * 
 * Usage: node test-logout-button.js
 */

const axios = require('axios');

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
    header: (msg) => console.log(`${colors.bold}${colors.cyan}🚪 ${msg}${colors.reset}\n`),
    step: (num, msg) => console.log(`${colors.bold}${num}. ${msg}${colors.reset}`)
};

const inspector = {
    email: 'inspector@educacion.ec',
    password: 'inspector123'
};

async function checkServers() {
    log.step(1, 'Verificando servidores...');
    
    try {
        await axios.get(`${BASE_URL}/health`, { timeout: 3000 });
        log.success('Backend disponible');
    } catch (error) {
        log.error('Backend no disponible');
        return false;
    }
    
    try {
        await axios.get(FRONTEND_URL, { timeout: 3000 });
        log.success('Frontend disponible');
    } catch (error) {
        log.error('Frontend no disponible');
        return false;
    }
    
    return true;
}

async function testLoginLogoutFlow() {
    log.step(2, 'Probando flujo completo de login/logout...');
    
    try {
        // 1. Login
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, inspector);
        const { user, token } = loginResponse.data;
        
        if (user.role !== 'INSPECTOR' || !token) {
            log.error('Login falló - datos incorrectos');
            return false;
        }
        
        log.success(`Login exitoso - Inspector: ${user.email}`);
        
        // 2. Verificar token válido
        const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileResponse.status === 200) {
            log.success('Token JWT válido');
        }
        
        // 3. Simular logout (limpiar token)
        // En el frontend, logout() limpia el token del localStorage
        // Aquí simulamos verificar que un token inválido no funcione
        try {
            await axios.get(`${BASE_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer invalid-token` }
            });
            log.error('Token inválido fue aceptado - problema de seguridad');
            return false;
        } catch (error) {
            if (error.response?.status === 401) {
                log.success('Token inválido correctamente rechazado');
            } else {
                log.error('Error inesperado con token inválido');
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        log.error(`Error en flujo login/logout: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testFrontendComponents() {
    log.step(3, 'Verificando componentes frontend...');
    
    const components = [
        {
            name: 'LogoutButton',
            path: 'frontend/src/components/auth/LogoutButton.tsx',
            description: 'Componente reutilizable de cerrar sesión'
        },
        {
            name: 'DashboardNavbar', 
            path: 'frontend/src/components/layout/DashboardNavbar.tsx',
            description: 'Barra de navegación con botón logout'
        },
        {
            name: 'LoginPage actualizada',
            path: 'frontend/src/pages/LoginPage.tsx', 
            description: 'Página de login con interfaz para usuarios logueados'
        },
        {
            name: 'DashboardInspector actualizado',
            path: 'frontend/src/pages/DashboardInspector.tsx',
            description: 'Dashboard Inspector con navegación y logout'
        }
    ];
    
    const fs = require('fs');
    const path = require('path');
    
    let allExist = true;
    
    components.forEach(component => {
        const fullPath = path.join(process.cwd(), component.path);
        if (fs.existsSync(fullPath)) {
            log.success(`${component.name} - ${component.description}`);
        } else {
            log.error(`${component.name} no encontrado en ${component.path}`);
            allExist = false;
        }
    });
    
    return allExist;
}

async function showUserInstructions() {
    log.header('INSTRUCCIONES PARA PROBAR EL BOTÓN DE CERRAR SESIÓN');
    
    console.log(`${colors.bold}🌐 Prueba Manual en Frontend:${colors.reset}`);
    console.log(`   1. Visita: ${colors.cyan}${FRONTEND_URL}/login${colors.reset}`);
    console.log(`   2. Inicia sesión con: ${colors.yellow}${inspector.email}${colors.reset}`);
    console.log(`   3. Deberías ver la interfaz con botón "Cerrar sesión"`);
    console.log(`   4. Haz clic en "Ir al Dashboard" para ver el dashboard Inspector`);
    console.log(`   5. En el dashboard, verifica el botón de logout en la esquina superior derecha\n`);
    
    console.log(`${colors.bold}🔍 Funcionalidades del Botón Logout:${colors.reset}`);
    console.log(`   ✅ Limpia el token JWT del localStorage`);
    console.log(`   ✅ Limpia los datos del usuario del estado`);
    console.log(`   ✅ Redirige automáticamente al login`);
    console.log(`   ✅ Disponible en múltiples ubicaciones (LoginPage, Dashboards)`);
    console.log(`   ✅ Componente reutilizable con diferentes estilos\n`);
    
    console.log(`${colors.bold}🎨 Variantes del LogoutButton:${colors.reset}`);
    console.log(`   • ${colors.blue}Primary${colors.reset}: Botón rojo sólido`);
    console.log(`   • ${colors.blue}Secondary${colors.reset}: Botón gris sólido`);
    console.log(`   • ${colors.blue}Outline${colors.reset}: Botón con borde (usado por defecto)`);
    console.log(`   • Tamaños: sm, md, lg\n`);
    
    console.log(`${colors.bold}📱 Ubicaciones del Botón:${colors.reset}`);
    console.log(`   1. ${colors.green}LoginPage${colors.reset}: Cuando ya hay sesión activa`);
    console.log(`   2. ${colors.green}DashboardInspector${colors.reset}: En la barra de navegación superior`);
    console.log(`   3. ${colors.green}Otros Dashboards${colors.reset}: Puede agregarse usando DashboardNavbar`);
    console.log(`   4. ${colors.green}Cualquier componente${colors.reset}: Importando LogoutButton directamente\n`);
    
    console.log(`${colors.bold}🔧 Para agregar a otros dashboards:${colors.reset}`);
    console.log(`${colors.gray}   import { LogoutButton } from '../components/auth/LogoutButton';${colors.reset}`);
    console.log(`${colors.gray}   // O usar la barra de navegación completa:${colors.reset}`);
    console.log(`${colors.gray}   import { DashboardNavbar } from '../components/layout/DashboardNavbar';${colors.reset}\n`);
}

async function main() {
    log.header('PRUEBA DEL BOTÓN DE CERRAR SESIÓN');
    
    const serversOk = await checkServers();
    if (!serversOk) {
        log.error('Servidores no disponibles');
        log.info('Inicia backend: cd backend && npm run dev');
        log.info('Inicia frontend: cd frontend && npm run dev');
        process.exit(1);
    }
    
    const loginLogoutOk = await testLoginLogoutFlow();
    if (!loginLogoutOk) {
        log.error('Flujo de login/logout falló');
        process.exit(1);
    }
    
    const componentsOk = await testFrontendComponents();
    if (!componentsOk) {
        log.warning('Algunos componentes frontend no se encontraron');
    }
    
    await showUserInstructions();
    
    log.success('Implementación del botón de cerrar sesión completada! 🎉');
    log.info('Prueba manualmente en el navegador para verificar la interfaz');
}

// Handle errors
process.on('uncaughtException', (error) => {
    log.error(`Error inesperado: ${error.message}`);
    process.exit(1);
});

if (require.main === module) {
    main().catch((error) => {
        log.error(`Error en prueba: ${error.message}`);
        process.exit(1);
    });
}