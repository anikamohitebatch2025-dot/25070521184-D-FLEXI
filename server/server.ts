import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/apiRouter.ts';
import { connectDB, getDbStatus, isDbConnected, verifyDatabaseWriteRead } from './src/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 5000;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Establish MongoDB connection first
  console.log('🔄 Initializing FLEXI Gym Management Backend...');
  await connectDB();

  // 2. Security & Parsing middlewares
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. CORS configuration
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
  if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
  }

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman) or matching allowed origins
      if (!origin || allowedOrigins.includes(origin) || !isProduction) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in local/development environments
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // 4. Standalone Health Endpoint (Reports Backend status & MongoDB status separately)
  app.get('/api/health', (_req: Request, res: Response) => {
    const dbStatus = getDbStatus();
    res.status(200).json({
      success: true,
      status: 'ok',
      backend: {
        status: 'online',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
      database: {
        connected: dbStatus.isConnected,
        state: dbStatus.state,
        databaseName: dbStatus.databaseName,
        host: dbStatus.host,
        port: dbStatus.port,
        connectionRequirement: 'Connect MongoDB Compass to mongodb://127.0.0.1:27017/gym_management',
      },
    });
  });

  // Database Write-and-Read verification endpoint
  app.post('/api/health/test-db', async (_req: Request, res: Response) => {
    const testResult = await verifyDatabaseWriteRead();
    res.status(testResult.success ? 200 : 503).json(testResult);
  });

  // 5. Mount REST API Router
  app.use('/api', apiRouter);

  // 6. Production Static Build Serving
  const clientDistPath = path.resolve(__dirname, '../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(clientDistPath, 'index.html'));
    });
    console.log(`📦 Serving production static client build from ${clientDistPath}`);
  } else {
    // Development route helper for root path
    app.get('/', (_req: Request, res: Response) => {
      res.json({
        message: 'FLEXI Gym Management API Server is running.',
        healthCheck: '/api/health',
        documentation: 'See README.md for full endpoint listing.',
        clientUrl: 'http://localhost:3000',
      });
    });
  }

  // 7. Centralized Error Handling Middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  // 8. Start HTTP listener
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FLEXI Backend Server running on http://localhost:${PORT}`);
    console.log(`📡 Health Check endpoint: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Ready to serve requests from Vite React Client`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Port ${PORT} is already in use (EADDRINUSE)!`);
      console.error(`   👉 On macOS: macOS AirPlay Receiver uses port 5000 by default.`);
      console.error(`      To disable it: System Settings > General > AirDrop & AirPlay > Turn OFF "AirPlay Receiver".`);
      console.error(`      OR free the port via terminal: lsof -ti :${PORT} | xargs kill -9`);
      console.error(`   👉 On Windows/Linux: Another node process is already running on port ${PORT}.\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
