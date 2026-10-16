export type VesselClass = 'Handysize' | 'Supramax' | 'Panamax' | 'Capesize';

export interface Port {
  id: string;
  name: string;
  country: string;
  region: string;
  isIndianEastCoast: boolean;
  maxDraftMeters: number;
  maxLOAMeters: number;
  maxBeamMeters: number;
  handlingRateTPD: number; // Tonnes per day
  averageTurnaroundHours: number;
  berthCount: number;
  congestionStatus: 'Low' | 'Normal' | 'Elevated' | 'Congested';
  latitude: number;
  longitude: number;
  keyCommodities: string[];
  notes: string;
}

export interface Commodity {
  id: string;
  name: string;
  category: 'Dry Bulk' | 'Mineral' | 'Agricultural';
  defaultParcelSizeMT: number;
  densityTonsM3: number;
  stowageFactor: number;
  description: string;
}

export interface Vessel {
  id: string;
  name: string;
  vesselClass: VesselClass;
  dwt: number;
  draftMeters: number;
  loaMeters: number;
  beamMeters: number;
  yearBuilt: number;
  flag: string;
  currentLocation: string;
  speedKnots: number;
  bunkerConsumptionSeaTPD: number; // Tonnes per day
  bunkerConsumptionPortTPD: number;
  dailyHireRateUSD: number;
  gearDescription: string;
  suitabilityScoreDefault: number;
  availableFrom: string;
  availableTo: string;
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
  vessel: Vessel;
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

export interface ForecastPoint {
  date: string;
  label: string;
  historical?: number;
  forecast?: number;
  lowerConfidence?: number;
  upperConfidence?: number;
  isForecast: boolean;
  eventNote?: string;
}

export interface SimulationParams {
  originPortId: string;
  destPortId: string;
  commodityId: string;
  cargoQuantityMT: number;
  targetArrivalDate: string;
  horizonDays: 30 | 60 | 90;
  bunkerPricePerMT: number; // Default $620
  portCongestionDays: number; // Default 1.5
  marketVolatilityShock: number; // Default 0% (-20% to +30%)
}

export interface ScenarioTestOption {
  name: string;
  timing: string;
  freightRateUSD: number;
  totalCostUSD: number;
  costPerTonUSD: number;
  expectedArrival: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  notes: string;
}

export interface RecentShipment {
  id: string;
  commodity: string;
  quantityMT: number;
  originPort: string;
  destinationPort: string;
  vesselName: string;
  vesselClass: VesselClass;
  arrivalDate: string;
  freightRateUSD: number;
  status: 'Planned' | 'In Transit' | 'Discharging' | 'Completed';
}
