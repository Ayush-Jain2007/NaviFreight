import { Port, Vessel, Commodity, SuitabilityEvaluation, CostBreakdown, ScenarioTestOption, ForecastPoint } from '../types';
import { DISTANCE_MATRIX, PORTS_DATABASE, COMMODITIES_DATABASE, BASE_FREIGHT_TIME_SERIES } from '../data/maritimeData';

export function calculateNauticalDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R_NM = 3440.065; // Earth radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directNM = R_NM * c;
  const detourFactor = directNM < 600 ? 1.08 : directNM < 3000 ? 1.18 : 1.25;
  return Math.max(150, Math.round(directNM * detourFactor));
}

export function getRouteDistance(originId: string, destId: string): number {
  if (DISTANCE_MATRIX[originId] && DISTANCE_MATRIX[originId][destId]) {
    return DISTANCE_MATRIX[originId][destId];
  }
  const p1 = PORTS_DATABASE.find(p => p.id === originId);
  const p2 = PORTS_DATABASE.find(p => p.id === destId);
  if (p1 && p2) {
    return calculateNauticalDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
  }
  return 4650;
}


export function evaluateVesselSuitability(
  vessel: Vessel,
  port: Port,
  cargoQuantityMT: number,
  commodity: Commodity,
  distanceNM: number,
  bunkerPriceUSD: number = 620,
  congestionDays: number = 1.5,
  marketVolatilityShock: number = 0
): SuitabilityEvaluation {
  // 1. Physical Port Constraints Check
  const draftClearance = Number((port.maxDraftMeters - vessel.draftMeters).toFixed(2));
  const loaClearance = Number((port.maxLOAMeters - vessel.loaMeters).toFixed(1));
  const beamClearance = Number((port.maxBeamMeters - vessel.beamMeters).toFixed(1));

  const draftPasses = draftClearance >= 0;
  const loaPasses = loaClearance >= 0;
  const beamPasses = beamClearance >= 0;

  let draftMessage = '';
  if (draftClearance >= 0.8) {
    draftMessage = `Safe clearance: +${draftClearance}m under-keel margin`;
  } else if (draftClearance >= 0) {
    draftMessage = `Marginal draft: +${draftClearance}m clearance (Tide-dependent entry required)`;
  } else {
    draftMessage = `Draft Exceeded: Needs -${Math.abs(draftClearance)}m dredging / exceeds port limit of ${port.maxDraftMeters}m`;
  }

  const loaMessage = loaPasses
    ? `Length clearance: +${loaClearance}m within max berth ${port.maxLOAMeters}m`
    : `LOA Exceeded: Vessel is ${Math.abs(loaClearance)}m longer than port max ${port.maxLOAMeters}m`;

  const beamMessage = beamPasses
    ? `Beam clearance: +${beamClearance}m compliant with crane outreach`
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
  const speedKnots = vessel.speedKnots || 13.0;
  const seaDaysLaden = distanceNM / (speedKnots * 24);
  const seaDaysBallast = seaDaysLaden * 0.95;
  const totalSeaDays = seaDaysLaden + seaDaysBallast;

  // Port discharging days = cargo quantity / port handling rate TPD
  const liftPerVoyage = Math.min(cargoQuantityMT, vessel.dwt * 0.94);
  const dischargeDays = Math.max(1.5, liftPerVoyage / port.handlingRateTPD);
  const loadingDays = Math.max(1.0, liftPerVoyage / 90000); // Efficient loading port
  const totalPortDays = loadingDays + dischargeDays + congestionDays;
  const totalVoyageDays = totalSeaDays + totalPortDays;

  // 4. Financial Cost Calculations
  // Total fuel consumption
  const fuelSeaMT = totalSeaDays * vessel.bunkerConsumptionSeaTPD;
  const fuelPortMT = totalPortDays * vessel.bunkerConsumptionPortTPD;
  const totalFuelMT = fuelSeaMT + fuelPortMT;
  const bunkerCostUSD = Math.round(totalFuelMT * bunkerPriceUSD);

  // Time-charter equivalent / hire cost
  const baseHireCost = Math.round(vessel.dailyHireRateUSD * totalVoyageDays);

  // Port dues (Pilotage, berth hire, anchorage, tugboats based on DWT)
  const portDuesUSD = Math.round(35000 + vessel.dwt * 0.45);

  // Demurrage buffer ($22,000/day for waiting beyond 2 standard laytime days)
  const waitingDemurrageUSD = Math.round(Math.max(0, congestionDays - 1.0) * 22000);

  // Volatility adjustment
  const volatilityMultiplier = 1 + marketVolatilityShock / 100;
  const rawTotalCost = (baseHireCost + bunkerCostUSD + portDuesUSD + waitingDemurrageUSD) * volatilityMultiplier;
  const totalCostUSD = Math.round(rawTotalCost);

  // Freight rate per ton on carried cargo
  const estFreightRateUSD = Number((totalCostUSD / liftPerVoyage).toFixed(2));
  const costPerTonUSD = estFreightRateUSD;

  // Base Freight Portion for breakdown
  const baseFreightCostUSD = Math.round(baseHireCost * volatilityMultiplier);

  const costBreakdown: CostBreakdown = {
    baseFreightCostUSD,
    bunkerCostUSD,
    portDuesUSD,
    waitingDemurrageUSD,
    totalCostUSD,
    costPerTonUSD,
  };

  // Suitability scoring (0-100)
  let score = 96 - penalty;
  // Parcel size match bonus/penalty
  const parcelMismatch = Math.abs(cargoQuantityMT - vessel.dwt) / cargoQuantityMT;
  if (parcelMismatch > 0.5) score -= 12;
  else if (parcelMismatch < 0.2) score += 4;
  score = Math.max(20, Math.min(99, Math.round(score)));

  // Arrival window calculation (e.g. 15-28 Mar 2026)
  const departureDaysAhead = Math.round(totalSeaDays + 2);
  const arrivalStart = new Date();
  arrivalStart.setDate(arrivalStart.getDate() + departureDaysAhead);
  const arrivalEnd = new Date(arrivalStart);
  arrivalEnd.setDate(arrivalEnd.getDate() + 4);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const arrivalWindow = `${formatDate(arrivalStart)} – ${formatDate(arrivalEnd)}`;

  // Explainable AI recommendation summary
  let whyThisMatches = '';
  if (status === 'Exceeds Port Limits') {
    whyThisMatches = `Incompatible with ${port.name}: ${!draftPasses ? draftMessage : loaMessage}. Would require lighterage at open roads, causing $4.50/ton demurrage premium.`;
  } else if (vessel.vesselClass === 'Panamax' && port.maxDraftMeters <= 14.5) {
    whyThisMatches = `Optimal balance for ${port.name}: Maximizes deadweight parcel (${(liftPerVoyage / 1000).toFixed(0)}k MT) with +${draftClearance}m safe water depth, avoiding split-shipment demurrage.`;
  } else if (vessel.vesselClass === 'Capesize' && port.maxDraftMeters >= 18.0) {
    whyThisMatches = `Maximum economies of scale for deep-water ${port.name}: Carries full parcel in a single voyage, yielding lowest $/ton delivered cost ($${costPerTonUSD}/t).`;
  } else if (vessel.vesselClass === 'Supramax') {
    whyThisMatches = `High operational agility: Onboard ${vessel.gearDescription} bypasses shore equipment bottlenecks, optimal for riverine Haldia or shallow inner berths.`;
  } else {
    whyThisMatches = `Feasible charter candidate: Meets all navigation constraints with safe draft margin (+${draftClearance}m) and competitive rate.`;
  }

  return {
    vessel,
    status,
    score,
    draftCheck: { passes: draftPasses, clearanceM: draftClearance, message: draftMessage },
    loaCheck: { passes: loaPasses, clearanceM: loaClearance, message: loaMessage },
    beamCheck: { passes: beamPasses, clearanceM: beamClearance, message: beamMessage },
    capacityMatchRatio: Number((liftPerVoyage / cargoQuantityMT).toFixed(2)),
    costBreakdown,
    estFreightRateUSD,
    arrivalWindow,
    voyageDays: Math.round(totalVoyageDays),
    whyThisMatches,
  };
}

