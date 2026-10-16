import { Router, Request, Response } from 'express';
import { evaluateFleet, evaluateVessel, VesselData, PortData } from '../services/charteringEngine';
import { dbManager } from '../db/database';
import { getRouteDistance } from '../services/freightEngine';

export const charteringRouter = Router();

// POST /api/chartering/evaluate - Evaluate full fleet or specific vessel against port constraints
charteringRouter.post('/evaluate', (req: Request, res: Response) => {
  try {
    const {
      originPortId = 'port_hedland',
      destPortId = 'paradip',
      commodityId = 'iron_ore',
      cargoQuantityMT = 150000,
      bunkerPriceUSD = 624,
      congestionDays = 1.5,
      marketVolatilityShock = 0,
    } = req.body;

    const evaluation = evaluateFleet({
      originPortId,
      destPortId,
      commodityId,
      cargoQuantityMT,
      bunkerPriceUSD,
      congestionDays,
      marketVolatilityShock,
    });

    res.json({ success: true, data: evaluation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/chartering/compare - Side-by-side comparison of specific vessel IDs
charteringRouter.post('/compare', (req: Request, res: Response) => {
  try {
    const {
      vesselIds,
      destPortId = 'paradip',
      originPortId = 'port_hedland',
      cargoQuantityMT = 150000,
      bunkerPriceUSD = 624,
      congestionDays = 1.5,
    } = req.body;

    if (!Array.isArray(vesselIds) || vesselIds.length === 0) {
      return res.status(400).json({ success: false, error: 'vesselIds must be a non-empty array' });
    }

    const port = dbManager.get<PortData>('SELECT * FROM ports WHERE id = ?', [destPortId]) ||
      dbManager.get<PortData>('SELECT * FROM ports LIMIT 1')!;
    const distanceNM = getRouteDistance(originPortId, destPortId);

    const evaluations = vesselIds.map((id: string) => {
      const vessel = dbManager.get<VesselData>('SELECT * FROM vessels WHERE id = ?', [id]);
      if (!vessel) return null;
      return evaluateVessel(vessel, port, cargoQuantityMT, distanceNM, bunkerPriceUSD, congestionDays, 0);
    }).filter(Boolean);

    res.json({ success: true, data: { port, comparisons: evaluations } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
