import { dbManager } from '../db/database';
import { getRouteDistance } from './freightEngine';

export interface PortData {
  id: string;
  name: string;
  country: string;
  region: string;
  is_indian_east_coast: number;
  max_draft_meters: number;
  max_loa_meters: number;
  max_beam_meters: number;
  handling_rate_tpd: number;
  average_turnaround_hours: number;
  berth_count: number;
  congestion_status: string;
  latitude: number;
  longitude: number;
  key_commodities: string;
  notes: string;
}

export interface VesselData {
  id: string;
  name: string;
  vessel_class: 'Handysize' | 'Supramax' | 'Panamax' | 'Capesize';
  dwt: number;
  draft_meters: number;
  loa_meters: number;
  beam_meters: number;
  year_built: number;
  flag: string;
  current_location: string;
  speed_knots: number;
  bunker_consumption_sea_tpd: number;
  bunker_consumption_port_tpd: number;
  daily_hire_rate_usd: number;
  gear_description: string;
  suitability_score_default: number;
  available_from: string;
  available_to: string;
}

export interface CostBreakdown {
  baseFreightCostUSD: number;
  bunkerCostUSD: number;
  portDuesUSD: number;
  waitingDemurrageUSD: number;
  totalCostUSD: number;
  costPerTonUSD: number;
}

export interface SuitabilityEvaluation {
  vessel: VesselData;
  status: 'Feasible' | 'Conditional' | 'Exceeds Port Limits';
  score: number;
  draftCheck: { passes: boolean; clearanceM: number; message: string };
  loaCheck: { passes: boolean; clearanceM: number; message: string };
  beamCheck: { passes: boolean; clearanceM: number; message: string };
  capacityMatchRatio: number;
  costBreakdown: CostBreakdown;
  estFreightRateUSD: number;
  arrivalWindow: string;
  voyageDays: number;
  whyThisMatches: string;
}

export interface CharteringEvaluationRequest {
  originPortId: string;
  destPortId: string;
  commodityId: string;
  cargoQuantityMT: number;
  targetArrivalDate?: string;
  bunkerPriceUSD?: number;
  congestionDays?: number;
  marketVolatilityShock?: number;
  selectedVesselId?: string;
}