export function generateDynamicForecast(
  originId: string,
  destId: string,
  commodityId: string,
  horizonDays: 30 | 60 | 90,
  volatilityShock: number = 0
): {
  series: ForecastPoint[];
  currentRate: number;
  expectedRange: [number, number];
  trend: 'Slight Decrease' | 'Stable' | 'Moderate Increase' | 'High Volatility';
  confidencePct: number;
  keyFactors: string[];
} {
  const origin = PORTS_DATABASE.find(p => p.id === originId) || PORTS_DATABASE[7];
  const dest = PORTS_DATABASE.find(p => p.id === destId) || PORTS_DATABASE[0];
  const commodity = COMMODITIES_DATABASE.find(c => c.id === commodityId) || COMMODITIES_DATABASE[0];

  // Base freight adjustments based on route and commodity
  let routeBaseline = 24.8;
  if (dest.id === 'haldia') routeBaseline += 4.5; // Shallow riverine premium
  if (dest.id === 'dhamra' || dest.id === 'vizag_outer') routeBaseline -= 1.8; // Deepwater efficiency
  if (commodity.id === 'coking_coal') routeBaseline += 1.6;
  if (commodity.id === 'bauxite') routeBaseline += 2.2;

  const currentRate = Number((routeBaseline * (1 + volatilityShock / 100)).toFixed(1));

  // Determine forecast trajectory based on commodity seasonality
  // Q1-Q2 typically has softer rates before mid-year restocking
  const series: ForecastPoint[] = BASE_FREIGHT_TIME_SERIES.map((pt) => {
    const diff = currentRate - 25.4;
    if (!pt.isForecast) {
      return {
        ...pt,
        historical: Number(((pt.historical || 25.0) + diff * 0.6).toFixed(1)),
      };
    }

    const shockFactor = 1 + volatilityShock / 100;
    const basePredicted = (pt.forecast || 24.0) + diff * 0.85;
    const forecast = Number((basePredicted * shockFactor).toFixed(1));
    const spread = (pt.upperConfidence! - pt.lowerConfidence!) * 0.5 * (1 + Math.abs(volatilityShock) * 0.02);
    const lowerConfidence = Number((forecast - spread).toFixed(1));
    const upperConfidence = Number((forecast + spread).toFixed(1));

    return {
      ...pt,
      forecast,
      lowerConfidence,
      upperConfidence,
    };
  });

  // Filter series according to horizon
  let monthsToInclude = 2;
  if (horizonDays === 30) monthsToInclude = 1;
  if (horizonDays === 60) monthsToInclude = 2;
  if (horizonDays === 90) monthsToInclude = 4;

  const historicalCount = 13;
  const filteredSeries = series.slice(0, historicalCount + monthsToInclude);

  const forecastPoints = filteredSeries.filter(p => p.isForecast);
  const minForecast = Math.min(...forecastPoints.map(p => p.lowerConfidence || p.forecast || currentRate));
  const maxForecast = Math.max(...forecastPoints.map(p => p.upperConfidence || p.forecast || currentRate));

  const expectedRange: [number, number] = [
    Number((minForecast + 0.5).toFixed(1)),
    Number((maxForecast - 0.2).toFixed(1)),
  ];

  let trend: 'Slight Decrease' | 'Stable' | 'Moderate Increase' | 'High Volatility' = 'Slight Decrease';
  if (volatilityShock > 10) trend = 'Moderate Increase';
  else if (volatilityShock < -10) trend = 'Slight Decrease';
  else if (Math.abs(volatilityShock) > 15) trend = 'High Volatility';

  const keyFactors = [
    `Global steel production & iron ore demand cycle (${commodity.name})`,
    `Bunker fuel price volatility (VLSFO Singapore & Fujairah)`,
    `Vessel supply availability in the Indian Ocean & Malacca ballaster queue`,
    `Monsoon transition & cyclone seasonal index for Bay of Bengal`,
    `Port turnaround and congestion index at ${dest.name} (${dest.averageTurnaroundHours}h avg)`,
  ];

  return {
    series: filteredSeries,
    currentRate,
    expectedRange,
    trend,
    confidencePct: 20, // ±20% as in presentation
    keyFactors,
  };
}

