// Cargar variables de entorno desde .env
import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import protectedRoutes from './routes/protected';
import studentsRoutes from './routes/students';
import tasksRoutes from './routes/tasks';

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/tasks', tasksRoutes);

// Add a test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is working!', timestamp: new Date().toISOString() });
});

// Add a route to list all available routes
app.get('/api/routes', (req, res) => {
  const routes: string[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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