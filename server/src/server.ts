import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
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
app.use(express.json({ limit: '10mb' }));
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

// Mount Routes
app.use('/api', routes);

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
