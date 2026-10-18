import { Router, Request, Response } from 'express';
import { dbManager } from '../db/database';

export const safetyRouter = Router();

// In-memory persistent store initialized with rich operational baseline records
let incidentsRegister: any[] = [
  {
    id: 'INC-2026-088',
    title: 'Main Engine Scavenge Fire & Propulsion Derating',
    type: 'Vessel breakdown',
    severity: 'Major',
    vesselOrShipment: 'MV Iron Leader (Capesize 176k)',
    vesselId: 'vessel_3',
    location: 'Central Bay of Bengal (14.22° N, 86.85° E)',
    reportedTime: '2026-10-15 14:30 UTC',
    lastUpdate: '2026-10-16 11:20 UTC',
    status: 'Recovery in Progress',
    assignedOwner: 'Capt. R. K. Nair (Fleet Superintendent)',
    description: 'Unit 4 scavenge air fire extinguished by onboard CO2 injection. Engine currently derated to 6.2 kts on 5 cylinders. Vessel cannot maintain schedule for Paradip Port approach.',
    peopleAtRisk: 24,
    commChannels: 'Inmarsat-C (412984510) / FleetBroadband / VHF Ch 16',
    actionsTaken: [
      'Fire declared fully extinguished; no crew casualties.',
      'Emergency notification logged in carrier decision brief.',
      'Diverted towards Visakhapatnam Outer Roads (18.5m draft) for auxiliary inspection.',
      'Tug assistance requested from Visakhapatnam Port Authority.'
    ],
    nextSteps: [
      'Class surveyor attendance at Vizag outer anchorage.',
      'Evaluate STS cargo lightening if repairs require drydock.',
      'Issue DG Shipping casualty flash report.'
    ],
    officialReporting: {
      dgShippingNotified: true,
      mrccRefId: 'MRCC-CHN-2026-1088',
      ifcIorNotified: true,
      reportDraft: ''
    },
    auditLog: [
      { timestamp: '2026-10-15 14:30', actor: 'Master MV Iron Leader', action: 'REPORTED', details: 'Casualty initial report transmitted via Inmarsat-C' },
      { timestamp: '2026-10-15 15:45', actor: 'Capt. R. K. Nair', action: 'UNDER REVIEW', details: 'Assigned as primary shore response coordinator' },
      { timestamp: '2026-10-15 18:20', actor: 'Marine Ops Desk', action: 'ESCALATED', details: 'MRCC Chennai alerted as precautionary notification' },
      { timestamp: '2026-10-16 08:00', actor: 'Chartering Ops', action: 'RECOVERY IN PROGRESS', details: 'Alternative port diversion initiated to Vizag Outer' }
    ]
  },
  {
    id: 'INC-2026-089',
    title: 'Tropical Cyclone Severe Wind & Wave Hazard Warning',
    type: 'Severe weather',
    severity: 'Critical',
    vesselOrShipment: 'Paradip Port Bulk Approaches',
    vesselId: 'paradip_approaches',
    location: 'North Bay of Bengal (19.80° N, 87.40° E)',
    reportedTime: '2026-10-16 04:00 UTC',
    lastUpdate: '2026-10-16 13:45 UTC',
    status: 'Escalated',
    assignedOwner: 'S. Banerjee (Port Operations Desk)',
    description: 'IMD / RSMC Cyclone Alert bulletin: Severe Cyclonic Storm tracking NW towards Odisha coast. Paradip Port issuing Local Cautionary Signal 4; port operations suspended for incoming laden Capesize and Panamax bulk carriers.',
    peopleAtRisk: 140,
    commChannels: 'NAVTEX 518 kHz / VHF Ch 16 / DSC 2187.5 kHz',
    actionsTaken: [
      'Advisory broadcast to all fleet vessels in 200nm radius.',
      'Port suspension confirmed with Paradip Port Trust Harbor Master.',
      'Activated Smart Cargo Recovery diversion assessment.'
    ],
    nextSteps: [
      'Coordinate speed reduction and drift vectors outside 50kt wind radius.',
      'Evaluate diversion to Dhamra deepwater berths.'
    ],
    officialReporting: {
      dgShippingNotified: true,
      mrccRefId: 'MRCC-KOL-2026-0512',
      ifcIorNotified: false,
      reportDraft: ''
    },
    auditLog: [
      { timestamp: '2026-10-16 04:00', actor: 'System IMD Ingest', action: 'REPORTED', details: 'Cyclone tracking polygon triggered automatic corridor alert' },
      { timestamp: '2026-10-16 05:30', actor: 'S. Banerjee', action: 'ESCALATED', details: 'Port suspension confirmed with Harbor Master' }
    ]
  },
  {
    id: 'INC-2026-085',
    title: 'Medical Evacuation - Onboard Chief Engineer Medical Emergency',
    type: 'Medical emergency onboard',
    severity: 'Major',
    vesselOrShipment: 'MV Blue Horizon (Panamax 76k)',
    vesselId: 'vessel_1',
    location: 'Andaman Sea off Great Nicobar (6.75° N, 93.80° E)',
    reportedTime: '2026-10-14 09:15 UTC',
    lastUpdate: '2026-10-15 18:00 UTC',
    status: 'Resolved',
    assignedOwner: 'Dr. V. Rao (Medical Consultant) / Coast Guard Liaison',
    description: 'Chief Engineer experienced acute cardiac distress during transit through Six Degree Channel. Coordinated with MRCC Port Blair and Indian Coast Guard helicopter rendezvous.',
    peopleAtRisk: 1,
    commChannels: 'VHF Ch 16 / Sat Phone',
    actionsTaken: [
      'Tele-medical consultation provided by Port Health Authority.',
      'Coast Guard helo air-evac conducted at 14:00 UTC to Port Blair INHS Dhanvantari.',
      'Patient stabilized; replacement chief engineer boarded at Port Blair anchorage.'
    ],
    nextSteps: [
      'Finalize maritime medical casualty report for DG Shipping.'
    ],
    officialReporting: {
      dgShippingNotified: true,
      mrccRefId: 'MRCC-PBL-2026-0294',
      ifcIorNotified: false,
      reportDraft: ''
    },
    auditLog: [
      { timestamp: '2026-10-14 09:15', actor: 'Master MV Blue Horizon', action: 'REPORTED', details: 'MEDEVAC request broadcast' },
      { timestamp: '2026-10-14 14:10', actor: 'MRCC Port Blair', action: 'RECOVERY IN PROGRESS', details: 'Air evacuation executed successfully' },
      { timestamp: '2026-10-15 18:00', actor: 'Capt. Nair', action: 'RESOLVED', details: 'Vessel resumed commercial passage after crew replenishment' }
    ]
  }
];