export function evaluateVessel(
  vessel: VesselData,
  port: PortData,
  cargoQuantityMT: number,
  distanceNM: number,
  bunkerPriceUSD: number = 624,
  congestionDays: number = 1.5,
  marketVolatilityShock: number = 0
): SuitabilityEvaluation {
  // 1. Physical Port Constraints Checking
  const draftClearance = Number((port.max_draft_meters - vessel.draft_meters).toFixed(2));
  const loaClearance = Number((port.max_loa_meters - vessel.loa_meters).toFixed(1));
  const beamClearance = Number((port.max_beam_meters - vessel.beam_meters).toFixed(1));

  const draftPasses = draftClearance >= 0;
  const loaPasses = loaClearance >= 0;
  const beamPasses = beamClearance >= 0;

  let draftMessage = '';
  if (draftClearance >= 0.8) {
    draftMessage = `Safe clearance: +${draftClearance}m under-keel margin (Meets UKC standards)`;
  } else if (draftClearance >= 0) {
    draftMessage = `Marginal draft: +${draftClearance}m clearance (Tide-dependent entry required)`;
  } else {
    draftMessage = `Draft Exceeded: Needs -${Math.abs(draftClearance)}m dredging / exceeds port limit of ${port.max_draft_meters}m`;
  }

  const loaMessage = loaPasses
    ? `Length clearance: +${loaClearance}m within max berth limit of ${port.max_loa_meters}m`
    : `LOA Exceeded: Vessel is ${Math.abs(loaClearance)}m longer than port max berth ${port.max_loa_meters}m`;

  const beamMessage = beamPasses
    ? `Beam clearance: +${beamClearance}m compliant with shore crane outreach (${port.max_beam_meters}m)`
    : `Beam Exceeded: Exceeds crane reach by ${Math.abs(beamClearance)}m`;

  // 2. Status Determination
  let status: 'Feasible' | 'Conditional' | 'Exceeds Port Limits';
  let penalty = 0;

  if (!draftPasses || !loaPasses || !beamPasses) {
    status = 'Exceeds Port Limits';
    penalty += 45;
  } else if (draftClearance < 0.6 || loaClearance < 10) {
    status = 'Conditional';
    penalty += 15;
  } else {
    status = 'Feasible';
  }

  // 3. Voyage Dynamics
  const speedKnots = vessel.speed_knots || 13.0;
  const seaDaysLaden = distanceNM / (speedKnots * 24);
  const seaDaysBallast = seaDaysLaden * 0.95;
  const totalSeaDays = seaDaysLaden + seaDaysBallast;

  // Cargo lift calculation
  const liftPerVoyage = Math.min(cargoQuantityMT, vessel.dwt * 0.94);
  const dischargeDays = Math.max(1.5, liftPerVoyage / port.handling_rate_tpd);
  const loadingDays = Math.max(1.0, liftPerVoyage / 90000); // Efficient deepwater loading terminal
  const totalPortDays = loadingDays + dischargeDays + congestionDays;
  const totalVoyageDays = Number((totalSeaDays + totalPortDays).toFixed(1));

  // 4. Financial Calculations
  const fuelSeaMT = totalSeaDays * vessel.bunker_consumption_sea_tpd;
  const fuelPortMT = totalPortDays * vessel.bunker_consumption_port_tpd;
  const totalFuelMT = fuelSeaMT + fuelPortMT;
  const bunkerCostUSD = Math.round(totalFuelMT * bunkerPriceUSD);

  const baseHireCost = Math.round(vessel.daily_hire_rate_usd * totalVoyageDays);
  const portDuesUSD = Math.round(35000 + vessel.dwt * 0.45);
  const waitingDemurrageUSD = Math.round(Math.max(0, congestionDays - 1.0) * 22000);

  const volatilityMultiplier = 1 + marketVolatilityShock / 100;
  const rawTotalCost = (baseHireCost + bunkerCostUSD + portDuesUSD + waitingDemurrageUSD) * volatilityMultiplier;
  const totalCostUSD = Math.round(rawTotalCost);

  const estFreightRateUSD = Number((totalCostUSD / liftPerVoyage).toFixed(2));
  const capacityMatchRatio = Number((liftPerVoyage / cargoQuantityMT).toFixed(2));

  // 5. Suitability Score (0-100)
  let rawScore = vessel.suitability_score_default - penalty;
  if (status === 'Feasible') {
    if (draftClearance >= 1.0) rawScore += 4;
    if (vessel.vessel_class === 'Panamax' && port.name.includes('Paradip')) rawScore += 5;
    if (vessel.vessel_class === 'Capesize' && port.name.includes('Outer')) rawScore += 6;
  }
  const score = Math.max(15, Math.min(98, rawScore));

  const arrivalWindow = '18 Mar – 24 Mar 2026';

  let whyThisMatches = '';
  if (status === 'Feasible') {
    whyThisMatches = `${vessel.name} offers optimal under-keel clearance (+${draftClearance}m) and lowest total voyage unit cost ($${estFreightRateUSD}/t) for ${port.name}.`;
  } else if (status === 'Conditional') {
    whyThisMatches = `Marginal draft clearance (+${draftClearance}m). Requires tidal window entry and pre-berthing draft survey.`;
  } else {
    whyThisMatches = `Exceeds port navigational constraints (${!draftPasses ? `Draft ${vessel.draft_meters}m > Port Max ${port.max_draft_meters}m` : 'LOA/Beam exceedance'}). Offshore lighterage required.`;
  }

  return {
    vessel,
    status,
    score,
    draftCheck: { passes: draftPasses, clearanceM: draftClearance, message: draftMessage },
    loaCheck: { passes: loaPasses, clearanceM: loaClearance, message: loaMessage },
    beamCheck: { passes: beamPasses, clearanceM: beamClearance, message: beamMessage },
    capacityMatchRatio,
    costBreakdown: {
      baseFreightCostUSD: baseHireCost,
      bunkerCostUSD,
      portDuesUSD,
      waitingDemurrageUSD,
      totalCostUSD,
      costPerTonUSD: estFreightRateUSD,
    },
    estFreightRateUSD,
    arrivalWindow,
    voyageDays: totalVoyageDays,
    whyThisMatches,
  };
}

export function evaluateFleet(request: CharteringEvaluationRequest): {
  evaluations: SuitabilityEvaluation[];
  bestMatch: SuitabilityEvaluation;
  port: PortData;
  summary: {
    feasibleCount: number;
    conditionalCount: number;
    infeasibleCount: number;
    lowestCostPerTonUSD: number;
  };
} {
  const {
    originPortId,
    destPortId,
    commodityId,
    cargoQuantityMT,
    bunkerPriceUSD = 624,
    congestionDays = 1.5,
    marketVolatilityShock = 0,
  } = request;

  // Retrieve destination port
  const port = dbManager.get<PortData>('SELECT * FROM ports WHERE id = ?', [destPortId]) ||
    dbManager.get<PortData>('SELECT * FROM ports LIMIT 1')!;

  // Retrieve all vessels
  const vessels = dbManager.query<VesselData>('SELECT * FROM vessels ORDER BY dwt ASC');
  const distanceNM = getRouteDistance(originPortId, destPortId);

  const evaluations = vessels.map((v) =>
    evaluateVessel(v, port, cargoQuantityMT, distanceNM, bunkerPriceUSD, congestionDays, marketVolatilityShock)
  );

  // Sort by feasible status first, then by lowest freight rate
  evaluations.sort((a, b) => {
    if (a.status === 'Feasible' && b.status !== 'Feasible') return -1;
    if (b.status === 'Feasible' && a.status !== 'Feasible') return 1;
    return a.estFreightRateUSD - b.estFreightRateUSD;
  });

  const bestMatch = evaluations[0];
  const feasibleCount = evaluations.filter((e) => e.status === 'Feasible').length;
  const conditionalCount = evaluations.filter((e) => e.status === 'Conditional').length;
  const infeasibleCount = evaluations.filter((e) => e.status === 'Exceeds Port Limits').length;

  return {
    evaluations,
    bestMatch,
    port,
    summary: {
      feasibleCount,
      conditionalCount,
      infeasibleCount,
      lowestCostPerTonUSD: bestMatch.estFreightRateUSD,
    },
  };
}
