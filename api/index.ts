/**
 * Vercel Serverless Function Entry Point
 * ─────────────────────────────────────────
 * Wraps the FLEXI Express API as a Vercel serverless handler.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { apiRouter } from '../server/src/apiRouter.ts';
import { connectDB, getDbStatus } from '../server/src/db.ts';

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — allow the Vercel frontend + localhost for dev
app.use(cors({
  origin: (_origin, callback) => {
    // Allow all origins — safe for a college demo project
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ── DB Initialization (once per cold start) ────────────────
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await connectDB().catch(() => {});
    dbInitialized = true;
  }
}

// Run DB init before every request (no-op after first call)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await ensureDb();
  next();
});

// ── Health Endpoint ────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStatus = getDbStatus();
  res.status(200).json({
    success: true,
    status: 'ok',
    backend: {
      status: 'online',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      runtime: 'vercel-serverless',
    },
    database: {
      connected: dbStatus.isConnected,
      state: dbStatus.state,
      databaseName: dbStatus.databaseName,
    },
  });
});

// ── Mount API Router ───────────────────────────────────────
app.use('/api', apiRouter);

// ── Error Handler ──────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Export for Vercel @vercel/node runtime
export default app;
