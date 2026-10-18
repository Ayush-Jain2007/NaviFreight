import { VesselClass, Vessel, Port } from './index';

export type IncidentSeverity = 'Critical' | 'Major' | 'Moderate' | 'Minor';

export type IncidentStatus = 
  | 'Reported' 
  | 'Under Review' 
  | 'Escalated' 
  | 'Recovery in Progress' 
  | 'Resolved' 
  | 'Closed';

export type EmergencyIncidentType = 
  | 'Vessel in distress'
  | 'Medical emergency onboard'
  | 'Fire or explosion'
  | 'Vessel breakdown'
  | 'Collision or grounding'
  | 'Piracy or security threat'
  | 'Severe weather'
  | 'Man overboard'
  | 'Other maritime emergencies';

export type DisruptionType = 
  | 'Port closure'
  | 'Conflict or security disruption'
  | 'Severe weather'
  | 'Vessel breakdown'
  | 'Port congestion'
  | 'Route blockage'
  | 'Delayed shipment'
  | 'Other';

export interface EmergencyReport {
  id: string;
  vesselId: string;
  vesselName: string;
  vesselClass: VesselClass;
  incidentType: EmergencyIncidentType;
  severity: IncidentSeverity;
  locationName: string;
  latitude: number;
  longitude: number;
  incidentTime: string;
  description: string;
  peopleAtRisk: number;
  supportingEvidence?: string;
  commChannels: string;
  status: IncidentStatus;
  assignedContact: string;
  lastUpdate: string;
  recommendedNextSteps: string[];
  officialReporting: {
    dgShippingNotified: boolean;
    mrccRefId?: string;
    ifcIorNotified: boolean;
    reportDraft: string;
  };
}

export interface TrackedSafetyVessel {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  flag: string;
  vesselClass: VesselClass;
  latitude: number;
  longitude: number;
  lastUpdated: string;
  dataFreshness: string;
  speedKnots: number;
  heading: number;
  currentStatus: 'Normal Underway' | 'Advisory - Severe Weather' | 'Drifting / Machinery Alert' | 'In Distress - SOS' | 'Anchored - Outer Roads';
  route: string;
  destinationPortId: string;
  destinationPortName: string;
  eta: string;
  cargo: string;
  cargoMT: number;
  safetyAlerts: string[];
  nearestPort: { name: string; distanceNM: number };
  nearestShelter: { name: string; distanceNM: number };
  isDemo: boolean; // Always true for demo tracking data
}

export interface CargoDisruption {
  id: string;
  title: string;
  shipmentId: string;
  vesselId: string;
  vesselName: string;
  cargoType: string;
  cargoQuantityMT: number;
  plannedDestinationId: string;
  plannedDestinationName: string;
  disruptionType: DisruptionType;
  severity: IncidentSeverity;
  reportedDate: string;
  description: string;
  recoveryPlanStatus: 'Pending Analysis' | 'Options Generated' | 'Plan Selected' | 'Executed';
  selectedRecoveryOptionId?: string;
}

export interface CargoRecoveryOption {
  id: string;
  disruptionId: string;
  optionType: 'Alternative Port Diversion' | 'Transshipment & Lightering' | 'Speed Optimization / Safe Drift';
  title: string;
  destinationPortId: string;
  destinationPortName: string;
  destinationCountry: string;
  feasibility: 'Feasible' | 'Conditional' | 'Restricted';
  draftCheck: {
    portMaxDraft: number;
    vesselDraft: number;
    ukcMeters: number;
    passes: boolean;
  };
  additionalNM: number;
  estArrival: string;
  voyageDurationDays: number;
  additionalCostUSD: number;
  demurrageSavedUSD: number;
  netFinancialImpactUSD: number;
  operationalConstraints: string[];
  recommendationReason: string;
  confidenceScore: number;
  isRecommended: boolean;
}

export interface STSTransferPlan {
  id: string;
  dischargingVesselId: string;
  dischargingVesselName: string;
  receivingVesselId: string;
  receivingVesselName: string;
  cargoType: string;
  transferQuantityMT: number;
  transferLocation: {
    name: string;
    latitude: number;
    longitude: number;
    shelteredStatus: string;
    minWaterDepthM: number;
  };
  compatibility: {
    dwtMatches: boolean;
    draftPermitted: boolean;
    gearCompatible: boolean;
    fenderingRequirement: string;
    weatherWindowFavorable: boolean;
    overallFeasible: boolean;
    warnings: string[];
  };
  estimatedDurationHours: number;
  estimatedCostUSD: number;
  approvals: {
    dgShippingPermit: 'Pending' | 'Approved' | 'Not Required' | 'Applied';
    harborMasterApproval: 'Pending' | 'Approved' | 'Applied';
    classSocietyNotified: boolean;
    pAndIClubApproval: boolean;
    spillResponseStandby: boolean;
  };
  status: 'Under Evaluation' | 'Awaiting Approvals' | 'Approved for Execution' | 'Transfer in Progress' | 'Completed' | 'Rejected';
  createdAt: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  type: string;
  severity: IncidentSeverity;
  vesselOrShipment: string;
  location: string;
  reportedTime: string;
  lastUpdate: string;
  status: IncidentStatus;
  assignedOwner: string;
  actionsTaken: string[];
  nextSteps: string[];
  auditLog: {
    timestamp: string;
    actor: string;
    action: string;
    details: string;
  }[];
}

export interface SafetySummaryMetrics {
  activeEmergencies: number;
  vesselsRequiringAttention: number;
  cargoDisruptions: number;
  recoveryPlansInProgress: number;
  pendingApprovals: number;
  resolvedIncidents: number;
}