export function generateScenarioMatrix(
  baseRate: number,
  cargoQuantityMT: number,
  arrivalDateStr: string = '18 Mar 2026'
): ScenarioTestOption[] {
  const baseCost = Math.round(baseRate * cargoQuantityMT);

  const earlyRate = Number((baseRate * 0.895).toFixed(1));
  const earlyCost = Math.round(earlyRate * cargoQuantityMT);

  const lateRate = Number((baseRate * 1.092).toFixed(1));
  const lateCost = Math.round(lateRate * cargoQuantityMT);

  return [
    {
      name: 'Early Booking',
      timing: 'Laycan 15-28 Feb 2026',
      freightRateUSD: earlyRate,
      totalCostUSD: earlyCost,
      costPerTonUSD: earlyRate,
      expectedArrival: '02 – 08 Mar 2026',
      riskLevel: 'Low',
      notes: 'Locks in current market dip ahead of monsoon restocking. Saves approx. $390,000.',
    },
    {
      name: 'Base Case (Planned)',
      timing: 'Laycan 01-15 Mar 2026',
      freightRateUSD: baseRate,
      totalCostUSD: baseCost,
      costPerTonUSD: baseRate,
      expectedArrival: arrivalDateStr,
      riskLevel: 'Medium',
      notes: 'Matches target plant delivery schedule. Standard exposure to bunker fluctuations.',
    },
    {
      name: 'Late Booking',
      timing: 'Laycan 20-31 Mar 2026',
      freightRateUSD: lateRate,
      totalCostUSD: lateCost,
      costPerTonUSD: lateRate,
      expectedArrival: '05 – 12 Apr 2026',
      riskLevel: 'High',
      notes: 'High spot market squeeze risk as major miners secure pre-Q2 contracts. +9.2% cost premium.',
    },
  ];
}
