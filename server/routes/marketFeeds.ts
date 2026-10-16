import { Router, Request, Response } from 'express';
import { dbManager } from '../db/database';

export const marketFeedsRouter = Router();

// GET /api/market-feeds - Retrieve all market rate and index feeds
marketFeedsRouter.get('/', (req: Request, res: Response) => {
  try {
    const feeds = dbManager.query('SELECT * FROM market_feeds ORDER BY name ASC');
    res.json({
      success: true,
      count: feeds.length,
      data: feeds.map((f) => ({
        key: f.feed_key,
        name: f.name,
        value: f.value,
        unit: f.unit,
        source: f.source,
        lastUpdated: f.last_updated,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/market-feeds/:key - Update a specific market price or index
marketFeedsRouter.put('/:key', (req: Request, res: Response) => {
  try {
    const { value } = req.body;
    if (typeof value !== 'number') {
      return res.status(400).json({ success: false, error: 'value must be a numeric number' });
    }

    dbManager.run(
      'UPDATE market_feeds SET value = ?, last_updated = datetime("now") WHERE feed_key = ?',
      [value, req.params.key]
    );

    // Audit log
    dbManager.run(
      'INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)',
      ['MARKET_FEED_UPDATE', 'FEED', req.params.key, JSON.stringify({ newValue: value })]
    );

    res.json({ success: true, message: `Market feed ${req.params.key} updated to ${value}` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
