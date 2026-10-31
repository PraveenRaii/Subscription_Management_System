import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initBillingScheduler } from './services/billingScheduler.js';
import { swaggerRouter } from './docs/swaggerDocs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buffer) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Interactive API Documentation (Swagger / OpenAPI Explorer)
app.use('/api/docs', swaggerRouter);

// Apply rate limiting to all standard API routes
app.use('/api', apiLimiter);

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    name: 'Billflow 2.0 API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    theme: 'orange',
  });
});

// Mount API Routes
app.use('/api', routes);

// Serve Frontend Static Files in Production (Full-Stack Render Deploy)
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
const altClientDistPath = path.resolve(process.cwd(), 'client/dist');
const activeDist = fs.existsSync(clientDistPath)
  ? clientDistPath
  : fs.existsSync(altClientDistPath)
  ? altClientDistPath
  : null;

if (activeDist) {
  app.use(express.static(activeDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(activeDist, 'index.html'));
  });
}

// Error Handling Middleware
app.use(errorHandler);

// Start Server
async function startServer() {
  await connectDB();
  initBillingScheduler();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Billflow 2.0 Backend Server Running on Port ${PORT}`);
    console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🎨 UI Accent: Orange (#f97316)`);
    console.log(`======================================================\n`);
  });
}

startServer();
