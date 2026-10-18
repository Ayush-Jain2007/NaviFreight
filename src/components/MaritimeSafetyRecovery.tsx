import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  LifeBuoy,
  Ship,
  Compass,
  Anchor,
  Clock,
  Radio,
  MapPin,
  FileText,
  PhoneCall,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Scale,
  RefreshCw,
  Share2,
  Download,
  Copy,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  Calendar,
  AlertOctagon,
  Eye,
  Send,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import {
  EmergencyReport,
  EmergencyIncidentType,
  IncidentSeverity,
  IncidentStatus,
  TrackedSafetyVessel,
  CargoDisruption,
  CargoRecoveryOption,
  STSTransferPlan,
  IncidentRecord,
  SafetySummaryMetrics
} from '../types';
import { PORTS_DATABASE, VESSELS_DATABASE, COMMODITIES_DATABASE } from '../data/maritimeData';
import { naviApi } from '../services/api';
import { BayOfBengalSafetyMap } from './BayOfBengalSafetyMap';

interface MaritimeSafetyRecoveryProps {
  onNavigateTab?: (tab: string) => void;
}

type SafetySubTab = 'overview' | 'sos' | 'tracking' | 'recovery' | 'sts' | 'incidents';

export const MaritimeSafetyRecovery: React.FC<MaritimeSafetyRecoveryProps> = ({ onNavigateTab }) => {
  // Navigation & Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<SafetySubTab>('overview');

  // Summary KPIs
  const [metrics, setMetrics] = useState<SafetySummaryMetrics>({
    activeEmergencies: 2,
    vesselsRequiringAttention: 3,
    cargoDisruptions: 2,
    recoveryPlansInProgress: 1,
    pendingApprovals: 1,
    resolvedIncidents: 16,
  });

  // Unified Incident Register
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);

  // Fleet Tracking Data
  const [vessels, setVessels] = useState<TrackedSafetyVessel[]>([]);
  const [loadingVessels, setLoadingVessels] = useState<boolean>(false);
  const [vesselFilter, setVesselFilter] = useState<string>('All');

  // SOS Emergency Form State
  const [sosVesselId, setSosVesselId] = useState<string>(VESSELS_DATABASE[2].id); // Default MV Iron Leader
  const [sosIncidentType, setSosIncidentType] = useState<EmergencyIncidentType>('Vessel breakdown');
  const [sosSeverity, setSosSeverity] = useState<IncidentSeverity>('Major');
  const [sosLocation, setSosLocation] = useState<string>('Central Bay of Bengal (14.22° N, 86.85° E)');
  const [sosPeopleAtRisk, setSosPeopleAtRisk] = useState<number>(24);
  const [sosDescription, setSosDescription] = useState<string>('');
  const [sosComms, setSosComms] = useState<string>('VHF Ch 16 / Inmarsat-C / FleetBroadband');
  const [sosEvidence, setSosEvidence] = useState<string>('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [submittingSos, setSubmittingSos] = useState<boolean>(false);
  const [sosSuccessBanner, setSosSuccessBanner] = useState<string | null>(null);

  // Smart Cargo Recovery State
  const [selectedDisruptedVesselId, setSelectedDisruptedVesselId] = useState<string>('vessel_3');
  const [selectedDisruptionType, setSelectedDisruptionType] = useState<string>('Port closure');
  const [disruptionDurationDays, setDisruptionDurationDays] = useState<number>(4);
  const [recoveryOptions, setRecoveryOptions] = useState<CargoRecoveryOption[]>([]);
  const [loadingRecovery, setLoadingRecovery] = useState<boolean>(false);
  const [selectedRecoveryOption, setSelectedRecoveryOption] = useState<string | null>(null);

  // Ship-to-Ship Transfer State
  const [stsDischargingId, setStsDischargingId] = useState<string>('vessel_3'); // Capesize
  const [stsReceivingId, setStsReceivingId] = useState<string>('vessel_2'); // Geared Supramax
  const [stsCargoType, setStsCargoType] = useState<string>('Coking Coal');
  const [stsQuantityMT, setStsQuantityMT] = useState<number>(35000);
  const [stsLocation, setStsLocation] = useState<string>('Port Blair Deepwater Anchorage');
  const [stsPlan, setStsPlan] = useState<STSTransferPlan | null>(null);
  const [loadingSts, setLoadingSts] = useState<boolean>(false);
  const [stsHighlight, setStsHighlight] = useState<boolean>(false);
  const [isStsModalOpen, setIsStsModalOpen] = useState<boolean>(false);
  const [isStsDossierModalOpen, setIsStsDossierModalOpen] = useState<boolean>(false);
  const [submittingStsOrder, setSubmittingStsOrder] = useState<boolean>(false);
  const [stsApprovalsChecklist, setStsApprovalsChecklist] = useState({
    dgShippingPermit: true,
    harborMasterClearance: true,
    mwsWarrantySurveyor: true,
    oilSpillStandby: true
  });

  // Official Report Modal
  const [officialReportModal, setOfficialReportModal] = useState<{
    isOpen: boolean;
    incidentId: string;
    activeTab: 'dgShipping' | 'mrccFlash' | 'ifcIor';
    reports: { dgShipping: string; mrccFlash: string; ifcIor: string };
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Initial Data Fetch
  const loadDashboardData = () => {
    setLoadingIncidents(true);
    setLoadingVessels(true);

    naviApi.getSafetySummary().then(setMetrics).catch(console.error);

    naviApi.getIncidents({
      severity: filterSeverity,
      status: filterStatus,
      search: searchQuery
    }).then(data => {
      setIncidents(data);
      setLoadingIncidents(false);
    }).catch(() => setLoadingIncidents(false));

    naviApi.getSafetyVessels().then(data => {
      setVessels(data);
      setLoadingVessels(false);
    }).catch(() => setLoadingVessels(false));
  };

  useEffect(() => {
    loadDashboardData();
  }, [filterSeverity, filterStatus, searchQuery]);

  // Initial Cargo Recovery Evaluation
  useEffect(() => {
    const vessel = VESSELS_DATABASE.find(v => v.id === selectedDisruptedVesselId) || VESSELS_DATABASE[2];
    setLoadingRecovery(true);
    naviApi.evaluateCargoRecovery({
      vesselName: vessel.name,
      vesselClass: vessel.vesselClass,
      cargoMT: vessel.dwt * 0.95,
      cargoType: 'Iron Ore Fines',
      currentDraftM: vessel.draftMeters,
      originalPortId: 'paradip',
      disruptionType: selectedDisruptionType,
      disruptionDays: disruptionDurationDays,
      bunkerPricePerMT: 624
    }).then(res => {
      if (res.success && res.options) {
        setRecoveryOptions(res.options);
        setSelectedRecoveryOption(res.options[0]?.id || null);
      }
      setLoadingRecovery(false);
    }).catch(() => setLoadingRecovery(false));
  }, [selectedDisruptedVesselId, selectedDisruptionType, disruptionDurationDays]);

  // Run STS Evaluation Function
  const runStsEvaluation = async (
    dischId = stsDischargingId,
    recId = stsReceivingId,
    cargo = stsCargoType,
    qty = stsQuantityMT,
    loc = stsLocation
  ) => {
    const discharging = VESSELS_DATABASE.find(v => v.id === dischId) || VESSELS_DATABASE[2];
    const receiving = VESSELS_DATABASE.find(v => v.id === recId) || VESSELS_DATABASE[1];
    setLoadingSts(true);
    try {
      const res = await naviApi.evaluateSTSTransfer({
        dischargingVesselName: discharging.name,
        dischargingVesselDwt: discharging.dwt,
        dischargingDraftM: discharging.draftMeters,
        receivingVesselName: receiving.name,
        receivingVesselDwt: receiving.dwt,
        receivingVesselClass: receiving.vesselClass,
        cargoType: cargo,
        transferQuantityMT: qty,
        transferLocation: loc
      });
      if (res.success && res.plan) {
        setStsPlan(res.plan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSts(false);
    }
  };

  // Initial and reactive STS Evaluation
  useEffect(() => {
    runStsEvaluation();
  }, [stsDischargingId, stsReceivingId, stsCargoType, stsQuantityMT, stsLocation]);

  // Apply Quick STS Scenario Presets
  const handleApplyStsPreset = (presetKey: 'port_blair' | 'vizag' | 'trincomalee') => {
    if (presetKey === 'port_blair') {
      setStsDischargingId('vessel_3');
      setStsReceivingId('vessel_2');
      setStsLocation('Port Blair Deepwater Anchorage');
      setStsCargoType('Coking Coal');
      setStsQuantityMT(35000);
      runStsEvaluation('vessel_3', 'vessel_2', 'Coking Coal', 35000, 'Port Blair Deepwater Anchorage');
    } else if (presetKey === 'vizag') {
      setStsDischargingId('vessel_6');
      setStsReceivingId('vessel_5');
      setStsLocation('Visakhapatnam Outer Roads');
      setStsCargoType('Iron Ore Fines');
      setStsQuantityMT(25000);
      runStsEvaluation('vessel_6', 'vessel_5', 'Iron Ore Fines', 25000, 'Visakhapatnam Outer Roads');
    } else if (presetKey === 'trincomalee') {
      setStsDischargingId('vessel_1');
      setStsReceivingId('vessel_2');
      setStsLocation('Trincomalee Inner Bay');
      setStsCargoType('Thermal Coal');
      setStsQuantityMT(18000);
      runStsEvaluation('vessel_1', 'vessel_2', 'Thermal Coal', 18000, 'Trincomalee Inner Bay');
    }
  };

  // Smooth Navigation and Tab Opener
  const handleOpenTab = (tab: SafetySubTab) => {
    setActiveSubTab(tab);
    if (tab === 'sts') {
      setStsHighlight(true);
      setTimeout(() => setStsHighlight(false), 3000);
      runStsEvaluation();
    }
    setTimeout(() => {
      const targetId = 
        tab === 'sts' ? 'sts-transfer-workspace' :
        tab === 'sos' ? 'sos-emergency-workspace' :
        tab === 'recovery' ? 'cargo-recovery-workspace' :
        tab === 'tracking' ? 'tracking-workspace' :
        tab === 'incidents' ? 'incidents-workspace' : 'overview-workspace';
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Handle Official STS Order Submission
  const handleConfirmSubmitStsOrder = async () => {
    if (!stsPlan) return;
    setSubmittingStsOrder(true);
    const discharging = VESSELS_DATABASE.find(v => v.id === stsDischargingId) || VESSELS_DATABASE[2];
    const receiving = VESSELS_DATABASE.find(v => v.id === stsReceivingId) || VESSELS_DATABASE[1];
    
    try {
      const res = await naviApi.reportEmergency({
        vesselId: discharging.id,
        vesselName: `${discharging.name} ➔ ${receiving.name} (STS Transfer)`,
        vesselClass: discharging.vesselClass,
        incidentType: 'Ship-to-Ship (STS) Transfer' as any,
        severity: 'Moderate',
        locationName: stsLocation,
        incidentTime: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        description: `Statutory STS Lighterage Order ${stsPlan.id} authorized. Discharging ${stsQuantityMT.toLocaleString()} MT ${stsCargoType} from ${discharging.name} (${discharging.vesselClass}) into daughter vessel ${receiving.name} (${receiving.vesselClass}) at ${stsLocation}. Fendering: ${stsPlan.compatibility.fenderingRequirement}. Estimated duration: ${stsPlan.estimatedDurationHours}h. Cost: $${stsPlan.estimatedCostUSD.toLocaleString()} USD.`,
        peopleAtRisk: 0,
        commChannels: 'VHF Ch 14 / VHF Ch 16 / Sat-C DSC',
        supportingEvidence: `DG Shipping Coastal Permit: Approved; Harbor Master Clearance: Granted; MWS Surveyor: Mobilized; Oil Spill Standby: Active.`,
        assignedContact: 'Capt. P. V. Sharma (Senior Mooring Master / Marine Warranty Surveyor)'
      });

      if (res.success) {
        setMetrics(prev => ({
          ...prev,
          pendingApprovals: prev.pendingApprovals + 1,
          recoveryPlansInProgress: prev.recoveryPlansInProgress + 1
        }));
        setSosSuccessBanner(`✓ STS Transfer Operation Order ${stsPlan.id} authorized successfully. Statutory permit dossier submitted to DG Shipping & Port Trust.`);
        loadDashboardData();
        setIsStsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingStsOrder(false);
    }
  };

  // Generate Official STS Compliance Dossier Text
  const getStsDossierText = () => {
    if (!stsPlan) return 'No STS Plan available.';
    const locName = typeof stsPlan.transferLocation === 'string' ? stsPlan.transferLocation : stsPlan.transferLocation?.name || stsLocation;
    return `================================================================================
DIRECTORATE GENERAL OF SHIPPING & PORT TRUST STATUTORY CLEARANCE DOSSIER
MARITIME SAFETY & RECOVERY COMMAND — SHIP-TO-SHIP (STS) DRY BULK LIGHTERAGE
DOCUMENT REF: STS-AUTH-${stsPlan.id}
DATE / TIME OF ISSUANCE: ${new Date().toISOString().replace('T', ' ').substring(0, 16)} UTC
================================================================================

1. OPERATION OVERVIEW & VESSEL TELEMETRY:
   - Operation Type: Dry Bulk Transshipment / Emergency Lighterage
   - Mother / Discharging Vessel: ${stsPlan.dischargingVesselName}
   - Daughter / Receiving Vessel: ${stsPlan.receivingVesselName}
   - Designated Sheltered Anchorage: ${locName}
   - Coordinates: 11.65° N, 92.75° E (Sheltered Deepwater Roads)
   - Minimum Safe Water Depth: 35.0 meters (Under-keel safety clearance verified)
   - Cargo Type: ${stsPlan.cargoType || stsCargoType}
   - Parcel Size Authorized: ${stsPlan.transferQuantityMT.toLocaleString()} MT

2. PHYSICAL COMPATIBILITY & HYDRODYNAMIC ASSESSMENT:
   - DWT Capacity Match: ${stsPlan.compatibility.dwtMatches ? 'VERIFIED (Receiving vessel DWT sufficient)' : 'INSUFFICIENT DWT'}
   - Crane & Gear Compatibility: ${stsPlan.compatibility.gearCompatible ? 'COMPATIBLE (Receiving vessel fitted with 4x30t cranes + grabs)' : 'REQUIRES FLOATING CRANE BARGE'}
   - Fendering Requirement: ${stsPlan.compatibility.fenderingRequirement}
   - Safe Operating Weather Window: Max Significant Wave Height (Hs) <= 1.5m, Wind <= 20 kts
   - Mooring Configuration: Port-to-starboard parallel breast lines with wire spring lines

3. STATUTORY REGULATORY CLEARANCES (IMO SOLAS / MARPOL):
   - DG Shipping Coastal Trading & Lighterage Permit: ${stsPlan.approvals.dgShippingPermit}
   - Port Harbor Master Anchorage Permit: ${stsPlan.approvals.harborMasterApproval}
   - Marine Warranty Surveyor (MWS) Class Attendance: NOTIFIED & MOBILIZED
   - Tier-1 Oil Spill Response Standby: ON ACTIVE WATCH (Tug assist on station)
   - Dedicated Mooring Master: ASSIGNED (Capt. P. V. Sharma, Cert. #MM-9844)

4. EMERGENCY TELECOMMUNICATIONS & CHANNELS:
   - Working VHF Channel: VHF Ch 14 (Port Operations), VHF Ch 16 (Distress/Watch)
   - Navigational Warning Broadcast: NOTICE TO MARINERS BROADCAST (500m Safety Exclusion Zone)
   - Harbor Master Hotline: +91-3192-232515 (Port Blair Port Trust)
   - Search & Rescue Coordination: MRCC Port Blair / MRCC Chennai

5. TIMELINE & FINANCIAL SUMMARY:
   - Estimated Transfer Duration: ${stsPlan.estimatedDurationHours} Hours (~${(stsPlan.estimatedDurationHours / 24).toFixed(1)} Days)
   - Total Estimated Mobilization Cost: $${stsPlan.estimatedCostUSD.toLocaleString()} USD
   - Demurrage Delay Savings: ~$95,000 USD preserved by early channel clearance

================================================================================
AUTHORIZED BY: NAVIFREIGHT MARITIME SAFETY & RECOVERY CONSOLE
CHIEF HARBOR MASTER & STATUTORY SURVEYOR COPY
================================================================================`;
  };

  // Handle Emergency Submission
  const handleConfirmSubmitEmergency = async () => {
    setSubmittingSos(true);
    const vessel = VESSELS_DATABASE.find(v => v.id === sosVesselId) || VESSELS_DATABASE[2];
    const res = await naviApi.reportEmergency({
      vesselId: vessel.id,
      vesselName: vessel.name,
      vesselClass: vessel.vesselClass,
      incidentType: sosIncidentType,
      severity: sosSeverity,
      locationName: sosLocation,
      incidentTime: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      description: sosDescription || `${sosIncidentType} reported on ${vessel.name}. Immediate carrier response team mobilized.`,
      peopleAtRisk: sosPeopleAtRisk,
      commChannels: sosComms,
      supportingEvidence: sosEvidence,
      assignedContact: 'Capt. R. K. Nair (Head of Maritime Safety)'
    });

    setSubmittingSos(false);
    setIsConfirmModalOpen(false);
    if (res.success) {
      setSosSuccessBanner(`Emergency Report ${res.incident.id} registered successfully. Official notification dossiers prepared.`);
      loadDashboardData();
      setActiveSubTab('incidents');
    }
  };

  // Open Official Report Modal
  const handleOpenOfficialReport = async (incidentId: string) => {
    const reportData = await naviApi.getOfficialReport(incidentId);
    setOfficialReportModal({
      isOpen: true,
      incidentId,
      activeTab: 'dgShipping',
      reports: reportData.reports
    });
  };

  const handleCopyReport = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Success Notice */}
      {sosSuccessBanner && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sosSuccessBanner}</span>
          </div>
          <button
            onClick={() => setSosSuccessBanner(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar with Quick Action CTAs */}
      <div className="bg-gradient-to-r from-[#0d1d36] via-[#102444] to-[#0a182d] rounded-2xl border border-slate-700/80 p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Maritime Safety & Recovery Command Center
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              ACTIVE WATCH 24/7
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Unified casualty response, real-time fleet safety telemetry, cargo disruption recovery, and statutory DG Shipping & Coast Guard MRCC coordination.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
          <button
            onClick={() => handleOpenTab('sos')}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'sos'
                ? 'bg-rose-700 text-white ring-2 ring-rose-400 shadow-md shadow-rose-950/60'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/50'
            }`}
          >
            <Radio className="w-4 h-4 animate-ping" />
            <span>Report Emergency SOS</span>
            {activeSubTab === 'sos' && (
              <span className="w-2 h-2 rounded-full bg-rose-300 animate-pulse ml-0.5" />
            )}
          </button>
          <button
            onClick={() => handleOpenTab('recovery')}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'recovery'
                ? 'bg-amber-700 text-white ring-2 ring-amber-400 shadow-md shadow-amber-950/60'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/40'
            }`}
          >
            <RotateCcwIcon className="w-4 h-4" />
            <span>Cargo Recovery</span>
            {activeSubTab === 'recovery' && (
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* 6 Top KPI Summary Cards (Interactive Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Active Emergencies */}
        <div
          onClick={() => {
            handleOpenTab('incidents');
            setFilterSeverity('Critical');
          }}
          className="bg-white rounded-xl border border-rose-200 p-3 shadow-2xs hover:border-rose-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Active Emergencies</span>
            <div className="w-6 h-6 rounded bg-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            {metrics.activeEmergencies}
          </div>
          <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">Critical / Major SOS</span>
        </div>

        {/* Card 2: Vessels Requiring Attention */}
        <div
          onClick={() => {
            handleOpenTab('tracking');
            setVesselFilter('Advisory');
          }}
          className="bg-white rounded-xl border border-amber-200 p-3 shadow-2xs hover:border-amber-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Vessels Alerted</span>
            <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Ship className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1">
            {metrics.vesselsRequiringAttention}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">Advisory / Derated</span>
        </div>

        {/* Card 3: Cargo Disruptions */}
        <div
          onClick={() => handleOpenTab('recovery')}
          className="bg-white rounded-xl border border-blue-200 p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Cargo Disruptions</span>
            <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-800 font-mono mt-1">
            {metrics.cargoDisruptions}
          </div>
          <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">Port / Weather Delay</span>
        </div>

        {/* Card 4: Recovery Plans Active */}
        <div
          onClick={() => handleOpenTab('recovery')}
          className="bg-white rounded-xl border border-teal-200 p-3 shadow-2xs hover:border-teal-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Recovery Active</span>
            <div className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
              <Compass className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-800 font-mono mt-1">
            {metrics.recoveryPlansInProgress}
          </div>
          <span className="text-[10px] text-teal-600 font-semibold block mt-0.5">Diversion Steaming</span>
        </div>

        {/* Card 5: Pending Approvals */}
        <div
          onClick={() => handleOpenTab('recovery')}
          className="bg-white rounded-xl border border-indigo-200 p-3 shadow-2xs hover:border-indigo-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Pending Approvals</span>
            <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-800 font-mono mt-1">
            {metrics.pendingApprovals}
          </div>
          <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">Harbor Master Sign-Off</span>
        </div>

        {/* Card 6: Resolved Incidents */}
        <div
          onClick={() => {
            handleOpenTab('incidents');
            setFilterStatus('Resolved');
          }}
          className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-slate-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Resolved Events</span>
            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-700 font-mono mt-1">
            {metrics.resolvedIncidents}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Archived Logs</span>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Command Overview', icon: <Activity className="w-3.5 h-3.5" /> },
          { id: 'sos', label: 'Maritime SOS & Emergency Response', icon: <Radio className="w-3.5 h-3.5 text-rose-600" /> },
          { id: 'tracking', label: 'Vessel Tracking & Safety Radar', icon: <MapPin className="w-3.5 h-3.5 text-teal-600" /> },
          { id: 'recovery', label: 'Smart Cargo Disruption Recovery', icon: <RotateCcwIcon className="w-3.5 h-3.5 text-amber-600" /> },
          { id: 'incidents', label: 'Incident Register & Official Coordination', icon: <FileText className="w-3.5 h-3.5 text-slate-600" /> },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleOpenTab(tab.id as SafetySubTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#0f2942] text-white shadow-2xs font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: COMMAND OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Statutory Emergency Guidance Box */}
          <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-rose-950/90 border border-red-500/50 rounded-xl p-4 text-white shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                  <PhoneCall className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                    CRITICAL MARITIME RESCUE COORDINATION NOTICE
                  </h4>
                  <p className="text-xs text-red-200/90 mt-0.5 leading-relaxed">
                    This module is a commercial carrier incident logging & operational decision-support tool. In genuine distress or life-threatening emergencies, notify statutory Search & Rescue authorities immediately via international GMDSS frequencies.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono shrink-0">
                <div className="px-2.5 py-1 rounded bg-black/40 border border-red-400/30 text-red-200">
                  <strong className="text-white block font-sans text-[10px]">MRCC CHENNAI (East)</strong>
                  +91-44-23460405
                </div>
                <div className="px-2.5 py-1 rounded bg-black/40 border border-red-400/30 text-red-200">
                  <strong className="text-white block font-sans text-[10px]">MRCC PORT BLAIR</strong>
                  +91-3192-245530
                </div>
                <div className="px-2.5 py-1 rounded bg-black/40 border border-red-400/30 text-red-200">
                  <strong className="text-white block font-sans text-[10px]">INTERNATIONAL DISTRESS</strong>
                  VHF Ch 16 / DSC 2187.5
                </div>
              </div>
            </div>
          </div>

          {/* Live Bay of Bengal Safety & Distress Plotter (Matches User Photograph) */}
          <BayOfBengalSafetyMap
            onOpenIncident={(incId) => handleOpenOfficialReport(incId)}
            onNavigateTab={onNavigateTab}
          />

          {/* Grid: Live Safety Incidents vs Fleet Safety Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Recent Casualty Reports & Active Warnings (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Active Casualty & Disruption Feed
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSubTab('incidents')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All {incidents.length} Records</span>
                  <span>→</span>
                </button>
              </div>

              <div className="space-y-3">
                {incidents.slice(0, 3).map((incident) => (
                  <div
                    key={incident.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            incident.severity === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                            incident.severity === 'Major' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {incident.severity}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {incident.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {incident.id}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {incident.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                          {incident.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          incident.status === 'Reported' ? 'bg-rose-100 text-rose-700' :
                          incident.status === 'Escalated' ? 'bg-red-100 text-red-800 font-bold' :
                          incident.status === 'Recovery in Progress' ? 'bg-teal-100 text-teal-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {incident.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {incident.reportedTime}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[240px]">{incident.location}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenOfficialReport(incident.id)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                        >
                          Official Flash Report
                        </button>
                        <button
                          onClick={() => {
                            setSelectedIncident(incident);
                            setActiveSubTab('incidents');
                          }}
                          className="text-blue-600 font-bold text-xs hover:underline cursor-pointer"
                        >
                          Manage →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Fleet Safety Status Board (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-teal-600" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Fleet Safety Watch
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-mono">
                    DEMO DATA — NOT LIVE TRACKING
                  </span>
                </div>

                <div className="space-y-2.5">
                  {vessels.map((v) => {
                    const isDistress = v.currentStatus.includes('Distress') || v.currentStatus.includes('Machinery');
                    const isAdvisory = v.currentStatus.includes('Advisory');
                    return (
                      <div
                        key={v.id}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          isDistress
                            ? 'bg-rose-50/80 border-rose-300'
                            : isAdvisory
                            ? 'bg-amber-50/80 border-amber-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Ship className={`w-3.5 h-3.5 ${isDistress ? 'text-rose-600' : isAdvisory ? 'text-amber-600' : 'text-blue-600'}`} />
                            {v.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            isDistress ? 'bg-rose-100 text-rose-700' : isAdvisory ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {v.currentStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 mt-1">
                          <div>
                            <span className="text-slate-400">Position: </span>
                            <span className="font-mono font-medium">{v.latitude.toFixed(2)}°N, {v.longitude.toFixed(2)}°E</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Speed: </span>
                            <span className="font-mono font-bold text-slate-800">{v.speedKnots} kts</span>
                          </div>
                          <div className="col-span-2 text-slate-700 font-semibold truncate">
                            {v.route}
                          </div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">Nearest Refuge: <strong>{v.nearestShelter.name} ({v.nearestShelter.distanceNM} nm)</strong></span>
                          <button
                            onClick={() => {
                              setSelectedDisruptedVesselId(v.id);
                              setActiveSubTab('recovery');
                            }}
                            className="text-blue-600 font-bold hover:underline cursor-pointer"
                          >
                            Plan Recovery →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>All 5 tracked vessels monitored under IMO SOLAS Watch</span>
                <button
                  onClick={() => setActiveSubTab('tracking')}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Full Radar Screen →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MARITIME SOS & EMERGENCY RESPONSE */}
      {activeSubTab === 'sos' && (
        <div className="space-y-6">
          {/* Official Emergency Contact Banner */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-900 text-xs shadow-2xs">
            <div className="flex items-start gap-3">
              <LifeBuoy className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-bold text-red-950 block">Official Emergency Reporting Protocols</strong>
                <p className="text-red-800 mt-0.5 leading-relaxed">
                  Use this console to submit an internal carrier emergency casualty alert and generate pre-formatted dossiers for the <strong>Directorate General of Shipping (DG Shipping)</strong> and <strong>Indian Coast Guard (MRCC)</strong>. For life-threatening emergencies at sea, immediately broadcast on international distress frequency <strong>VHF Channel 16 / DSC 2187.5 kHz</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Form Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Maritime Emergency & Casualty Report Form</h3>
                <p className="text-xs text-slate-500">Submit verified casualty details for carrier response triage and official flash broadcasting.</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-rose-100 text-rose-700 font-mono">
                EMERGENCY PRIORITY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Vessel Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vessel Name / Identification *
                </label>
                <select
                  value={sosVesselId}
                  onChange={(e) => setSosVesselId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {VESSELS_DATABASE.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.vesselClass} • {v.dwt.toLocaleString()} DWT • Flag: {v.flag})
                    </option>
                  ))}
                  <option value="other_vessel">Other / Third-Party Commercial Vessel</option>
                </select>
              </div>

              {/* Incident Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Incident Type *
                </label>
                <select
                  value={sosIncidentType}
                  onChange={(e) => setSosIncidentType(e.target.value as EmergencyIncidentType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Vessel in distress">Vessel in distress</option>
                  <option value="Medical emergency onboard">Medical emergency onboard</option>
                  <option value="Fire or explosion">Fire or explosion</option>
                  <option value="Vessel breakdown">Vessel breakdown</option>
                  <option value="Collision or grounding">Collision or grounding</option>
                  <option value="Piracy or security threat">Piracy or security threat</option>
                  <option value="Severe weather">Severe weather / Cyclone</option>
                  <option value="Man overboard">Man overboard</option>
                  <option value="Other maritime emergencies">Other maritime emergencies</option>
                </select>
              </div>

              {/* Incident Severity */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Incident Severity *
                </label>
                <select
                  value={sosSeverity}
                  onChange={(e) => setSosSeverity(e.target.value as IncidentSeverity)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Critical">Critical (Immediate Danger to Vessel / Lives)</option>
                  <option value="Major">Major (Immobilized / Serious Casualty)</option>
                  <option value="Moderate">Moderate (Controlled Mechanical / Operational Issue)</option>
                  <option value="Minor">Minor (Safety Advisory Only)</option>
                </select>
              </div>

              {/* Geographical Location */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Geographical Location / Coordinates *
                </label>
                <input
                  type="text"
                  value={sosLocation}
                  onChange={(e) => setSosLocation(e.target.value)}
                  placeholder="e.g. 14.22° N, 86.85° E (Central Bay of Bengal)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* People at Risk */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Total Crew / People at Risk
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={sosPeopleAtRisk}
                  onChange={(e) => setSosPeopleAtRisk(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Comms Channel */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Active Emergency Comms Channels
                </label>
                <input
                  type="text"
                  value={sosComms}
                  onChange={(e) => setSosComms(e.target.value)}
                  placeholder="VHF Ch 16 / Sat Phone / Inmarsat"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Incident Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">
                Incident Description & Master's Initial Casualty Assessment *
              </label>
              <textarea
                rows={3}
                value={sosDescription}
                onChange={(e) => setSosDescription(e.target.value)}
                placeholder="Describe current casualty status, damage assessment, engine status, weather conditions, or medical vitals..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Supporting Evidence / Telemetry */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">
                Supporting Evidence / Telemetry / Log Extracts (Optional)
              </label>
              <input
                type="text"
                value={sosEvidence}
                onChange={(e) => setSosEvidence(e.target.value)}
                placeholder="Engine RPM derated to 42%, List 3° starboard, Bilge soundings normal, etc."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Submission requires human confirmation review step before logging.
              </span>
              <button
                onClick={() => setIsConfirmModalOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>Review & Report Emergency</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: VESSEL TRACKING & SAFETY RADAR */}
      {activeSubTab === 'tracking' && (
        <div className="space-y-6">
          {/* Tracking Header Bar with Verified Demo Badge */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Vessel Tracking & Incident Proximity Board
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AIS and telemetry tracking of commercial dry bulk carriers in the Indian Ocean & Bay of Bengal corridors.
              </p>
            </div>

            {/* Prominent Mandatory Demo Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>DEMO DATA — NOT LIVE TRACKING</span>
            </div>
          </div>

          {/* Live Bay of Bengal Safety & Distress Plotter (Matches User Photograph) */}
          <BayOfBengalSafetyMap
            onOpenIncident={(incId) => handleOpenOfficialReport(incId)}
            onNavigateTab={onNavigateTab}
          />

          {/* Detailed Vessel Fleet Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Vessel Fleet Status & Incident Proximity
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filter Status:</span>
                <select
                  value={vesselFilter}
                  onChange={(e) => setVesselFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="All">All Tracked Vessels ({vessels.length})</option>
                  <option value="Normal">Normal Underway</option>
                  <option value="Advisory">Advisory / Derated</option>
                  <option value="Anchored">Anchored</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Vessel & Identity</th>
                    <th className="py-2.5 px-3">Class & Flag</th>
                    <th className="py-2.5 px-3">Last Known Position</th>
                    <th className="py-2.5 px-3">Speed / Heading</th>
                    <th className="py-2.5 px-3">Reported Status</th>
                    <th className="py-2.5 px-3">Nearest Port & Refuge</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vessels
                    .filter(v => vesselFilter === 'All' || v.currentStatus.toLowerCase().includes(vesselFilter.toLowerCase()))
                    .map((vessel) => (
                      <tr key={vessel.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{vessel.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{vessel.imo} • MMSI: {vessel.mmsi}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-800">{vessel.vesselClass}</span>
                          <span className="text-[10px] text-slate-400 block">{vessel.flag}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-slate-800 font-medium">
                            {vessel.latitude.toFixed(2)}° N, {vessel.longitude.toFixed(2)}° E
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Freshness: {vessel.dataFreshness}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-slate-900">{vessel.speedKnots} kts</span>
                          <span className="text-slate-400 text-[10px] block">{vessel.heading}° course</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            vessel.currentStatus.includes('Distress') || vessel.currentStatus.includes('Machinery') ? 'bg-rose-100 text-rose-700' :
                            vessel.currentStatus.includes('Advisory') ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {vessel.currentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs">
                          <div className="text-slate-800 font-medium">{vessel.nearestPort.name} (~{vessel.nearestPort.distanceNM} nm)</div>
                          <div className="text-[10px] text-slate-500">Refuge: {vessel.nearestShelter.name} (~{vessel.nearestShelter.distanceNM} nm)</div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSosVesselId(vessel.id);
                                setActiveSubTab('sos');
                              }}
                              className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] font-bold cursor-pointer"
                            >
                              Report SOS
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDisruptedVesselId(vessel.id);
                                setActiveSubTab('recovery');
                              }}
                              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold cursor-pointer"
                            >
                              Recover Cargo
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SMART CARGO DISRUPTION RECOVERY */}
      {activeSubTab === 'recovery' && (
        <div className="space-y-6">
          {/* Workflow Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Smart Cargo Disruption Recovery Workflow
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluate alternative ports, deepwater lighterage, and speed adjustment strategies when facing port closures, severe storms, or machinery casualties.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-teal-100 text-teal-800 font-bold border border-teal-200">
                DYNAMIC OPTIMIZER
              </span>
            </div>

            {/* Disruption Parameters Input Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Disrupted Vessel & Shipment
                </label>
                <select
                  value={selectedDisruptedVesselId}
                  onChange={(e) => setSelectedDisruptedVesselId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="vessel_3">MV Iron Leader — 176,500 MT Iron Ore (Capesize)</option>
                  <option value="vessel_1">MV Blue Horizon — 76,000 MT Coking Coal (Panamax)</option>
                  <option value="vessel_4">MV Global Pioneer — 82,000 MT Thermal Coal (Panamax)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Active Disruption Scenario
                </label>
                <select
                  value={selectedDisruptionType}
                  onChange={(e) => setSelectedDisruptionType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="Port closure">Tropical Cyclone Port Closure (Odisha Coast)</option>
                  <option value="Vessel breakdown">Main Engine Propulsion Derating</option>
                  <option value="Port congestion">Excessive Port Waiting Demurrage (&gt;6 days)</option>
                  <option value="Route blockage">Chokepoint / Coastal Security Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Expected Disruption Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={disruptionDurationDays}
                    onChange={(e) => setDisruptionDurationDays(Number(e.target.value))}
                    className="flex-1 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-slate-900 w-16 text-right">
                    {disruptionDurationDays} Days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Recovery Options Cards & Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {recoveryOptions.map((opt) => {
              const isSelected = selectedRecoveryOption === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedRecoveryOption(opt.id)}
                  className={`rounded-xl border p-4.5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-blue-50/90 to-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        opt.isRecommended
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {opt.isRecommended ? '⭐ RECOMMENDED OPTION' : opt.optionType}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Score: {opt.confidenceScore}/100
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {opt.title}
                    </h4>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Destination:</span>
                        <strong className="text-slate-800">{opt.destinationPortName}</strong>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Draft Clearance (UKC):</span>
                        <strong className={opt.draftCheck.passes ? 'text-emerald-700 font-mono' : 'text-rose-600 font-mono'}>
                          {opt.draftCheck.passes ? `+${opt.draftCheck.ukcMeters}m (Passes)` : `${opt.draftCheck.ukcMeters}m (Constrained)`}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Added Steaming NM:</span>
                        <span className="font-mono font-bold text-slate-800">+{opt.additionalNM} NM</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Est. Total Demurrage Saved:</span>
                        <span className="font-mono font-bold text-emerald-700">+${opt.demurrageSavedUSD.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Net Cost Impact:</span>
                        <strong className={`font-mono text-sm ${opt.netFinancialImpactUSD <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {opt.netFinancialImpactUSD <= 0 ? `-$${Math.abs(opt.netFinancialImpactUSD).toLocaleString()} (Net Savings)` : `+$${opt.netFinancialImpactUSD.toLocaleString()}`}
                        </strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-3 leading-relaxed">
                      {opt.recommendationReason}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">ETA: {opt.estArrival}</span>
                    <button
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Operational Constraints & Assumptions Disclosure */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Recovery Optimization Financial & Hydrodynamic Assumptions</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500">
              <li>Demurrage benchmark rate: $28,000 per day for Capesize carriers; $18,500 per day for Panamax vessels.</li>
              <li>Bunker fuel consumption modeled at laden service speed: 38.0 MT/day VLSFO at $624/MT.</li>
              <li>Draft clearance verified against maximum permissible low-water channel draft plus MoPSW 10% under-keel safety margin.</li>
              <li>Official port diversions require notification to customs authorities, port health officer, and bills of lading endorsement.</li>
            </ul>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SHIP-TO-SHIP (STS) CARGO TRANSFER */}
      {activeSubTab === 'sts' && (
        <div id="sts-transfer-workspace" className={`space-y-6 rounded-2xl transition-all duration-500 p-1 ${stsHighlight ? 'ring-4 ring-cyan-400/80 bg-cyan-950/20 p-2' : ''}`}>
          {/* Statutory Safety Notice Banner */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-bold text-amber-950 block">Statutory Maritime Safety Notice: Dry Bulk STS Transfer</strong>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  Ship-to-ship transfer of dry bulk cargo (lighterage or full transshipment) strictly requires formal approval from the Directorate General of Shipping (DG Shipping), local Port Trust / Maritime Board harbor masters, and classification society warranty surveyors under IMO SOLAS / MARPOL safety guidelines.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Scenario Presets */}
          <div className="bg-gradient-to-r from-[#0d1d36] to-[#122849] p-3.5 rounded-xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold text-white">Quick Scenario Presets:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleApplyStsPreset('port_blair')}
                className="px-2.5 py-1.5 rounded-lg bg-[#163459] hover:bg-[#1e4677] text-cyan-200 border border-cyan-500/40 text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>⚓ Port Blair (35k MT • Capesize ➔ Supramax)</span>
              </button>
              <button
                onClick={() => handleApplyStsPreset('vizag')}
                className="px-2.5 py-1.5 rounded-lg bg-[#163459] hover:bg-[#1e4677] text-cyan-200 border border-cyan-500/40 text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>⚓ Vizag Outer (25k MT • Capesize ➔ Handysize)</span>
              </button>
              <button
                onClick={() => handleApplyStsPreset('trincomalee')}
                className="px-2.5 py-1.5 rounded-lg bg-[#163459] hover:bg-[#1e4677] text-cyan-200 border border-cyan-500/40 text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>⚓ Trincomalee (18k MT • Panamax ➔ Supramax)</span>
              </button>
            </div>
          </div>

          {/* STS Configuration & Compatibility Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Ship-to-Ship Cargo Transfer Compatibility Assessment</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200">
                    STS SIMULATOR
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Evaluate physical vessel compatibility, fendering, duration, and statutory requirements for emergency lightering.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runStsEvaluation()}
                  disabled={loadingSts}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSts ? 'animate-spin' : ''}`} />
                  <span>{loadingSts ? 'Evaluating...' : 'Re-Run Assessment'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Discharging Vessel (Casualty / Mother Ship)
                </label>
                <select
                  value={stsDischargingId}
                  onChange={(e) => setStsDischargingId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="vessel_3">MV Iron Leader (Capesize 176k • 18.25m Draft)</option>
                  <option value="vessel_6">MV Pacific Sentinel (Capesize 181k • 18.42m Draft)</option>
                  <option value="vessel_1">MV Blue Horizon (Panamax 76k • 14.18m Draft)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Receiving Vessel (Daughter Ship)
                </label>
                <select
                  value={stsReceivingId}
                  onChange={(e) => setStsReceivingId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="vessel_2">MV Queen Mary (Supramax 58k • 4x30t Cranes)</option>
                  <option value="vessel_5">MV Eastern Harmony (Handysize 38.5k • 4x30.5t Cranes)</option>
                  <option value="vessel_4">MV Global Pioneer (Panamax 82k • Gearless)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Designated Sheltered Transfer Zone
                </label>
                <select
                  value={stsLocation}
                  onChange={(e) => setStsLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="Port Blair Deepwater Anchorage">Port Blair Deepwater Anchorage (Andaman - 35m Depth)</option>
                  <option value="Visakhapatnam Outer Roads">Visakhapatnam Outer Roads TSS (Andhra - 22m Depth)</option>
                  <option value="Trincomalee Inner Bay">Trincomalee Sheltered Bay (Sri Lanka - 28m Depth)</option>
                  <option value="Fujairah Offshore Anchorage">Fujairah Offshore Anchorage (UAE - 30m Depth)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cargo Quantity to Transfer (MT)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={stsQuantityMT}
                  onChange={(e) => setStsQuantityMT(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Evaluation Results Card */}
            {stsPlan && (
              <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">PLAN ID: {stsPlan.id}</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      {stsPlan.dischargingVesselName} ➔ {stsPlan.receivingVesselName} ({stsPlan.transferQuantityMT.toLocaleString()} MT {stsPlan.cargoType || stsCargoType})
                    </h4>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-md font-mono ${
                    stsPlan.compatibility.overallFeasible
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {stsPlan.compatibility.overallFeasible ? '✓ PHYSICALLY COMPATIBLE' : '⚠ COMPATIBILITY RESTRICTIONS'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">DWT Capacity Match</span>
                    <strong className={stsPlan.compatibility.dwtMatches ? 'text-emerald-700 font-mono text-sm' : 'text-rose-700 font-mono text-sm'}>
                      {stsPlan.compatibility.dwtMatches ? 'PASS (Adequate DWT)' : 'FAIL (Exceeds DWT)'}
                    </strong>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">Cranes & Grabs Availability</span>
                    <strong className={stsPlan.compatibility.gearCompatible ? 'text-emerald-700 font-mono text-sm' : 'text-amber-700 font-mono text-sm'}>
                      {stsPlan.compatibility.gearCompatible ? 'PASS (Receiving Geared)' : 'Requires Floating Grab Barge'}
                    </strong>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">Est. Operation Duration</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {stsPlan.estimatedDurationHours} Hours (~{(stsPlan.estimatedDurationHours / 24).toFixed(1)} Days)
                    </strong>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">Estimated Operation Cost</span>
                    <strong className="text-blue-700 font-mono text-sm">
                      ${stsPlan.estimatedCostUSD.toLocaleString()} USD
                    </strong>
                  </div>
                </div>

                {/* Regulatory Approvals Checklist */}
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Statutory Authorizations Checklist (Mandatory Prior to Operation)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>DG Shipping Coastal Permit: <strong>{stsPlan.approvals.dgShippingPermit}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Port Harbor Master: <strong>{stsPlan.approvals.harborMasterApproval}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Class Society MWS: <strong>Notified</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Oil Spill Standby: <strong>Mobilized</strong></span>
                    </div>
                  </div>
                </div>

                {/* Fendering Specifications */}
                <div className="text-[11px] text-slate-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-200/60 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <strong>Fendering Specification: </strong>
                    <span>{stsPlan.compatibility.fenderingRequirement}. Weather window verified (Hs &le; 1.5m, Wind &le; 20 kts).</span>
                  </div>
                </div>

                {/* Interactive Action Dispatch Controls */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    Operation certified under IMO SOLAS Chapter VI and OCIMF/ICS Ship to Ship Transfer Guide.
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setIsStsDossierModalOpen(true)}
                      className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Statutory Dossier</span>
                    </button>
                    <button
                      onClick={() => setIsStsModalOpen(true)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/30 transition-all"
                    >
                      <Anchor className="w-4 h-4" />
                      <span>Dispatch STS Order & Request Permits</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: UNIFIED INCIDENT REGISTER & OFFICIAL COORDINATION */}
      {activeSubTab === 'incidents' && (
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Unified Maritime Incident Register & Official Audit Trail
                </h3>
                <p className="text-xs text-slate-500">
                  Historical log of all marine emergencies, severe weather disruptions, and official statutory notifications.
                </p>
              </div>

              <button
                onClick={loadDashboardData}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by vessel, location, or incident ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 font-semibold cursor-pointer"
                >
                  <option value="All">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 font-semibold cursor-pointer"
                >
                  <option value="All">All Incident Statuses</option>
                  <option value="Reported">Reported</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Recovery in Progress">Recovery in Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Incident ID & Severity</th>
                    <th className="py-2.5 px-3">Title & Type</th>
                    <th className="py-2.5 px-3">Vessel / Shipment</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Reported Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assigned Owner</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((incident) => (
                    <tr
                      key={incident.id}
                      onClick={() => setSelectedIncident(incident)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        selectedIncident?.id === incident.id ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 block">{incident.id}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          incident.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                          incident.severity === 'Major' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 block leading-snug">{incident.title}</strong>
                        <span className="text-[10px] text-slate-500">{incident.type}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium">
                        {incident.vesselOrShipment}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] font-mono">
                        {incident.location}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {incident.reportedTime}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          incident.status === 'Reported' ? 'bg-rose-100 text-rose-700' :
                          incident.status === 'Escalated' ? 'bg-red-100 text-red-800 font-bold' :
                          incident.status === 'Recovery in Progress' ? 'bg-teal-100 text-teal-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 text-[11px]">
                        {incident.assignedOwner}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOfficialReport(incident.id);
                          }}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] border border-blue-200 cursor-pointer"
                        >
                          Official Report ↗
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Incident Detail Drawer / Panel */}
          {selectedIncident && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Incident Case File: {selectedIncident.id} — {selectedIncident.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenOfficialReport(selectedIncident.id)}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate Statutory Dossier</span>
                  </button>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Left: Summary & Operational Actions */}
                <div className="space-y-3">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Incident Summary:</span>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                      {selectedIncident.actionsTaken?.[0] || 'Casualty recorded.'}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Actions Taken & Mitigation:</span>
                    <ul className="space-y-1 list-disc pl-5 text-slate-600 text-[11px]">
                      {selectedIncident.actionsTaken?.map((action, i) => (
                        <li key={i}>{action}</li>
                      )) || <li>No actions recorded yet.</li>}
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Recommended Next Steps:</span>
                    <ul className="space-y-1 list-disc pl-5 text-slate-600 text-[11px]">
                      {selectedIncident.nextSteps?.map((step, i) => (
                        <li key={i}>{step}</li>
                      )) || <li>Pending investigation.</li>}
                    </ul>
                  </div>
                </div>

                {/* Right: Activity Audit Timeline */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-700 block">Chronological Activity Audit Trail:</span>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3 max-h-60 overflow-y-auto">
                    {selectedIncident.auditLog?.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <span className="font-mono text-slate-400 shrink-0 w-28">{log.timestamp}</span>
                        <div>
                          <strong className="text-slate-800">{log.action}: </strong>
                          <span className="text-slate-600">{log.details}</span>
                          <span className="text-[10px] text-slate-400 block">By: {log.actor}</span>
                        </div>
                      </div>
                    )) || <div className="text-slate-400 text-xs">No audit logs available.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL FOR EMERGENCY SOS */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-rose-300">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900">
                Confirm Emergency Incident Submission
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to log an active maritime casualty alert for:
            </p>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1.5 font-mono">
              <div><strong>Vessel: </strong>{VESSELS_DATABASE.find(v => v.id === sosVesselId)?.name || 'Vessel'}</div>
              <div><strong>Incident Type: </strong>{sosIncidentType}</div>
              <div><strong>Assigned Severity: </strong><span className="text-rose-700 font-bold">{sosSeverity}</span></div>
              <div><strong>Location: </strong>{sosLocation}</div>
              <div><strong>People at Risk: </strong>{sosPeopleAtRisk} Persons</div>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Upon confirmation, this report will be added to the unified incident register, alerts will update across fleet tracking, and statutory flash dossiers will be drafted for MRCC and DG Shipping.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel / Edit
              </button>
              <button
                onClick={handleConfirmSubmitEmergency}
                disabled={submittingSos}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-70"
              >
                {submittingSos ? 'Submitting...' : 'Confirm & Log Emergency'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL REPORT GENERATION MODAL */}
      {officialReportModal && officialReportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Statutory Maritime Incident Dossier
                  </h3>
                </div>
                <button
                  onClick={() => setOfficialReportModal(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Authority Selector Tabs */}
              <div className="flex items-center gap-2 mt-3">
                {[
                  { key: 'dgShipping', label: 'DG Shipping (CAS-1 Flash Form)' },
                  { key: 'mrccFlash', label: 'MRCC Coast Guard (SAR Alert)' },
                  { key: 'ifcIor', label: 'IFC-IOR (Security Information)' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setOfficialReportModal(prev => prev ? { ...prev, activeTab: item.key as any } : null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      officialReportModal.activeTab === item.key
                        ? 'bg-[#0f2942] text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Formatted Text Preview */}
              <div className="mt-3.5 relative">
                <pre className="p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-[11px] leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap select-all">
                  {officialReportModal.reports[officialReportModal.activeTab]}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                Prepared for manual certified transmission via coastal radio / telex / authorized email.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyReport(
                    officialReportModal.reports[officialReportModal.activeTab],
                    officialReportModal.activeTab
                  )}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === officialReportModal.activeTab ? 'Copied to Clipboard!' : 'Copy Form'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: STS OPERATIONAL DISPATCH & PERMITS MODAL */}
      {isStsModalOpen && stsPlan && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-300 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700">
                  <Anchor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Dispatch Statutory Ship-to-Ship (STS) Transfer Order
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify vessel compatibility, statutory approvals, and log authorized lighterage operation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Telemetry Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">
                  Transfer Telemetry
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mother / Discharging:</span>
                    <strong className="text-slate-900">{stsPlan.dischargingVesselName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Daughter / Receiving:</span>
                    <strong className="text-slate-900">{stsPlan.receivingVesselName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cargo Parcel:</span>
                    <strong className="text-slate-900">{stsPlan.transferQuantityMT.toLocaleString()} MT ({stsPlan.cargoType || stsCargoType})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <strong className="text-blue-700 truncate max-w-[180px]">{typeof stsPlan.transferLocation === 'string' ? stsPlan.transferLocation : stsPlan.transferLocation?.name || stsLocation}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Est. Duration:</span>
                    <strong className="font-mono text-slate-900">{stsPlan.estimatedDurationHours} Hours</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobilization Cost:</span>
                    <strong className="font-mono text-blue-700">${stsPlan.estimatedCostUSD.toLocaleString()} USD</strong>
                  </div>
                </div>
              </div>

              {/* Statutory Approvals Checklist */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">
                  Mandatory Statutory Clearances
                </span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stsApprovalsChecklist.dgShippingPermit}
                      onChange={(e) => setStsApprovalsChecklist(prev => ({ ...prev, dgShippingPermit: e.target.checked }))}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span className="text-slate-700 font-semibold">DG Shipping Coastal Trading Permit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stsApprovalsChecklist.harborMasterClearance}
                      onChange={(e) => setStsApprovalsChecklist(prev => ({ ...prev, harborMasterClearance: e.target.checked }))}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span className="text-slate-700 font-semibold">Port Harbor Master Anchorage Permit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stsApprovalsChecklist.mwsWarrantySurveyor}
                      onChange={(e) => setStsApprovalsChecklist(prev => ({ ...prev, mwsWarrantySurveyor: e.target.checked }))}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span className="text-slate-700 font-semibold">Marine Warranty Surveyor (MWS) Onsite</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stsApprovalsChecklist.oilSpillStandby}
                      onChange={(e) => setStsApprovalsChecklist(prev => ({ ...prev, oilSpillStandby: e.target.checked }))}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span className="text-slate-700 font-semibold">Tier-1 Oil Spill & Tug Standby Active</span>
                  </label>
                </div>
                <div className="text-[10px] text-amber-800 bg-amber-100/70 p-2 rounded border border-amber-200 mt-2">
                  Fendering confirmed: 4x Yokohama pneumatic high-pressure fenders. Mooring master assigned.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                Log will update the command incident register and notify port operations.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingStsOrder}
                  onClick={handleConfirmSubmitStsOrder}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                >
                  <Anchor className="w-4 h-4" />
                  <span>{submittingStsOrder ? 'Authorizing...' : 'Confirm & Log Statutory STS Order'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: STS STATUTORY COMPLIANCE & MOORING DOSSIER */}
      {isStsDossierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-300 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Statutory STS Safety Clearance & Mooring Dossier
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pre-formatted official dossier adhering to IMO SOLAS Chapter VI, MARPOL Annex I, and OCIMF Guidelines.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStsDossierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 text-cyan-300 font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap select-all">
                {getStsDossierText()}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                Official text formatted for telex, coastal VHF dispatch, or regulatory clearance submission.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyReport(getStsDossierText(), 'stsDossier')}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'stsDossier' ? 'Copied to Clipboard!' : 'Copy Official Dossier'}</span>
                </button>
                <button
                  onClick={() => setIsStsDossierModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal icon helper
const RotateCcwIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
