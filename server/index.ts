import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbManager } from './db/database';
import { portsRouter } from './routes/ports';
import { vesselsRouter } from './routes/vessels';
import { commoditiesRouter } from './routes/commodities';
import { forecastRouter } from './routes/forecast';
import { charteringRouter } from './routes/chartering';
import { simulationsRouter } from './routes/simulations';
import { routesRouter } from './routes/routes';
import { reportsRouter } from './routes/reports';
import { marketFeedsRouter } from './routes/marketFeeds';
import { safetyRouter } from './routes/safety';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[${req.method}] ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'NaviFreight Maritime Intelligence Backend',
    database: 'SQLite (Node.js v24 native DatabaseSync)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting
app.use('/api/ports', portsRouter);
app.use('/api/vessels', vesselsRouter);
app.use('/api/commodities', commoditiesRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/chartering', charteringRouter);
app.use('/api/simulations', simulationsRouter);
app.use('/api/routes', routesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/market-feeds', marketFeedsRouter);
app.use('/api/safety', safetyRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚓ NaviFreight Maritime Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

export default app;
