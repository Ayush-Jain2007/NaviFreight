import { Router, Request, Response } from 'express';
import { dbManager } from '../db/database';

export const vesselsRouter = Router();

// GET /api/vessels - List all bulk carrier fleet vessels
vesselsRouter.get('/', (req: Request, res: Response) => {
  try {
    const vesselClass = req.query.class as string;
    let query = 'SELECT * FROM vessels';
    const params: any[] = [];

    if (vesselClass) {
      query += ' WHERE vessel_class = ?';
      params.push(vesselClass);
    }
    query += ' ORDER BY dwt DESC';

    const rawVessels = dbManager.query(query, params);
    const vessels = rawVessels.map((v) => ({
      id: v.id,
      name: v.name,
      vesselClass: v.vessel_class,
      dwt: v.dwt,
      draftMeters: v.draft_meters,
      loaMeters: v.loa_meters,
      beamMeters: v.beam_meters,
      yearBuilt: v.year_built,
      flag: v.flag,
      currentLocation: v.current_location,
      speedKnots: v.speed_knots,
      bunkerConsumptionSeaTPD: v.bunker_consumption_sea_tpd,
      bunkerConsumptionPortTPD: v.bunker_consumption_port_tpd,
      dailyHireRateUSD: v.daily_hire_rate_usd,
      gearDescription: v.gear_description,
      suitabilityScoreDefault: v.suitability_score_default,
      availableFrom: v.available_from,
      availableTo: v.available_to,
    }));

    res.json({ success: true, count: vessels.length, data: vessels });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vessels/:id - Retrieve specific vessel technical specification
vesselsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const v = dbManager.get('SELECT * FROM vessels WHERE id = ?', [req.params.id]);
    if (!v) {
      return res.status(404).json({ success: false, error: 'Vessel not found' });
    }

    res.json({
      success: true,
      data: {
        id: v.id,
        name: v.name,
        vesselClass: v.vessel_class,
        dwt: v.dwt,
        draftMeters: v.draft_meters,
        loaMeters: v.loa_meters,
        beamMeters: v.beam_meters,
        yearBuilt: v.year_built,
        flag: v.flag,
        currentLocation: v.current_location,
        speedKnots: v.speed_knots,
        bunkerConsumptionSeaTPD: v.bunker_consumption_sea_tpd,
        bunkerConsumptionPortTPD: v.bunker_consumption_port_tpd,
        dailyHireRateUSD: v.daily_hire_rate_usd,
        gearDescription: v.gear_description,
        suitabilityScoreDefault: v.suitability_score_default,
        availableFrom: v.available_from,
        availableTo: v.available_to,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
