import { dbManager } from '../db/database';
import { evaluateFleet } from './charteringEngine';

export interface CreateSimulationInput {
  name: string;
  originPortId: string;
  destPortId: string;
  commodityId: string;
  cargoQuantityMT: number;
  targetArrivalDate: string;
  horizonDays: number;
  bunkerPricePerMT: number;
  portCongestionDays: number;
  marketVolatilityShock: number;
}

export interface StressTestRequest {
  baselineParams: CreateSimulationInput;
  stressedBunkerPrice: number;
  stressedCongestionDays: number;
  stressedVolatilityShock: number;
  weatherDelayDays: number;
}

export interface StressTestComparison {
  baseline: {
    freightRatePerTon: number;
    totalCostUSD: number;
    optimalVesselName: string;
    voyageDays: number;
  };
  stressed: {
    freightRatePerTon: number;
    totalCostUSD: number;
    optimalVesselName: string;
    voyageDays: number;
  };
  deltaCostPerTon: number;
  deltaTotalCostUSD: number;
  riskAssessment: string;
  recommendedMitigation: string;
}

export function saveSimulation(input: CreateSimulationInput): any {
  const simId = `SIM-${Date.now()}`;

  // Evaluate fleet to discover optimal recommendation
  const evaluationResult = evaluateFleet({
    originPortId: input.originPortId,
    destPortId: input.destPortId,
    commodityId: input.commodityId,
    cargoQuantityMT: input.cargoQuantityMT,
    bunkerPriceUSD: input.bunkerPricePerMT,
    congestionDays: input.portCongestionDays,
    marketVolatilityShock: input.marketVolatilityShock,
  });

  const bestMatch = evaluationResult.bestMatch;

  dbManager.run(
    `INSERT INTO simulations (
      id, name, origin_port_id, dest_port_id, commodity_id, cargo_quantity_mt,
      target_arrival_date, horizon_days, bunker_price_per_mt, port_congestion_days,
      market_volatility_shock, recommended_vessel_id, optimal_cost_per_ton, total_cost_usd, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      simId,
      input.name,
      input.originPortId,
      input.destPortId,
      input.commodityId,
      input.cargoQuantityMT,
      input.targetArrivalDate,
      input.horizonDays,
      input.bunkerPricePerMT,
      input.portCongestionDays,
      input.marketVolatilityShock,
      bestMatch.vessel.id,
      bestMatch.estFreightRateUSD,
      bestMatch.costBreakdown.totalCostUSD,
      'Active',
    ]
  );

  return {
    id: simId,
    ...input,
    recommendedVessel: bestMatch.vessel,
    optimalCostPerTon: bestMatch.estFreightRateUSD,
    totalCostUSD: bestMatch.costBreakdown.totalCostUSD,
    evaluation: bestMatch,
  };
}

export function runStressTest(request: StressTestRequest): StressTestComparison {
  const {
    baselineParams,
    stressedBunkerPrice,
    stressedCongestionDays,
    stressedVolatilityShock,
    weatherDelayDays,
  } = request;

  // 1. Evaluate Baseline
  const baselineEval = evaluateFleet({
    originPortId: baselineParams.originPortId,
    destPortId: baselineParams.destPortId,
    commodityId: baselineParams.commodityId,
    cargoQuantityMT: baselineParams.cargoQuantityMT,
    bunkerPriceUSD: baselineParams.bunkerPricePerMT,
    congestionDays: baselineParams.portCongestionDays,
    marketVolatilityShock: baselineParams.marketVolatilityShock,
  }).bestMatch;

  // 2. Evaluate Stressed
  const stressedEval = evaluateFleet({
    originPortId: baselineParams.originPortId,
    destPortId: baselineParams.destPortId,
    commodityId: baselineParams.commodityId,
    cargoQuantityMT: baselineParams.cargoQuantityMT,
    bunkerPriceUSD: stressedBunkerPrice,
    congestionDays: stressedCongestionDays + weatherDelayDays,
    marketVolatilityShock: stressedVolatilityShock,
  }).bestMatch;

  const deltaCostPerTon = Number((stressedEval.estFreightRateUSD - baselineEval.estFreightRateUSD).toFixed(2));
  const deltaTotalCostUSD = stressedEval.costBreakdown.totalCostUSD - baselineEval.costBreakdown.totalCostUSD;

  let riskAssessment = 'Low Risk Scenario: Minimal financial deviation against approved charter budget.';
  if (deltaCostPerTon > 4.0) {
    riskAssessment = `Severe Exposure: +$${deltaCostPerTon}/MT cost surge (+₹${Math.round(deltaTotalCostUSD * 86.5 / 100000).toLocaleString()} Lakhs). Demurrage and bunker spikes require immediate contractual hedging.`;
  } else if (deltaCostPerTon > 2.0) {
    riskAssessment = `Elevated Risk: +$${deltaCostPerTon}/MT cost surge due to prolonged port congestion and bunker fuel tightening.`;
  }

  const recommendedMitigation = deltaCostPerTon > 2.0
    ? 'Hedge exposure via Bunker Swaps or incorporate flexible laycan clauses (±3 days) with pre-arranged reversible laytime.'
    : 'Maintain standard spot fixture with demurrage cap at $22,000/day.';

  return {
    baseline: {
      freightRatePerTon: baselineEval.estFreightRateUSD,
      totalCostUSD: baselineEval.costBreakdown.totalCostUSD,
      optimalVesselName: baselineEval.vessel.name,
      voyageDays: baselineEval.voyageDays,
    },
    stressed: {
      freightRatePerTon: stressedEval.estFreightRateUSD,
      totalCostUSD: stressedEval.costBreakdown.totalCostUSD,
      optimalVesselName: stressedEval.vessel.name,
      voyageDays: stressedEval.voyageDays,
    },
    deltaCostPerTon,
    deltaTotalCostUSD,
    riskAssessment,
    recommendedMitigation,
  };
}
