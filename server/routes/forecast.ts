import { Router, Request, Response } from 'express';
import { calculateFreightForecast, ForecastRequest } from '../services/freightEngine';
import { generateMaritimeInsight } from '../services/geminiIntelligence';
import { dbManager } from '../db/database';

export const forecastRouter = Router();

// POST /api/forecast/calculate - Calculate forward freight curve with confidence intervals
forecastRouter.post('/calculate', (req: Request, res: Response) => {
  try {
    const {
      originPortId = 'port_hedland',
      destPortId = 'paradip',
      commodityId = 'iron_ore',
      vesselClass = 'Panamax',
      horizonDays = 60,
      bunkerPricePerMT = 624,
      marketVolatilityShock = 0,
    } = req.body;

    const forecastResult = calculateFreightForecast({
      originPortId,
      destPortId,
      commodityId,
      vesselClass,
      horizonDays,
      bunkerPricePerMT,
      marketVolatilityShock,
    });

    res.json({ success: true, data: forecastResult });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/forecast/history - Retrieve historical freight benchmarks
forecastRouter.get('/history', (req: Request, res: Response) => {
  try {
    const rows = dbManager.query('SELECT * FROM historical_rates ORDER BY id ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/forecast/ai-insight - Generate executive maritime analysis with Gemini AI
forecastRouter.post('/ai-insight', async (req: Request, res: Response) => {
  try {
    const {
      originPort = 'Port Hedland (Australia)',
      destPort = 'Paradip Port (India)',
      commodity = 'Iron Ore',
      cargoQuantityMT = 150000,
      currentRateUSD = 25.4,
      projectedRateUSD = 28.5,
      horizonDays = 60,
      bunkerPriceUSD = 624,
      congestionDays = 1.5,
    } = req.body;

    const insight = await generateMaritimeInsight({
      originPort,
      destPort,
      commodity,
      cargoQuantityMT,
      currentRateUSD,
      projectedRateUSD,
      horizonDays,
      bunkerPriceUSD,
      congestionDays,
    });

    res.json({ success: true, data: insight });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
