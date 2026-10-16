import { Router, Request, Response } from 'express';
import { dbManager } from '../db/database';

export const reportsRouter = Router();

// GET /api/reports - List decision briefs & audit reports
reportsRouter.get('/', (req: Request, res: Response) => {
  try {
    const reports = dbManager.query('SELECT * FROM decision_briefs ORDER BY generated_at DESC');
    res.json({
      success: true,
      count: reports.length,
      data: reports.map((r) => ({
        id: r.id,
        title: r.title,
        simulationId: r.simulation_id,
        routeDescription: r.route_description,
        optimalVesselName: r.optimal_vessel_name,
        cargoQuantityMT: r.cargo_quantity_mt,
        freightRatePerTon: r.freight_rate_per_ton,
        totalCostUSD: r.total_cost_usd,
        riskLevel: r.risk_level,
        keyFindings: r.key_findings,
        mopswBenchmarkCompliance: r.mopsw_benchmark_compliance,
        status: r.status,
        generatedAt: r.generated_at,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/reports/generate - Generate & save a formal procurement brief
reportsRouter.post('/generate', (req: Request, res: Response) => {
  try {
    const {
      title,
      simulationId,
      routeDescription,
      optimalVesselName,
      cargoQuantityMT,
      freightRatePerTon,
      totalCostUSD,
      riskLevel = 'Low',
      keyFindings,
      mopswBenchmarkCompliance = 'Verified within MoPSW turnaround & draft limits',
    } = req.body;

    const reportId = `BRF-${Date.now()}`;

    dbManager.run(
      `INSERT INTO decision_briefs (
        id, title, simulation_id, route_description, optimal_vessel_name,
        cargo_quantity_mt, freight_rate_per_ton, total_cost_usd, risk_level,
        key_findings, mopsw_benchmark_compliance, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        title || 'Procurement Optimization Brief',
        simulationId || 'SIM-CUSTOM',
        routeDescription || 'Pilbara to India East Coast',
        optimalVesselName || 'MV Blue Horizon',
        cargoQuantityMT || 150000,
        freightRatePerTon || 25.4,
        totalCostUSD || 3810000,
        riskLevel,
        keyFindings || 'Optimal charter selection confirmed.',
        mopswBenchmarkCompliance,
        'Approved',
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: reportId,
        title,
        status: 'Approved',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
