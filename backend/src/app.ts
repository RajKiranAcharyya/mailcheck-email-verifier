import express, { Express } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import verifyRoutes from './routes/verify.routes';
import jobRoutes from './routes/job.routes';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './swagger/swagger';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Swagger Documentation
  setupSwagger(app);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'mailcheck-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Apply Rate Limiter to API endpoints (bypass during automated unit tests)
  if (process.env.NODE_ENV !== 'test') {
    app.use('/api', apiRateLimiter);
  }

  // API Routes
  app.use('/api/verify', verifyRoutes);
  app.use('/api/jobs', jobRoutes);

  // Serve unified static frontend if bundled (Docker all-in-one mode)
  const publicCandidates = [
    path.resolve(__dirname, '../public'),
    path.resolve(process.cwd(), 'public'),
  ];
  const publicDir = publicCandidates.find((dir) => fs.existsSync(path.join(dir, 'index.html')));
  if (publicDir) {
    app.use(express.static(publicDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
      }
      return res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint '${req.method} ${req.path}' not found`,
      },
    });
  });

  // Structured Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp();
