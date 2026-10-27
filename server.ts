import express from 'express';
import path from 'path';
import { CONFIG } from './server/config';
import authRoutes from './server/routes/auth';
import publicRoutes from './server/routes/public';
import adminRoutes from './server/routes/admin';

async function startServer() {
  const app = express();

  // Basic security and parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', CONFIG.CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.redirect('/api/public/health');
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/admin', adminRoutes);

  // Global API Error Handler
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected internal error occurred.',
      },
    });
  });

  // Frontend Integration
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Dynamic import vite in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`[Wanderer's Journeys] Server listening on http://0.0.0.0:${CONFIG.PORT} in ${CONFIG.NODE_ENV} mode`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