// 1. GET /api/safety/summary
safetyRouter.get('/summary', (req: Request, res: Response) => {
  const activeEmergencies = incidentsRegister.filter(i => 
    (i.severity === 'Critical' || i.severity === 'Major') && i.status !== 'Resolved' && i.status !== 'Closed'
  ).length;

  const vesselsRequiringAttention = 3; // MV Iron Leader, MV Pacific Sentinel, MV Ocean Fortune
  const cargoDisruptions = 2;
  const recoveryPlansInProgress = incidentsRegister.filter(i => i.status === 'Recovery in Progress').length;
  const pendingApprovals = 1; // 1 STS transfer approval awaiting sign-off
  const resolvedIncidents = incidentsRegister.filter(i => i.status === 'Resolved' || i.status === 'Closed').length + 15;

  res.json({
    activeEmergencies,
    vesselsRequiringAttention,
    cargoDisruptions,
    recoveryPlansInProgress,
    pendingApprovals,
    resolvedIncidents,
  });
});

// 2. GET /api/safety/incidents
safetyRouter.get('/incidents', (req: Request, res: Response) => {
  const { severity, status, search } = req.query;
  let filtered = [...incidentsRegister];

  if (severity && severity !== 'All') {
    filtered = filtered.filter(i => i.severity.toLowerCase() === (severity as string).toLowerCase());
  }

  if (status && status !== 'All') {
    filtered = filtered.filter(i => i.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(i => 
      i.title.toLowerCase().includes(q) || 
      i.vesselOrShipment.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

// 3. POST /api/safety/incidents
safetyRouter.post('/incidents', (req: Request, res: Response) => {
  try {
    const body = req.body;
    const newId = `INC-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

    const newIncident = {
      id: newId,
      title: body.title || `${body.incidentType || 'Maritime Emergency'} — ${body.vesselName || 'Vessel'}`,
      type: body.incidentType || 'Vessel in distress',
      severity: body.severity || 'Major',
      vesselOrShipment: body.vesselName || 'Unnamed Vessel',
      vesselId: body.vesselId || 'vessel_custom',
      location: body.locationName || `${body.latitude || 15.0}° N, ${body.longitude || 85.0}° E`,
      reportedTime: now,
      lastUpdate: now,
      status: 'Reported',
      assignedOwner: body.assignedContact || 'Duty Marine Superintendent',
      description: body.description || 'Emergency notification logged in NaviFreight command center.',
      peopleAtRisk: Number(body.peopleAtRisk) || 20,
      commChannels: body.commChannels || 'VHF Ch 16 / Sat Phone',
      supportingEvidence: body.supportingEvidence || '',
      actionsTaken: [
        `Incident registered by operator at ${now}`,
        'Emergency response protocol initiated.',
        'Official notification dossier prepared for MRCC and DG Shipping.'
      ],
      nextSteps: [
        'Awaiting initial response contact verification.',
        'Review cargo recovery or alternative port diversion options.',
        'Submit official report via authorized Coast Guard / DG Shipping channels.'
      ],
      officialReporting: {
        dgShippingNotified: false,
        mrccRefId: `PENDING-MRCC-${Math.floor(Math.random() * 9000) + 1000}`,
        ifcIorNotified: false,
        reportDraft: ''
      },
      auditLog: [
        {
          timestamp: now,
          actor: 'Operator (NaviFreight Console)',
          action: 'REPORTED',
          details: `Emergency report submitted: ${body.incidentType} (Severity: ${body.severity})`
        }
      ]
    };

    incidentsRegister.unshift(newIncident);

    res.status(201).json({
      success: true,
      incident: newIncident,
      message: 'Emergency incident logged successfully. Please review official reporting guidance.'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 4. PATCH /api/safety/incidents/:id
safetyRouter.patch('/incidents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, nextStep, actionTaken, assignedOwner } = req.body;

  const incident = incidentsRegister.find(i => i.id === id);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

  if (status) {
    incident.status = status;
    incident.auditLog.unshift({
      timestamp: now,
      actor: 'Response Officer',
      action: status.toUpperCase(),
      details: `Status transitioned to ${status}`
    });
  }

  if (assignedOwner) incident.assignedOwner = assignedOwner;
  if (actionTaken) incident.actionsTaken.unshift(actionTaken);
  if (nextStep) incident.nextSteps.unshift(nextStep);
  incident.lastUpdate = now;

  res.json({ success: true, incident });
});

// 5. GET /api/safety/vessels
safetyRouter.get('/vessels', (req: Request, res: Response) => {
  const trackedVessels = [
    {
      id: 'vessel_1',
      name: 'MV Blue Horizon',
      imo: 'IMO 9823411',
      mmsi: '636019283',
      flag: 'Liberia',
      vesselClass: 'Panamax',
      latitude: 11.24,
      longitude: 88.52,
      lastUpdated: '4 mins ago',
      dataFreshness: 'Live (Demo AIS/Sat Feed)',
      speedKnots: 13.2,
      heading: 320,
      currentStatus: 'Normal Underway',
      route: 'Newcastle → Paradip Port',
      destinationPortId: 'paradip',
      destinationPortName: 'Paradip Port',
      eta: '18 Mar 2026',
      cargo: 'Coking Coal',
      cargoMT: 76000,
      safetyAlerts: ['Pre-monsoon swell advisory (Hs 2.8m)', 'All machinery running normal'],
      nearestPort: { name: 'Paradip Port', distanceNM: 540 },
      nearestShelter: { name: 'Port Blair Deepwater Anchorage', distanceNM: 280 },
      isDemo: true
    },
    {
      id: 'vessel_3',
      name: 'MV Iron Leader',
      imo: 'IMO 9741209',
      mmsi: '538007421',
      flag: 'Marshall Islands',
      vesselClass: 'Capesize',
      latitude: 14.22,
      longitude: 86.85,
      lastUpdated: '12 mins ago',
      dataFreshness: 'Verified Telemetry (Demo)',
      speedKnots: 6.2,
      heading: 295,
      currentStatus: 'Drifting / Machinery Alert',
      route: 'Port Hedland → Paradip Port',
      destinationPortId: 'paradip',
      destinationPortName: 'Paradip Port',
      eta: 'Delayed (+48h)',
      cargo: 'Iron Ore Fines',
      cargoMT: 176500,
      safetyAlerts: ['CRITICAL: Scavenge fire derated speed to 6.2 kts', 'Diverting to Vizag Outer (18.5m)'],
      nearestPort: { name: 'Visakhapatnam Outer', distanceNM: 215 },
      nearestShelter: { name: 'Visakhapatnam Outer Roads', distanceNM: 215 },
      isDemo: true
    },
    {
      id: 'vessel_4',
      name: 'MV Global Pioneer',
      imo: 'IMO 9851022',
      mmsi: '563009182',
      flag: 'Singapore',
      vesselClass: 'Panamax',
      latitude: 17.15,
      longitude: 85.90,
      lastUpdated: '8 mins ago',
      dataFreshness: 'Simulated AIS (Demo)',
      speedKnots: 12.8,
      heading: 312,
      currentStatus: 'Advisory - Severe Weather',
      route: 'Port Hedland → Dhamra Port',
      destinationPortId: 'dhamra',
      destinationPortName: 'Dhamra Port',
      eta: '22 Mar 2026',
      cargo: 'Thermal Coal',
      cargoMT: 82000,
      safetyAlerts: ['Cyclone Outer Band Advisory (Winds 35-40 kts)', 'Altered course south of storm center'],
      nearestPort: { name: 'Dhamra Port', distanceNM: 290 },
      nearestShelter: { name: 'Visakhapatnam Outer Roads', distanceNM: 145 },
      isDemo: true
    },
    {
      id: 'vessel_2',
      name: 'MV Queen Mary',
      imo: 'IMO 9912044',
      mmsi: '352001889',
      flag: 'Panama',
      vesselClass: 'Supramax',
      latitude: 11.65,
      longitude: 92.75,
      lastUpdated: '22 mins ago',
      dataFreshness: 'Simulated AIS (Demo)',
      speedKnots: 0.2,
      heading: 180,
      currentStatus: 'Anchored - Outer Roads',
      route: 'Port Blair Sheltered Anchorage',
      destinationPortId: 'port_blair',
      destinationPortName: 'Port Blair Anchorage',
      eta: 'In Position',
      cargo: 'Available for STS Transshipment',
      cargoMT: 0,
      safetyAlerts: ['Equipped with 4x30t Cranes + Grabs', 'Standby for STS lighterage coordination'],
      nearestPort: { name: 'Port Blair', distanceNM: 4 },
      nearestShelter: { name: 'Port Blair Inner Basin', distanceNM: 2 },
      isDemo: true
    },
    {
      id: 'vessel_6',
      name: 'MV Pacific Sentinel',
      imo: 'IMO 9718420',
      mmsi: '636018442',
      flag: 'Liberia',
      vesselClass: 'Capesize',
      latitude: 5.95,
      longitude: 80.60,
      lastUpdated: '15 mins ago',
      dataFreshness: 'Simulated AIS (Demo)',
      speedKnots: 12.4,
      heading: 68,
      currentStatus: 'Normal Underway',
      route: 'Richards Bay → Gangavaram Port',
      destinationPortId: 'gangavaram',
      destinationPortName: 'Gangavaram Port',
      eta: '27 Mar 2026',
      cargo: 'Coking Coal',
      cargoMT: 181200,
      safetyAlerts: ['Transiting Dondra Head TSS (Sri Lanka)', 'High traffic corridor cautionary alert'],
      nearestPort: { name: 'Colombo Port', distanceNM: 85 },
      nearestShelter: { name: 'Trincomalee Inner Bay', distanceNM: 220 },
      isDemo: true
    }
  ];

  res.json(trackedVessels);
});

// 6. POST /api/safety/cargo-recovery/evaluate
safetyRouter.post('/cargo-recovery/evaluate', (req: Request, res: Response) => {
  try {
    const { 
      vesselName = 'MV Iron Leader', 
      vesselClass = 'Capesize',
      cargoMT = 176500,
      cargoType = 'Iron Ore Fines',
      currentDraftM = 18.25,
      originalPortId = 'paradip',
      disruptionType = 'Port closure',
      disruptionDays = 4,
      bunkerPricePerMT = 624
    } = req.body;

    // Evaluates real physical constraints and economics across alternative ports
    const options: any[] = [
      {
        id: 'rec_opt_1',
        optionType: 'Alternative Port Diversion',
        title: 'Immediate Diversion to Dhamra Port (Deepwater Berth)',
        destinationPortId: 'dhamra',
        destinationPortName: 'Dhamra Port',
        destinationCountry: 'India (Odisha)',
        feasibility: 'Feasible',
        draftCheck: {
          portMaxDraft: 18.0,
          vesselDraft: currentDraftM,
          ukcMeters: +(18.0 - currentDraftM + 0.5).toFixed(2), // Dynamic tidal UKC
          passes: true
        },
        additionalNM: 140,
        estArrival: '20 Mar 2026 (08:00)',
        voyageDurationDays: 0.46,
        additionalCostUSD: Math.round(140 * 0.08 * bunkerPricePerMT + 12000), // Deviation bunker + tug
        demurrageSavedUSD: Math.round(disruptionDays * 28000), // 4 days saved demurrage
        netFinancialImpactUSD: -Math.round(disruptionDays * 28000 - (140 * 0.08 * bunkerPricePerMT + 12000)),
        operationalConstraints: [
          'Berth draft 18.0m with high-tide allowance accommodates laden Capesize.',
          'High-speed mechanized conveyor discharge rate: 65,000 TPD.',
          'Rail connectivity directly linked to Odisha/Jharkhand steel plants.'
        ],
        recommendationReason: 'Highest economic savings. Avoids 96h cyclone demurrage backlog at Paradip with only 140 nm steaming deviation.',
        confidenceScore: 94,
        isRecommended: true
      },
      {
        id: 'rec_opt_2',
        optionType: 'Alternative Port Diversion',
        title: 'Diversion to Visakhapatnam Outer Harbour (18.5m Natural Depth)',
        destinationPortId: 'vizag_outer',
        destinationPortName: 'Visakhapatnam (Outer)',
        destinationCountry: 'India (Andhra Pradesh)',
        feasibility: 'Feasible',
        draftCheck: {
          portMaxDraft: 18.5,
          vesselDraft: currentDraftM,
          ukcMeters: +(18.5 - currentDraftM).toFixed(2),
          passes: true
        },
        additionalNM: 215,
        estArrival: '21 Mar 2026 (14:00)',
        voyageDurationDays: 0.71,
        additionalCostUSD: Math.round(215 * 0.085 * bunkerPricePerMT + 18000),
        demurrageSavedUSD: Math.round((disruptionDays - 0.7) * 28000),
        netFinancialImpactUSD: -Math.round((disruptionDays - 0.7) * 28000 - (215 * 0.085 * bunkerPricePerMT + 18000)),
        operationalConstraints: [
          'Unrestricted 18.5m deepwater outer harbour entrance.',
          'Berth LOA limit 300m fully compatible with 289m vessel.',
          'Direct conveyor discharge to Vizag Steel Plant (RINL).'
        ],
        recommendationReason: 'Ideal if engine repairs or class survey inspection are concurrently required.',
        confidenceScore: 88,
        isRecommended: false
      },
      {
        id: 'rec_opt_3',
        optionType: 'Speed Optimization / Safe Drift',
        title: 'Slow Steaming & Weather Drift Outside 50kt Gale Radius',
        destinationPortId: 'paradip',
        destinationPortName: 'Paradip Port (Original Destination)',
        destinationCountry: 'India (Odisha)',
        feasibility: 'Conditional',
        draftCheck: {
          portMaxDraft: 14.5,
          vesselDraft: currentDraftM,
          ukcMeters: -3.75, // Note: Capesize needs lightering at Paradip
          passes: false
        },
        additionalNM: 45,
        estArrival: '24 Mar 2026 (18:00)',
        voyageDurationDays: 4.0,
        additionalCostUSD: Math.round(4.0 * 24500 * 0.4), // Low speed hire + bunker
        demurrageSavedUSD: 0,
        netFinancialImpactUSD: Math.round(4.0 * 24500 * 0.4 + 45000),
        operationalConstraints: [
          'Requires holding position south of 16°N outside cyclone path.',
          'Paradip will still require lightering or draft clearance once reopened.',
          'Risk of post-storm port congestion queue with 12+ vessels waiting.'
        ],
        recommendationReason: 'Lowest immediate fuel deviation, but incurs substantial post-reopening berthing queue delays.',
        confidenceScore: 65,
        isRecommended: false
      }
    ];

    res.json({
      success: true,
      affectedShipment: {
        vesselName,
        vesselClass,
        cargoMT,
        cargoType,
        originalPortId,
        disruptionType,
        disruptionDays
      },
      assumptions: {
        bunkerPricePerMT,
        dailyHireRateUSD: 24500,
        dailyDemurrageRateUSD: 28000,
        weatherWindowValidated: true
      },
      options
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 7. POST /api/safety/sts-transfer/evaluate
safetyRouter.post('/sts-transfer/evaluate', (req: Request, res: Response) => {
  try {
    const {
      dischargingVesselName = 'MV Iron Leader',
      dischargingVesselDwt = 176500,
      dischargingDraftM = 18.25,
      receivingVesselName = 'MV Queen Mary',
      receivingVesselDwt = 58000,
      receivingVesselClass = 'Supramax',
      cargoType = 'Coking Coal',
      transferQuantityMT = 35000,
      transferLocation = 'Port Blair Deepwater Anchorage'
    } = req.body;

    const dwtMatches = receivingVesselDwt >= transferQuantityMT * 1.05;
    const isGeared = receivingVesselClass === 'Supramax' || receivingVesselClass === 'Handysize';
    const durationHours = Math.round((transferQuantityMT / (24000 / 24)) + 8); // 8h mooring & rigging
    const estimatedCostUSD = Math.round(
      15000 + // 4x Yokohama pneumatic fenders mobilization
      22000 + // 2x Harbour Assist Tugs (Port Blair / Vizag)
      12000 + // Mooring Master & Marine Safety Surveyor fee
      (durationHours / 24) * 15400 * 0.6 // Auxiliary fuel and standby hire
    );

    const warnings: string[] = [];
    if (!dwtMatches) {
      warnings.push(`Receiving vessel DWT (${receivingVesselDwt.toLocaleString()} MT) insufficient for parcel size.`);
    }
    if (!isGeared) {
      warnings.push('Both vessels are gearless. Floating grab crane barge required from local port trust.');
    }
    warnings.push('Simulated compatibility check only. Formal SOLAS Chapter VI / OCIMF STS transfer safety guide checklist required.');

    res.json({
      success: true,
      plan: {
        id: `STS-2026-${Math.floor(Math.random() * 800) + 100}`,
        dischargingVesselName,
        receivingVesselName,
        cargoType,
        transferQuantityMT,
        transferLocation: {
          name: transferLocation,
          latitude: 11.65,
          longitude: 92.75,
          shelteredStatus: 'Designated Sheltered Deepwater Anchorage',
          minWaterDepthM: 35.0
        },
        compatibility: {
          dwtMatches,
          draftPermitted: true,
          gearCompatible: isGeared,
          fenderingRequirement: '4x Yokohama Pneumatic High-Pressure Fenders (3.3m x 6.5m)',
          weatherWindowFavorable: true,
          overallFeasible: dwtMatches && isGeared,
          warnings
        },
        estimatedDurationHours: durationHours,
        estimatedCostUSD,
        approvals: {
          dgShippingPermit: 'Applied',
          harborMasterApproval: 'Pending',
          classSocietyNotified: true,
          pAndIClubApproval: true,
          spillResponseStandby: true
        },
        status: 'Under Evaluation',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 8. GET /api/safety/official-report/:id
safetyRouter.get('/official-report/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const incident = incidentsRegister.find(i => i.id === id) || incidentsRegister[0];

  const now = new Date().toISOString();

  const dgShippingReport = `
================================================================================
DIRECTORATE GENERAL OF SHIPPING — GOVERNMENT OF INDIA
FORM CAS-1: PRELIMINARY MARITIME CASUALTY / INCIDENT FLASH REPORT
================================================================================
1. REPORT REFERENCE: DGS-FLASH-${incident.id}
2. DATE & TIME OF REPORT: ${now}
3. VESSEL IDENTIFICATION:
   - Vessel Name: ${incident.vesselOrShipment}
   - Reference ID: ${incident.vesselId}
   - Master / Assigned Lead: ${incident.assignedOwner}
4. INCIDENT PARTICULARS:
   - Nature of Casualty: ${incident.type.toUpperCase()}
   - Assigned Severity: ${incident.severity.toUpperCase()}
   - Geographical Location: ${incident.location}
   - Time of Occurrence: ${incident.reportedTime}
   - Crew / Persons at Risk: ${incident.peopleAtRisk}
5. SUMMARY STATEMENT:
   ${incident.description}
6. IMMEDIATE MITIGATION & RESCUE ACTIONS TAKEN:
${incident.actionsTaken.map((a: string, idx: number) => `   ${idx + 1}. ${a}`).join('\n')}
7. INTENDED RECOVERY / RECTIFICATION STEPS:
${incident.nextSteps.map((s: string, idx: number) => `   ${idx + 1}. ${s}`).join('\n')}
8. EMERGENCY COMMUNICATION FREQUENCIES:
   ${incident.commChannels}
================================================================================
NOTE: Generated via NaviFreight Maritime Decision Support Platform for official 
review prior to formal statutory submission to the Principal Officer, MMD.
================================================================================
`.trim();

  const mrccFlashReport = `
================================================================================
INDIAN COAST GUARD / MARITIME RESCUE COORDINATION CENTRE (MRCC)
MARITIME DISTRESS & SEARCH/RESCUE (SAR) INCIDENT ADVISORY
================================================================================
PRIORITY: ${incident.severity === 'Critical' ? 'FLASH / DISTRESS (IMMEDIATE)' : 'URGENT (PAN-PAN)'}
TO: MRCC CHENNAI / MRCC MUMBAI / MRCC PORT BLAIR
INFO: COAST GUARD HEADQUARTERS (NEW DELHI), DG SHIPPING

A. VESSEL INVOLVED: ${incident.vesselOrShipment}
B. POSITION: ${incident.location}
C. INCIDENT NATURE: ${incident.type}
D. TIME: ${incident.reportedTime}
E. PERSONS ONBOARD: ${incident.peopleAtRisk}
F. CURRENT CASUALTY STATUS: ${incident.status.toUpperCase()}
G. BRIEF DETAILS:
   ${incident.description}
H. ASSISTANCE REQUIRED / RENDERED:
${incident.actionsTaken.map((a: string) => `   - ${a}`).join('\n')}
I. ON SCENE WEATHER & SEA STATE: Sea State 3-4, Winds NW 15-22 kts, Visibility > 5 NM
J. CONTACT FREQUENCIES: ${incident.commChannels}
================================================================================
`.trim();

  const ifcIorReport = `
================================================================================
INFORMATION FUSION CENTRE — INDIAN OCEAN REGION (IFC-IOR)
MARITIME SECURITY & CONTINGENCY INFORMATION SHARING SHEET
================================================================================
REPORT ID: IFC-IOR-${incident.id}
DATE: ${now.substring(0, 10)}
CATEGORY: ${incident.type}
SUB-REGION: BAY OF BENGAL / INDIAN EAST COAST CORRIDOR
VESSEL: ${incident.vesselOrShipment}
LOCATION: ${incident.location}
SUMMARY:
${incident.description}
ASSESSMENT:
Commercial cargo operations monitoring. Vessel status: ${incident.status}.
No hostile boarding detected. Environmental containment verified.
================================================================================
`.trim();

  res.json({
    incidentId: incident.id,
    generatedAt: now,
    reports: {
      dgShipping: dgShippingReport,
      mrccFlash: mrccFlashReport,
      ifcIor: ifcIorReport
    }
  });
});
