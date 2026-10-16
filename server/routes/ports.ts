import { Router, Request, Response } from 'express';
import { dbManager } from '../db/database';

export const portsRouter = Router();

// GET /api/ports - List all ports (optionally filter by Indian East Coast)
portsRouter.get('/', (req: Request, res: Response) => {
  try {
    const isEastCoast = req.query.eastCoast === 'true';
    let query = 'SELECT * FROM ports';
    const params: any[] = [];

    if (isEastCoast) {
      query += ' WHERE is_indian_east_coast = 1';
    }
    query += ' ORDER BY is_indian_east_coast DESC, name ASC';

    const rawPorts = dbManager.query(query, params);
    const ports = rawPorts.map((p) => ({
      id: p.id,
      name: p.name,
      country: p.country,
      region: p.region,
      isIndianEastCoast: Boolean(p.is_indian_east_coast),
      maxDraftMeters: p.max_draft_meters,
      maxLOAMeters: p.max_loa_meters,
      maxBeamMeters: p.max_beam_meters,
      handlingRateTPD: p.handling_rate_tpd,
      averageTurnaroundHours: p.average_turnaround_hours,
      berthCount: p.berth_count,
      congestionStatus: p.congestion_status,
      latitude: p.latitude,
      longitude: p.longitude,
      keyCommodities: typeof p.key_commodities === 'string' ? JSON.parse(p.key_commodities) : p.key_commodities,
      notes: p.notes,
    }));

    res.json({ success: true, count: ports.length, data: ports });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ports/:id - Retrieve specific port specifications
portsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const port = dbManager.get('SELECT * FROM ports WHERE id = ?', [req.params.id]);
    if (!port) {
      return res.status(404).json({ success: false, error: 'Port not found' });
    }

    res.json({
      success: true,
      data: {
        id: port.id,
        name: port.name,
        country: port.country,
        region: port.region,
        isIndianEastCoast: Boolean(port.is_indian_east_coast),
        maxDraftMeters: port.max_draft_meters,
        maxLOAMeters: port.max_loa_meters,
        maxBeamMeters: port.max_beam_meters,
        handlingRateTPD: port.handling_rate_tpd,
        averageTurnaroundHours: port.average_turnaround_hours,
        berthCount: port.berth_count,
        congestionStatus: port.congestion_status,
        latitude: port.latitude,
        longitude: port.longitude,
        keyCommodities: typeof port.key_commodities === 'string' ? JSON.parse(port.key_commodities) : port.key_commodities,
        notes: port.notes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/ports/:id/congestion - Update live congestion status
portsRouter.patch('/:id/congestion', (req: Request, res: Response) => {
  try {
    const { status, turnaroundHours } = req.body;
    if (!['Low', 'Normal', 'Elevated', 'Congested'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid congestion status' });
    }

    let query = 'UPDATE ports SET congestion_status = ?';
    const params: any[] = [status];

    if (turnaroundHours !== undefined) {
      query += ', average_turnaround_hours = ?';
      params.push(turnaroundHours);
    }

    query += ', updated_at = datetime("now") WHERE id = ?';
    params.push(req.params.id);

    dbManager.run(query, params);

    // Audit log
    dbManager.run(
      'INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)',
      ['PORT_CONGESTION_UPDATE', 'PORT', req.params.id, JSON.stringify({ status, turnaroundHours })]
    );

    res.json({ success: true, message: 'Port operational status updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
