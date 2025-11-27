"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Cargar variables de entorno desde .env
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const protected_1 = __importDefault(require("./routes/protected"));
const students_1 = __importDefault(require("./routes/students"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const disciplinaryReports_1 = __importDefault(require("./routes/disciplinaryReports"));
const communications_1 = __importDefault(require("./routes/communications"));
const teachers_1 = __importDefault(require("./routes/teachers"));
const uploads_1 = __importDefault(require("./routes/uploads"));
// Validate required environment variables
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// TEMP: Debug routes ANTES de las rutas protegidas
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend server is working!', timestamp: new Date().toISOString() });
});
app.get('/api/communications-status', (req, res) => {
    res.json({
        status: 'Communications routes are registered',
        requiresAuth: true,
        endpoints: [
            'GET /api/communications/teacher (requires DOCENTE token)',
            'POST /api/communications/teacher',
            'GET /api/communications/teacher/students',
            'GET /api/communications/conversation/:id/messages',
            'POST /api/communications/conversation/:id/messages',
            'PUT /api/communications/conversation/:id/archive'
        ],
        timestamp: new Date().toISOString()
    });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/protected', protected_1.default);
app.use('/api/students', students_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/attendance', attendance_1.default);
app.use('/api/disciplinary-reports', disciplinaryReports_1.default);
app.use('/api/communications', communications_1.default);
app.use('/api/teachers', teachers_1.default);
app.use('/api/uploads', uploads_1.default);
// Add a route to list all available routes
app.get('/api/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push(`${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
        }
        else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    const baseRoute = middleware.regexp.source.replace('\\/?', '').replace(/\$$/, '');
                    const fullPath = `${baseRoute}${handler.route.path}`;
                    routes.push(`${Object.keys(handler.route.methods)[0].toUpperCase()} ${fullPath}`);
                }
            });
        }
    });
    res.json({ routes, total: routes.length });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something broke!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Default to 3000 to match frontend dev defaults and compiled/dist behavior
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
