import { Router, Request, Response } from 'express';
import { dbManager } from '../db/database';
import { saveSimulation, runStressTest, CreateSimulationInput } from '../services/simulationService';

export const simulationsRouter = Router();

// GET /api/simulations - List saved simulations
simulationsRouter.get('/', (req: Request, res: Response) => {
  try {
    const simulations = dbManager.query('SELECT * FROM simulations ORDER BY created_at DESC');
    res.json({ success: true, count: simulations.length, data: simulations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/simulations - Save a new simulation
simulationsRouter.post('/', (req: Request, res: Response) => {
  try {
    const input: CreateSimulationInput = {
      name: req.body.name || `Simulation ${new Date().toLocaleDateString('en-GB')}`,
      originPortId: req.body.originPortId || 'port_hedland',
      destPortId: req.body.destPortId || 'paradip',
      commodityId: req.body.commodityId || 'iron_ore',
      cargoQuantityMT: Number(req.body.cargoQuantityMT) || 150000,
      targetArrivalDate: req.body.targetArrivalDate || '18 Mar 2026',
      horizonDays: Number(req.body.horizonDays) || 60,
      bunkerPricePerMT: Number(req.body.bunkerPricePerMT) || 624,
      portCongestionDays: Number(req.body.portCongestionDays) || 1.5,
      marketVolatilityShock: Number(req.body.marketVolatilityShock) || 0,
    };

    const saved = saveSimulation(input);
    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/simulations/stress-test - Run scenario optimizer stress tests
simulationsRouter.post('/stress-test', (req: Request, res: Response) => {
  try {
    const {
      baselineParams,
      stressedBunkerPrice = 624,
      stressedCongestionDays = 1.5,
      stressedVolatilityShock = 0,
      weatherDelayDays = 0,
    } = req.body;

    if (!baselineParams) {
      return res.status(400).json({ success: false, error: 'baselineParams is required' });
    }

    const result = runStressTest({
      baselineParams,
      stressedBunkerPrice,
      stressedCongestionDays,
      stressedVolatilityShock,
      weatherDelayDays,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/simulations/:id - Delete a saved simulation
simulationsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    dbManager.run('DELETE FROM simulations WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Simulation deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
