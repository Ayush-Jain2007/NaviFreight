import { Router, Request, Response } from 'express';
import { dbManager } from '../db/database';

export const routesRouter = Router();

// GET /api/routes - Maritime corridors and navigational chokepoints
routesRouter.get('/', (req: Request, res: Response) => {
  try {
    const corridors = [
      {
        id: 'pilbara_paradip',
        name: 'Australia (Pilbara) to Paradip / Odisha Corridor',
        originPort: 'Port Hedland',
        destPort: 'Paradip Port',
        nauticalMiles: 3840,
        primaryPassage: 'Lombok Strait -> Six Degree Channel',
        chokepoints: ['Lombok Strait', 'Six Degree Channel'],
        recommendedVesselClass: 'Panamax / Capesize (via Lombok)',
        weatherProfile: 'Cyclone season Nov-Apr in NW Australia; SW Monsoon Jun-Sep in Bay of Bengal',
      },
      {
        id: 'newcastle_vizag',
        name: 'Newcastle to Visakhapatnam Outer Harbour Corridor',
        originPort: 'Newcastle Port',
        destPort: 'Visakhapatnam (Outer Harbour)',
        nauticalMiles: 5210,
        primaryPassage: 'Bass Strait / Torres or Lombok Strait',
        chokepoints: ['Lombok Strait', 'Bay of Bengal Deep Water Entry'],
        recommendedVesselClass: 'Capesize (up to 200,000 DWT)',
        weatherProfile: 'Southern Ocean swells; high deepwater under-keel clearance',
      },
      {
        id: 'haldia_riverine',
        name: 'Sunda Strait to Haldia Dock Riverine Corridor',
        originPort: 'Port Hedland / Newcastle',
        destPort: 'Haldia Dock Complex',
        nauticalMiles: 4050,
        primaryPassage: 'Sunda Strait -> Sandheads Pilotage Station',
        chokepoints: ['Sandheads River Bar (Draft 8.5m max)', 'Auckland Channel'],
        recommendedVesselClass: 'Handysize / Supramax only (Draft-restricted)',
        weatherProfile: 'Tidal bore and river sedimentation constraints require strict pilot coordination',
      },
    ];

    res.json({ success: true, count: corridors.length, data: corridors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/routes/telemetry - Live AIS fleet tracking telemetry
routesRouter.get('/telemetry', (req: Request, res: Response) => {
  try {
    const shipments = dbManager.query('SELECT * FROM shipments ORDER BY arrival_date ASC');
    res.json({
      success: true,
      count: shipments.length,
      data: shipments.map((s) => ({
        id: s.id,
        commodity: s.commodity,
        quantityMT: s.quantity_mt,
        originPort: s.origin_port,
        destinationPort: s.destination_port,
        vesselName: s.vessel_name,
        vesselClass: s.vessel_class,
        speedKnots: s.speed_knots,
        courseDegrees: s.course_degrees,
        transitCorridor: s.transit_corridor,
        arrivalDate: s.arrival_date,
        freightRateUSD: s.freight_rate_usd,
        status: s.status,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
