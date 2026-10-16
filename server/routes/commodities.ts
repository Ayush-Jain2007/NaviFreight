import { Router, Request, Response } from 'express';
import { dbManager } from '../db/database';

export const commoditiesRouter = Router();

// GET /api/commodities - List all bulk commodity profiles
commoditiesRouter.get('/', (req: Request, res: Response) => {
  try {
    const rawCommodities = dbManager.query('SELECT * FROM commodities ORDER BY name ASC');
    const commodities = rawCommodities.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      defaultParcelSizeMT: c.default_parcel_size_mt,
      densityTonsM3: c.density_tons_m3,
      stowageFactor: c.stowage_factor,
      description: c.description,
    }));

    res.json({ success: true, count: commodities.length, data: commodities });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
