import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ship, 
  Search, 
  Calendar, 
  Anchor, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Scale, 
  Lightbulb, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown,
  Layers,
  Sparkles,
  Info,
  Loader2,
  ShieldAlert,
  Box,
  SlidersHorizontal,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { Vessel, Port, Commodity, SimulationParams, VesselClass } from '../types';
import { VESSELS_DATABASE, PORTS_DATABASE, COMMODITIES_DATABASE } from '../data/maritimeData';
import { evaluateVesselSuitability, getRouteDistance } from '../utils/freightCalculator';
import { naviApi, CharteringEvaluationResponse } from '../services/api';

interface VesselCharteringProps {
  simulationParams: SimulationParams;
  onUpdateParams: (params: Partial<SimulationParams>) => void;
  onOpenCompareModal: (vessels: Vessel[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const VesselChartering: React.FC<VesselCharteringProps> = ({
  simulationParams,
  onUpdateParams,
  onOpenCompareModal,
  onNavigateTab,
}) => {
  // Mode switcher between Screenshot 3 (Class View) and Screenshot 4 (Detailed Vessel View)
  const [viewMode, setViewMode] = useState<'classView' | 'detailedView'>('classView');

  const [backendEval, setBackendEval] = useState<CharteringEvaluationResponse | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);

  // Form Filters (synchronized across both views)
  const [commodity, setCommodity] = useState(simulationParams.commodityId || 'coking_coal');
  const [cargoQty, setCargoQty] = useState(simulationParams.cargoQuantityMT || 150000);
  const [loadingPort, setLoadingPort] = useState(simulationParams.originPortId || 'port_hedland');
  const [dischargePort, setDischargePort] = useState(simulationParams.destPortId || 'paradip');
  const [laycanWindow, setLaycanWindow] = useState('10 Feb 2026 – 25 Feb 2026');
  const [priority, setPriority] = useState<'Lowest Total Cost' | 'Highest Feasibility' | 'Fastest Delivery'>('Lowest Total Cost');
  const [compareBy, setCompareBy] = useState<'Suitability Score' | 'Cost Efficiency' | 'Draft Clearance'>('Suitability Score');

  // Selected row in Class View
  const [selectedClass, setSelectedClass] = useState<VesselClass>('Panamax');

  // Selected vessel in Detailed View
  const [selectedVesselId, setSelectedVesselId] = useState('vessel_1');

  // Active Port and Commodity Objects
  const selectedOriginPort = useMemo(() => {
    return PORTS_DATABASE.find(p => p.id === loadingPort) || PORTS_DATABASE[7];
  }, [loadingPort]);

  const selectedDestPort = useMemo(() => {
    return PORTS_DATABASE.find(p => p.id === dischargePort) || PORTS_DATABASE[0];
  }, [dischargePort]);

  const selectedCommodity = useMemo(() => {
    return COMMODITIES_DATABASE.find(c => c.id === commodity) || COMMODITIES_DATABASE[0];
  }, [commodity]);

  // Route Nautical Distance
  const distanceNM = useMemo(() => {
    return getRouteDistance(loadingPort, dischargePort);
  }, [loadingPort, dischargePort]);

  const maxDraft = selectedDestPort.maxDraftMeters.toFixed(1);

  // Categorize ports for easy, clean browsing
  const indianEastCoastPorts = useMemo(() => PORTS_DATABASE.filter(p => p.country === 'India' && p.isIndianEastCoast), []);
  const indianWestCoastPorts = useMemo(() => PORTS_DATABASE.filter(p => p.country === 'India' && !p.isIndianEastCoast), []);
  const australiaPorts = useMemo(() => PORTS_DATABASE.filter(p => p.country === 'Australia'), []);
  const asiaPorts = useMemo(() => PORTS_DATABASE.filter(p => ['Singapore', 'Malaysia', 'Indonesia', 'China', 'South Korea', 'Japan', 'Taiwan'].includes(p.country)), []);
  const middleEastAfricaPorts = useMemo(() => PORTS_DATABASE.filter(p => ['South Africa', 'United Arab Emirates', 'Oman'].includes(p.country)), []);
  const americasEuropePorts = useMemo(() => PORTS_DATABASE.filter(p => ['Brazil', 'Peru', 'Canada', 'United States', 'Netherlands', 'Belgium', 'Germany'].includes(p.country)), []);

  const renderPortOptions = () => (
    <>
      <optgroup label="🇮🇳 India — East Coast Ports">
        {indianEastCoastPorts.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.region.split('(')[1]?.replace(')', '') || p.country})</option>
        ))}
      </optgroup>
      <optgroup label="🇮🇳 India — West Coast Ports">
        {indianWestCoastPorts.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.region.split('(')[1]?.replace(')', '') || p.country})</option>
        ))}
      </optgroup>
      <optgroup label="🇦🇺 Australia & Oceania Bulk Loading">
        {australiaPorts.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
        ))}
      </optgroup>
      <optgroup label="🌏 Southeast & East Asia Hubs">
        {asiaPorts.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
        ))}
      </optgroup>
      <optgroup label="🌍 Africa & Middle East (Energy & Coal)">
        {middleEastAfricaPorts.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
        ))}
      </optgroup>
      <optgroup label="🌎 Americas & Europe (Global Bulks)">
        {americasEuropePorts.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
        ))}
      </optgroup>
    </>
  );

  // Trigger Backend Evaluation (or fallback smoothly)
  const handleSearchVessels = () => {
    setLoadingEval(true);
    naviApi.evaluateChartering({
      originPortId: loadingPort,
      destPortId: dischargePort,
      commodityId: commodity,
      cargoQuantityMT: cargoQty,
      bunkerPriceUSD: simulationParams.bunkerPricePerMT,
      congestionDays: simulationParams.portCongestionDays,
      marketVolatilityShock: simulationParams.marketVolatilityShock,
    }).then((res) => {
      if (res) setBackendEval(res);
      setLoadingEval(false);
    }).catch(() => {
      setLoadingEval(false);
    });

    onUpdateParams({
      originPortId: loadingPort,
      destPortId: dischargePort,
      commodityId: commodity,
      cargoQuantityMT: cargoQty,
    });
  };

  useEffect(() => {
    handleSearchVessels();
  }, [loadingPort, dischargePort, commodity, cargoQty]);

  // Corridor Routing Name
  const routeCorridor = useMemo(() => {
    if (selectedOriginPort.country === 'Australia') {
      return { tag: 'SATELLITE CORRIDOR', channel: 'Via Lombok Strait Deepwater' };
    }
    if (['United States', 'Canada', 'Brazil', 'Peru', 'Netherlands', 'Germany'].includes(selectedOriginPort.country)) {
      return { tag: 'OCEANIC TRANSIT', channel: 'Via Cape of Good Hope Corridor' };
    }
    if (['South Africa', 'United Arab Emirates', 'Oman'].includes(selectedOriginPort.country)) {
      return { tag: 'WESTERN INDIAN OCEAN', channel: 'Via Six Degree Channel' };
    }
    if (selectedOriginPort.country === 'India') {
      return { tag: 'DOMESTIC COASTAL', channel: 'Indian Coastal Shipping Line' };
    }
    return { tag: 'SATELLITE CORRIDOR', channel: 'Via Malacca / Singapore Strait' };
  }, [selectedOriginPort]);

  // Standard Class Specifications and Dynamic Evaluation
  const classEvaluationData = useMemo(() => {
    const classConfigs: {
      vesselClass: VesselClass;
      capacityRange: string;
      typicalDwt: number;
      loa: number;
      beam: number;
      draft: number;
      speedKnots: number;
      seaConsumptionTPD: number;
      dailyHireRateUSD: number;
    }[] = [
      {
        vesselClass: 'Handysize',
        capacityRange: '10,000 – 40,000',
        typicalDwt: 35000,
        loa: 180,
        beam: 28,
        draft: 10.5,
        speedKnots: 14.0,
        seaConsumptionTPD: 16.5,
        dailyHireRateUSD: 13500,
      },
      {
        vesselClass: 'Supramax',
        capacityRange: '40,000 – 60,000',
        typicalDwt: 58000,
        loa: 190,
        beam: 32,
        draft: 12.8,
        speedKnots: 13.8,
        seaConsumptionTPD: 21.0,
        dailyHireRateUSD: 15500,
      },
      {
        vesselClass: 'Panamax',
        capacityRange: '60,000 – 85,000',
        typicalDwt: 76000,
        loa: 225,
        beam: 32.2,
        draft: 14.2,
        speedKnots: 13.2,
        seaConsumptionTPD: 24.5,
        dailyHireRateUSD: 17500,
      },
      {
        vesselClass: 'Capesize',
        capacityRange: '100,000 – 180,000',
        typicalDwt: 176500,
        loa: 289,
        beam: 45,
        draft: 18.25,
        speedKnots: 12.6,
        seaConsumptionTPD: 38.0,
        dailyHireRateUSD: 24500,
      },
    ];

    const bunkerPrice = simulationParams.bunkerPricePerMT || 624;
    const congestionDays = simulationParams.portCongestionDays || 1.5;
    const volatilityShock = simulationParams.marketVolatilityShock || 0;
    const volatilityMultiplier = 1 + volatilityShock / 100;

    return classConfigs.map((cfg) => {
      // Transit calculations
      const seaDaysLaden = distanceNM / (cfg.speedKnots * 24);
      const seaDaysBallast = seaDaysLaden * 0.95;
      const totalSeaDays = seaDaysLaden + seaDaysBallast;

      const liftPerVoyage = Math.min(cargoQty, cfg.typicalDwt * 0.95);
      const dischargeDays = Math.max(1.5, liftPerVoyage / selectedDestPort.handlingRateTPD);
      const loadingDays = Math.max(1.0, liftPerVoyage / 85000);
      const totalPortDays = loadingDays + dischargeDays + congestionDays;
      const totalVoyageDays = Math.round(totalSeaDays + totalPortDays);

      // Financials
      const fuelTotalMT = totalSeaDays * cfg.seaConsumptionTPD + totalPortDays * 3.5;
      const bunkerCostUSD = fuelTotalMT * bunkerPrice;
      const hireCostUSD = totalVoyageDays * cfg.dailyHireRateUSD;
      const portDuesUSD = 32000 + cfg.typicalDwt * 0.42;
      const rawTotalCost = (hireCostUSD + bunkerCostUSD + portDuesUSD) * volatilityMultiplier;

      // Rate per ton
      const baseFreightRate = rawTotalCost / liftPerVoyage;
      // Commodity & route calibration
      const commoditySurcharge = selectedCommodity.id === 'coking_coal' ? 1.05 : selectedCommodity.id === 'fertilizers' ? 1.15 : 1.0;
      const estRatePerTon = Math.max(14.5, Number((baseFreightRate * commoditySurcharge).toFixed(2)));

      const rateMin = Math.round(estRatePerTon * 0.92);
      const rateMax = Math.round(estRatePerTon * 1.12);
      const freightRateDisplay = `$ ${rateMin} – ${rateMax}`;

      // Total voyage cost in Million USD for full cargo quantity
      const totalCostMillion = Number(((estRatePerTon * cargoQty) / 1000000).toFixed(1));

      // Arrival window calculation
      const departureDaysAhead = Math.round(seaDaysLaden + 2);
      const arrStart = new Date();
      arrStart.setDate(arrStart.getDate() + departureDaysAhead);
      const arrEnd = new Date(arrStart);
      arrEnd.setDate(arrEnd.getDate() + 3);
      const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const arrivalWindow = `${formatDate(arrStart)} – ${formatDate(arrEnd)}`;

      // Port Bathymetry Feasibility
      const draftClearance = Number((selectedDestPort.maxDraftMeters - cfg.draft).toFixed(2));
      const loaClearance = Number((selectedDestPort.maxLOAMeters - cfg.loa).toFixed(1));
      const beamClearance = Number((selectedDestPort.maxBeamMeters - cfg.beam).toFixed(1));

      let portCompatScore = 90;
      let suitability = 'Feasible';
      let badgeStyle = 'bg-emerald-100 text-emerald-800 border border-emerald-200';

      if (draftClearance < -2.0) {
        suitability = 'Not Suitable';
        badgeStyle = 'bg-rose-100 text-rose-700 border border-rose-200';
        portCompatScore = Math.max(15, Math.round(35 + draftClearance * 6));
      } else if (draftClearance < 0) {
        suitability = 'Subject to Port';
        badgeStyle = 'bg-blue-100 text-blue-700 border border-blue-200';
        portCompatScore = Math.max(30, Math.round(55 + draftClearance * 12));
      } else if (draftClearance < 0.6) {
        suitability = 'Conditional';
        badgeStyle = 'bg-amber-100 text-amber-700 border border-amber-200';
        portCompatScore = Math.round(75 + draftClearance * 15);
      } else {
        portCompatScore = Math.min(99, Math.round(88 + draftClearance * 2));
      }

      // Cargo parcel suitability score
      const parcelRatio = cargoQty / cfg.typicalDwt;
      let cargoSuitScore = 80;
      if (cfg.vesselClass === 'Capesize') {
        cargoSuitScore = cargoQty >= 120000 ? 96 : cargoQty >= 80000 ? 75 : 35;
      } else if (cfg.vesselClass === 'Panamax') {
        cargoSuitScore = cargoQty >= 60000 && cargoQty <= 160000 ? 92 : 78;
      } else if (cfg.vesselClass === 'Supramax') {
        cargoSuitScore = cargoQty <= 70000 ? 92 : cargoQty <= 120000 ? 75 : 55;
      } else {
        cargoSuitScore = cargoQty <= 45000 ? 95 : cargoQty <= 80000 ? 65 : 40;
      }

      // Cost efficiency score (Capesize typically best $/ton, Handysize highest)
      let costEffScore = 85;
      if (cfg.vesselClass === 'Capesize') costEffScore = draftClearance >= 0 ? 94 : 70;
      else if (cfg.vesselClass === 'Panamax') costEffScore = 88;
      else if (cfg.vesselClass === 'Supramax') costEffScore = 78;
      else costEffScore = 65;

      // Availability score
      const availScoreMap: Record<VesselClass, number> = {
        Panamax: 88,
        Supramax: 82,
        Capesize: 68,
        Handysize: 75,
      };
      const availabilityScore = availScoreMap[cfg.vesselClass];

      // Overall Score calculation based on priority
      let overallScore = 80;
      if (priority === 'Lowest Total Cost') {
        overallScore = Math.round(costEffScore * 0.45 + portCompatScore * 0.35 + cargoSuitScore * 0.20);
      } else if (priority === 'Highest Feasibility') {
        overallScore = Math.round(portCompatScore * 0.60 + cargoSuitScore * 0.25 + costEffScore * 0.15);
      } else {
        // Fastest Delivery (speed / transit time)
        const speedBonus = cfg.speedKnots >= 13.5 ? 90 : 78;
        overallScore = Math.round(speedBonus * 0.40 + portCompatScore * 0.35 + costEffScore * 0.25);
      }

      if (draftClearance < -2.0) overallScore = Math.min(35, overallScore);
      else if (draftClearance < 0) overallScore = Math.min(65, overallScore);

      return {
        ...cfg,
        seaDaysLaden: Math.round(seaDaysLaden),
        voyageDays: totalVoyageDays,
        estRatePerTon,
        rateMin,
        rateMax,
        freightRateDisplay,
        voyageCostMillion: totalCostMillion,
        arrivalWindow,
        draftClearance,
        loaClearance,
        beamClearance,
        portCompatScore,
        cargoSuitScore,
        costEffScore,
        availabilityScore,
        overallScore,
        suitability,
        badgeStyle,
      };
    });
  }, [distanceNM, cargoQty, selectedDestPort, selectedCommodity, simulationParams, priority]);

  // Identify Best Match / Recommended Class
  const recommendedClass = useMemo(() => {
    const valid = [...classEvaluationData].sort((a, b) => b.overallScore - a.overallScore);
    return valid[0] || classEvaluationData[2];
  }, [classEvaluationData]);

  // Compute detailed vessels based on VESSELS_DATABASE
  const detailedVessels = useMemo(() => {
    return VESSELS_DATABASE.map((v) => {
      const evalResult = evaluateVesselSuitability(
        v,
        selectedDestPort,
        cargoQty,
        selectedCommodity,
        distanceNM,
        simulationParams.bunkerPricePerMT || 624,
        simulationParams.portCongestionDays || 1.5,
        simulationParams.marketVolatilityShock || 0
      );

      const rateMin = Math.round(evalResult.estFreightRateUSD * 0.95);
      const rateMax = Math.round(evalResult.estFreightRateUSD * 1.08);
      const freightCostRange = `$ ${rateMin} – ${rateMax}`;

      let status = 'Available';
      let statusBadge = 'bg-emerald-100 text-emerald-800';
      if (evalResult.status === 'Exceeds Port Limits') {
        status = 'Not Suitable';
        statusBadge = 'bg-rose-100 text-rose-800';
      } else if (evalResult.status === 'Conditional') {
        status = 'Limited';
        statusBadge = 'bg-amber-100 text-amber-800';
      } else if (evalResult.score >= 90) {
        status = 'Best Match';
        statusBadge = 'bg-emerald-600 text-white font-bold';
      }

      return {
        id: v.id,
        name: v.name,
        vesselClass: v.vesselClass,
        dwt: v.dwt,
        draft: v.draftMeters,
        freightCostRange,
        arrivalWindow: evalResult.arrivalWindow,
        score: evalResult.score,
        status,
        statusBadge,
        loa: v.loaMeters,
        beam: v.beamMeters,
        speedKnots: v.speedKnots,
        consumption: v.bunkerConsumptionSeaTPD,
        flag: v.flag,
        charterType: v.gearDescription.includes('Cranes') 
          ? 'Geared Time Charter / Voyage'
          : v.vesselClass === 'Capesize' 
          ? 'Voyage Charter (Subject to Port)'
          : 'Time Charter / Voyage Charter',
        evalResult,
      };
    });
  }, [selectedDestPort, cargoQty, selectedCommodity, distanceNM, simulationParams]);

  // Active Selected Vessel for Detailed View
  const activeDetailedVessel = useMemo(() => {
    return detailedVessels.find(v => v.id === selectedVesselId) || detailedVessels[0];
  }, [detailedVessels, selectedVesselId]);

  // Selected Class Data for Class View
  const activeClassRow = useMemo(() => {
    return classEvaluationData.find(c => c.vesselClass === selectedClass) || classEvaluationData[2];
  }, [classEvaluationData, selectedClass]);

  // Helper for Top 3 Classes in Vessel Comparison Side-by-Side (Supramax, Panamax, Capesize)
  const top3Classes = useMemo(() => {
    return classEvaluationData.filter(c => c.vesselClass !== 'Handysize');
  }, [classEvaluationData]);

  return (
    <div className="space-y-6">
      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 px-2">Prototype View:</span>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('classView')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'classView'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Class Comparison View
            </button>
            <button
              onClick={() => setViewMode('detailedView')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'detailedView'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vessel Comparison Detail View
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenCompareModal(VESSELS_DATABASE)}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Open side-by-side modal comparison of all registered vessels"
          >
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span>Multi-Vessel Modal</span>
          </button>

          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab('studio')}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg border border-cyan-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Launch Three.js 3D Vessel Studio"
              >
                <Box className="w-3.5 h-3.5 text-cyan-600" />
                <span>3D Vessel Studio</span>
              </button>
              <button
                onClick={() => onNavigateTab('safety')}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Navigate to Maritime Safety & Recovery"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Emergency &amp; STS Lighterage</span>
              </button>
            </>
          )}

          <div className="text-xs text-slate-500 hidden xl:flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Reactive Bathymetry Active</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: Class-Level Comparison View (Matches Screenshot 3) */}
      {/* ========================================================================= */}
      {viewMode === 'classView' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Filter Criteria Row (Fully Interactive) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Commodity</label>
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  {COMMODITIES_DATABASE.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cargo Quantity (tons)</label>
                <input
                  type="text"
                  value={cargoQty.toLocaleString()}
                  onChange={(e) => {
                    const val = Number(e.target.value.replace(/,/g, ''));
                    if (!isNaN(val)) setCargoQty(val);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Loading Port (Origin)</label>
                <select
                  value={loadingPort}
                  onChange={(e) => setLoadingPort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 truncate cursor-pointer"
                >
                  {renderPortOptions()}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Discharge Port (Destination)</label>
                <select
                  value={dischargePort}
                  onChange={(e) => setDischargePort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 truncate cursor-pointer"
                >
                  {renderPortOptions()}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Laycan Window</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{laycanWindow}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Max Draft at Discharge Port (m)</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 font-mono flex items-center justify-between">
                  <span>≈ {maxDraft} m</span>
                  <span className="text-[10px] font-normal text-slate-400">({selectedDestPort.name})</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="Lowest Total Cost">Lowest Total Cost</option>
                  <option value="Highest Feasibility">Highest Feasibility</option>
                  <option value="Fastest Delivery">Fastest Delivery</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSearchVessels}
                className="w-full bg-[#0d2a4a] hover:bg-[#12365e] text-white font-bold rounded-lg py-2.5 px-4 text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                {loadingEval ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Search className="w-4 h-4 text-cyan-400" />}
                <span>{loadingEval ? 'Evaluating...' : 'Search Vessels'}</span>
              </button>
            </div>
          </div>

          {/* Available Vessels Table + Vessel Comparison (Screenshot 3 Middle) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Available Vessels Table (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Available Vessels</h3>
                  <p className="text-xs text-slate-500">
                    Live dynamic charter rates for <strong className="text-slate-700">{selectedOriginPort.name} → {selectedDestPort.name}</strong> ({distanceNM.toLocaleString()} nm)
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {cargoQty.toLocaleString()} MT Cargo
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                      <th className="py-2.5 px-2 w-8"></th>
                      <th className="py-2.5 px-3">Vessel Class</th>
                      <th className="py-2.5 px-3">Capacity (DWT)</th>
                      <th className="py-2.5 px-1 text-center" colSpan={3}>
                        Typical Dimensions (m)
                        <div className="flex justify-around text-[9.5px] text-slate-400 font-normal">
                          <span>LOA</span>
                          <span>Beam</span>
                          <span>Draft</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3">Est. Freight (USD/ton)</th>
                      <th className="py-2.5 px-3">Est. Voyage Cost</th>
                      <th className="py-2.5 px-3">Arrival Window</th>
                      <th className="py-2.5 px-3 text-right">Suitability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classEvaluationData.map((row) => {
                      const isSelected = selectedClass === row.vesselClass;
                      const isBestMatch = recommendedClass.vesselClass === row.vesselClass;
                      
                      let suitabilityLabel = row.suitability;
                      let badgeClasses = row.badgeStyle;

                      if (isBestMatch && row.draftClearance >= 0) {
                        suitabilityLabel = 'Most Suitable';
                        badgeClasses = 'bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold';
                      }

                      return (
                        <tr
                          key={row.vesselClass}
                          onClick={() => setSelectedClass(row.vesselClass)}
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-blue-50/60 border-l-3 border-l-blue-600' 
                              : isBestMatch && row.draftClearance >= 0
                              ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-2 text-center">
                            <input
                              type="radio"
                              name="vClassRadio"
                              checked={isSelected}
                              onChange={() => setSelectedClass(row.vesselClass)}
                              className="text-blue-600 accent-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{row.vesselClass}</span>
                            {isBestMatch && row.draftClearance >= 0 && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" title="Recommended Option"></span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {row.capacityRange}
                          </td>
                          <td className="py-3 px-1 text-center font-mono text-slate-600">{row.loa}</td>
                          <td className="py-3 px-1 text-center font-mono text-slate-600">{row.beam}</td>
                          <td className={`py-3 px-1 text-center font-mono font-medium ${
                            row.draftClearance < 0 ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}>
                            {row.draft}m
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {row.freightRateDisplay}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">
                            $ {row.voyageCostMillion} M
                          </td>
                          <td className="py-3 px-3 text-slate-600 text-[11px]">
                            {row.arrivalWindow}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${badgeClasses}`}>
                              {suitabilityLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Vessel Comparison Radar / Dynamic Attribute Bars (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Vessel Comparison</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Compare by:</span>
                    <select 
                      value={compareBy}
                      onChange={(e) => setCompareBy(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      <option value="Suitability Score">Suitability Score</option>
                      <option value="Cost Efficiency">Cost Efficiency</option>
                      <option value="Draft Clearance">Draft Clearance</option>
                    </select>
                  </div>
                </div>

                {/* 3 Vessel Class Cards Side by Side (Supramax, Panamax, Capesize) */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {top3Classes.map((item) => {
                    const isSelected = selectedClass === item.vesselClass;
                    const isRecommended = recommendedClass.vesselClass === item.vesselClass && item.draftClearance >= 0;

                    return (
                      <div
                        key={item.vesselClass}
                        onClick={() => setSelectedClass(item.vesselClass)}
                        className={`rounded-lg p-2.5 text-center cursor-pointer transition-all ${
                          isSelected
                            ? 'border-2 border-emerald-500 bg-emerald-50/50 relative shadow-xs'
                            : isRecommended
                            ? 'border-2 border-blue-400 bg-blue-50/30'
                            : 'border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className={`font-bold text-xs ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {item.vesselClass}
                        </div>
                        <div className={`text-[10px] font-mono ${isSelected ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                          {(item.typicalDwt / 1000).toFixed(0)}k DWT
                        </div>
                        <div className={`text-[10px] ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                          Draft: {item.draft}m
                        </div>
                        {isRecommended && (
                          <span className="inline-block mt-1 text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                            Optimal
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 4 Dynamic Comparison Attribute Bars */}
                <div className="space-y-3.5 text-xs">
                  {/* Port Compatibility */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">Port Compatibility ({selectedDestPort.name} {maxDraft}m)</span>
                      <span className="text-[10px] font-mono text-slate-400">Supramax / Panamax / Capesize</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {top3Classes.map((item) => (
                        <div key={item.vesselClass} className="space-y-0.5">
                          <div className="h-2 rounded bg-slate-100 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                item.portCompatScore >= 80 ? 'bg-emerald-500' :
                                item.portCompatScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${item.portCompatScore}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 block text-right">
                            {item.portCompatScore}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cargo Suitability */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">Cargo Suitability ({cargoQty.toLocaleString()} MT)</span>
                      <span className="text-[10px] font-mono text-slate-400">Parcel Match</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {top3Classes.map((item) => (
                        <div key={item.vesselClass} className="space-y-0.5">
                          <div className="h-2 rounded bg-slate-100 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                item.cargoSuitScore >= 85 ? 'bg-emerald-500' :
                                item.cargoSuitScore >= 65 ? 'bg-teal-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${item.cargoSuitScore}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 block text-right">
                            {item.cargoSuitScore}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Cost Efficiency */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">Estimated Cost Efficiency</span>
                      <span className="text-[10px] font-mono text-slate-400">Delivered $/ton</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {top3Classes.map((item) => (
                        <div key={item.vesselClass} className="space-y-0.5">
                          <div className="h-2 rounded bg-slate-100 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                item.costEffScore >= 85 ? 'bg-emerald-500' :
                                item.costEffScore >= 75 ? 'bg-blue-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${item.costEffScore}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 block text-right">
                            {item.costEffScore}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">Market Availability</span>
                      <span className="text-[10px] font-mono text-slate-400">Positions Open</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {top3Classes.map((item) => (
                        <div key={item.vesselClass} className="space-y-0.5">
                          <div className="h-2 rounded bg-slate-100 overflow-hidden">
                            <div 
                              className="h-full bg-slate-500 transition-all duration-500"
                              style={{ width: `${item.availabilityScore}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 block text-right">
                            {item.availabilityScore}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Context Advisory */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Selected: <strong>{selectedClass}</strong></span>
                </span>
                <span className="font-mono text-slate-700 font-semibold">
                  {activeClassRow.freightRateDisplay} / ton
                </span>
              </div>
            </div>
          </div>

          {/* Bottom 3 Cards: Shipping Route + Key Port Constraints + Recommended Option (Screenshot 3 Bottom) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Shipping Route Card (Dynamic) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-2.5">Shipping Route</h4>
                <div className="rounded-xl relative overflow-hidden h-32 border border-slate-800 shadow-inner bg-slate-950 flex flex-col justify-between p-2.5">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-75"
                    style={{
                      backgroundImage: `url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/8/12')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/70" />

                  <div className="relative z-10 flex items-center justify-between text-[10px]">
                    <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      {routeCorridor.tag}
                    </span>
                    <span className="text-cyan-300 font-mono text-[9px] font-semibold">
                      {routeCorridor.channel}
                    </span>
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-1.5 px-0.5">
                    <div className="bg-slate-900/90 border border-cyan-500/40 px-2 py-1 rounded text-[10px] text-white">
                      <span className="text-[8px] text-cyan-400 block font-semibold">ORIGIN</span>
                      <span className="font-bold truncate max-w-[90px] block">{selectedOriginPort.name}</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-[9px] text-cyan-300 font-mono font-bold">~{distanceNM.toLocaleString()} nm</span>
                      <div className="w-full flex items-center gap-1 my-0.5">
                        <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></div>
                        <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                      </div>
                      <span className="text-[8px] text-slate-300">
                        {Math.round(distanceNM / (13.5 * 24))} – {Math.round(distanceNM / (13.5 * 24) + 3)} Days
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-emerald-500/40 px-2 py-1 rounded text-[10px] text-white">
                      <span className="text-[8px] text-emerald-400 block font-semibold">DEST</span>
                      <span className="font-bold truncate max-w-[90px] block">{selectedDestPort.name}</span>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-300">
                    <span>{maxDraft}m Draft Permissible</span>
                    <span className="text-cyan-300 font-semibold">
                      {selectedDestPort.maxDraftMeters >= 17 ? 'Deepwater Approach' : 'Coastal / Tidal Approach'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Distance (approx.)</span>
                    <span className="font-bold font-mono text-slate-800">{distanceNM.toLocaleString()} nm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Voyage Time</span>
                    <span className="font-bold font-mono text-slate-800">
                      {Math.round(distanceNM / (13.5 * 24))} – {Math.round(distanceNM / (13.5 * 24) + 3)} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Major Route</span>
                    <span className="font-medium text-slate-800 truncate max-w-[180px]">
                      {selectedOriginPort.country} → {selectedDestPort.region || selectedDestPort.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Port Constraints Card (Dynamic for Discharge Port) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-2">
                  Key Port Constraints ({selectedDestPort.name})
                </h4>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Max Draft</span>
                    <span className="font-bold font-mono text-slate-900">{maxDraft} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Max LOA</span>
                    <span className="font-bold font-mono text-slate-900">{selectedDestPort.maxLOAMeters} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Max Beam</span>
                    <span className="font-bold font-mono text-slate-900">{selectedDestPort.maxBeamMeters} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Berth Availability</span>
                    <span className="text-slate-700">
                      {selectedDestPort.berthCount} Active Berths ({selectedDestPort.congestionStatus})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Cargo Handling Rate</span>
                    <span className="font-mono text-slate-800">
                      {selectedDestPort.handlingRateTPD.toLocaleString()} tons/day
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Suitable Vessel Types</span>
                    <span className="font-bold text-emerald-700">
                      {selectedDestPort.maxDraftMeters >= 17.5 
                        ? 'Capesize / Panamax' 
                        : selectedDestPort.maxDraftMeters >= 14.0 
                        ? 'Panamax / Supramax' 
                        : selectedDestPort.maxDraftMeters >= 11.0 
                        ? 'Supramax / Handysize' 
                        : 'Handysize Only (Riverine / Tidal)'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDestPort.maxDraftMeters < 14.5 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Draft restricted port ({maxDraft}m). Deep vessels require Sandheads or outer lighterage.</span>
                </div>
              )}
            </div>

            {/* Recommended Option Card (Dynamic) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Recommended Option</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Recommended
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900">
                  {recommendedClass.vesselClass}
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span className="font-bold font-mono text-slate-900">{recommendedClass.capacityRange} DWT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Freight Rate:</span>
                    <span className="font-bold font-mono text-emerald-700">{recommendedClass.freightRateDisplay} / ton</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Total Cost:</span>
                    <span className="font-bold font-mono text-slate-900">$ {recommendedClass.voyageCostMillion} Million</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Arrival:</span>
                    <span className="font-bold text-slate-800">{recommendedClass.arrivalWindow}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewMode('detailedView')}
                className="w-full mt-4 bg-[#0d2a4a] hover:bg-[#12365e] text-white font-bold rounded-lg py-2.5 px-3 text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <span>View Detailed Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: Detailed Vessel Comparison (Matches Screenshot 4) */}
      {/* ========================================================================= */}
      {viewMode === 'detailedView' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Filter Bar (Screenshot 4, Fully Interactive) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cargo Quantity (tonnes)</label>
                <input
                  type="text"
                  value={cargoQty.toLocaleString()}
                  onChange={(e) => {
                    const val = Number(e.target.value.replace(/,/g, ''));
                    if (!isNaN(val)) setCargoQty(val);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Loading Port</label>
                <select 
                  value={loadingPort}
                  onChange={(e) => setLoadingPort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 truncate cursor-pointer"
                >
                  {renderPortOptions()}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Discharge Port</label>
                <select 
                  value={dischargePort}
                  onChange={(e) => setDischargePort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 truncate cursor-pointer"
                >
                  {renderPortOptions()}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Laycan Window</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{laycanWindow}</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSearchVessels}
                  className="w-full bg-[#0d2a4a] hover:bg-[#12365e] text-white font-bold rounded-lg py-2.5 px-4 text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {loadingEval ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Search className="w-4 h-4 text-cyan-400" />}
                  <span>{loadingEval ? 'Searching...' : 'Search'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content: Left Available Vessels Table + Right Detail Audit Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Available Vessels Table (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Available Vessels <span className="font-normal text-xs text-slate-500">(Filtered Results)</span>
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Showing {detailedVessels.length} of {detailedVessels.length} vessels
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Vessel Name</th>
                        <th className="py-2.5 px-3">Vessel Class</th>
                        <th className="py-2.5 px-3">DWT (tonnes)</th>
                        <th className="py-2.5 px-3">Draft (m)</th>
                        <th className="py-2.5 px-3">Est. Freight Cost (USD/ton)</th>
                        <th className="py-2.5 px-3">Arrival Window</th>
                        <th className="py-2.5 px-3 text-center">Suitability Score</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                        <th className="py-2.5 px-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailedVessels.map((v) => {
                        const isSelected = v.id === selectedVesselId;
                        const scoreBorderColor = 
                          v.score >= 85 ? 'border-emerald-500 text-emerald-800' :
                          v.score >= 70 ? 'border-amber-500 text-amber-800' : 'border-rose-500 text-rose-700';

                        return (
                          <tr
                            key={v.id}
                            onClick={() => setSelectedVesselId(v.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50/70 border-l-3 border-l-blue-600'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {v.name}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">
                              {v.vesselClass}
                            </td>
                            <td className="py-3 px-3 font-mono font-medium text-slate-800">
                              {v.dwt.toLocaleString()}
                            </td>
                            <td className={`py-3 px-3 font-mono ${
                              v.draft > selectedDestPort.maxDraftMeters ? 'text-rose-600 font-bold' : 'text-slate-700'
                            }`}>
                              {v.draft.toFixed(1)}
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                              {v.freightCostRange}
                            </td>
                            <td className="py-3 px-3 text-slate-600 text-[11px]">
                              {v.arrivalWindow}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {/* Circular Score Ring Gauge (Screenshot 4) */}
                              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold font-mono text-xs ${scoreBorderColor}`}>
                                {v.score}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${v.statusBadge}`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-slate-400">
                              <ChevronRight className="w-4 h-4" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Row in Left Section: Recommended Route + Why This Matters? (Screenshot 4) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Recommended Route Map & Specs (8 cols) */}
                <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm mb-2.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Recommended Route</span>
                  </div>

                  <div className="rounded-xl relative overflow-hidden h-32 border border-slate-800 shadow-inner bg-slate-950 flex flex-col justify-between p-3 mb-3">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-75"
                      style={{
                        backgroundImage: `url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/8/12')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/70" />

                    <div className="relative z-10 flex items-center justify-between text-[10px]">
                      <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        {routeCorridor.tag}
                      </span>
                      <span className="text-cyan-300 font-mono text-[10px] font-semibold">
                        {routeCorridor.channel}
                      </span>
                    </div>

                    <div className="relative z-10 flex items-center justify-between gap-2 px-1">
                      <div className="bg-slate-900/90 border border-cyan-500/40 px-2.5 py-1.5 rounded-lg text-[11px] text-white">
                        <span className="text-[9px] text-cyan-400 block font-semibold">ORIGIN</span>
                        <span className="font-bold truncate max-w-[120px] block">{selectedOriginPort.name}</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center">
                        <span className="text-[10px] text-cyan-300 font-mono font-bold">~ {distanceNM.toLocaleString()} nm</span>
                        <div className="w-full flex items-center gap-1 my-0.5">
                          <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                          <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                        </div>
                        <span className="text-[9px] text-slate-300">
                          {Math.round(distanceNM / (activeDetailedVessel.speedKnots * 24))} – {Math.round(distanceNM / (activeDetailedVessel.speedKnots * 24) + 2)} Days
                        </span>
                      </div>

                      <div className="bg-slate-900/90 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg text-[11px] text-white">
                        <span className="text-[9px] text-emerald-400 block font-semibold">DESTINATION</span>
                        <span className="font-bold truncate max-w-[120px] block">{selectedDestPort.name}</span>
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-300">
                      <span>
                        Under Keel Clearance: {selectedDestPort.maxDraftMeters - activeDetailedVessel.draft >= 0 ? '+' : ''}
                        {(selectedDestPort.maxDraftMeters - activeDetailedVessel.draft).toFixed(1)}m (
                        {selectedDestPort.maxDraftMeters - activeDetailedVessel.draft >= 1.0 ? 'Safe' : selectedDestPort.maxDraftMeters - activeDetailedVessel.draft >= 0 ? 'Marginal' : 'Exceeded'})
                      </span>
                      <span className={`font-semibold font-mono ${
                        selectedDestPort.maxDraftMeters >= activeDetailedVessel.draft ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {selectedDestPort.maxDraftMeters >= activeDetailedVessel.draft ? '100% Port Feasibility' : 'Draft Restricted / Lighterage Req.'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Distance (approx.)</span>
                      <span className="font-bold font-mono text-slate-800">{distanceNM.toLocaleString()} nm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Estimated Voyage Time</span>
                      <span className="font-bold font-mono text-slate-800">
                        {Math.round(distanceNM / (activeDetailedVessel.speedKnots * 24))} – {Math.round(distanceNM / (activeDetailedVessel.speedKnots * 24) + 2)} days
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Primary Cargo</span>
                      <span className="font-bold text-slate-800 truncate block">{selectedCommodity.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Recommended Vessel Class</span>
                      <span className="font-bold text-emerald-700">{recommendedClass.vesselClass}</span>
                    </div>
                  </div>
                </div>

                {/* Why This Matters? Card (4 cols) */}
                <div className="md:col-span-4 bg-[#f0f9ff] border border-blue-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span>Why This Matters?</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mb-3">
                      Choosing the right vessel at the right time reduces freight costs, avoids port congestion and ensures timely delivery of raw materials to support India's industrial plants.
                    </p>
                    <div className="p-2.5 bg-white/80 border border-blue-100 rounded-lg text-[11px] text-slate-600 space-y-1">
                      <div className="font-semibold text-blue-900 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        <span>Port Bathymetry Insight:</span>
                      </div>
                      <p>
                        {selectedDestPort.name} maximum draft is <strong>{maxDraft}m</strong>. 
                        {activeDetailedVessel.draft > selectedDestPort.maxDraftMeters
                          ? ` ${activeDetailedVessel.name} draft (${activeDetailedVessel.draft}m) exceeds harbor limit. Outer anchorage lighterage required.`
                          : ` ${activeDetailedVessel.name} operates safely within navigational safety margins.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Detailed Audit Panel (4 cols) (Exact Replica of Screenshot 4) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{activeDetailedVessel.name}</h3>
                  <div className="text-xs text-slate-500">
                    {activeDetailedVessel.vesselClass} | {activeDetailedVessel.dwt.toLocaleString()} DWT
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${activeDetailedVessel.statusBadge} shadow-2xs`}>
                  {activeDetailedVessel.status}
                </span>
              </div>

              {/* Photorealistic Maritime Bulk Carrier Technical Profile Card */}
              <div className="rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 h-44 relative p-4 flex flex-col justify-between shadow-md">
                {/* Background Blueprint Grid */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Top Badge: AIS Telemetry & Class */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-mono text-[11px] font-bold text-cyan-300">
                      IMO 9642817 • CALLSIGN 9V8432
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    FLAG: {activeDetailedVessel.flag?.toUpperCase() || 'LIBERIA'}
                  </span>
                </div>

                {/* Center Ship Technical Profile Blueprint */}
                <div className="relative z-10 flex items-center justify-center py-2">
                  <div className="w-full max-w-[340px] bg-slate-950/80 border border-cyan-500/30 rounded-lg p-2.5 backdrop-blur-md">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pb-1.5 border-b border-slate-800">
                      <span className="text-cyan-400 font-bold">{activeDetailedVessel.name.toUpperCase()}</span>
                      <span className="text-emerald-400 font-bold">{activeDetailedVessel.vesselClass.toUpperCase()}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">DRAFT (LADEN)</span>
                        <span className={`font-bold font-mono ${
                          activeDetailedVessel.draft > selectedDestPort.maxDraftMeters ? 'text-rose-400' : 'text-white'
                        }`}>
                          {activeDetailedVessel.draft.toFixed(1)} m
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">LOA / BEAM</span>
                        <span className="font-bold text-white font-mono">{activeDetailedVessel.loa}m / {activeDetailedVessel.beam}m</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">SPEED / BURN</span>
                        <span className="font-bold text-cyan-300 font-mono">
                          {activeDetailedVessel.speedKnots} kts / {activeDetailedVessel.consumption} MT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Status Bar */}
                <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                  <span className={`flex items-center gap-1 font-medium ${
                    activeDetailedVessel.draft <= selectedDestPort.maxDraftMeters ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {activeDetailedVessel.draft <= selectedDestPort.maxDraftMeters ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>100% {selectedDestPort.name} Constraint Cleared</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span>Draft Exceeds {selectedDestPort.name} Limit</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono text-slate-300">
                    Eco-Design VLSFO
                  </span>
                </div>
              </div>

              {/* 3D Vessel Studio Launcher */}
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('studio')}
                  className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white flex items-center justify-between text-xs font-bold transition-all shadow-sm cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
                    <span>Inspect 3D Digital Twin &amp; Ocean Waves</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                    3D Studio <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              )}

              {/* Key Specifications (Screenshot 4) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Key Specifications
                </h4>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Deadweight (DWT)</span>
                    <span className="font-bold font-mono text-slate-900">{activeDetailedVessel.dwt.toLocaleString()} tonnes</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Length Overall (LOA)</span>
                    <span className="font-bold font-mono text-slate-900">{activeDetailedVessel.loa} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Beam</span>
                    <span className="font-bold font-mono text-slate-900">{activeDetailedVessel.beam} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Draft (max)</span>
                    <span className="font-bold font-mono text-slate-900">{activeDetailedVessel.draft.toFixed(1)} m</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Charter Type</span>
                    <span className="font-medium text-slate-800">{activeDetailedVessel.charterType}</span>
                  </div>
                </div>
              </div>

              {/* Suitability Comparison Horizontal Bars (Screenshot 4, Dynamic) */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Suitability Comparison
                </h4>

                <div className="space-y-2 text-xs">
                  {classEvaluationData.map((cls) => {
                    const isOptimal = recommendedClass.vesselClass === cls.vesselClass && cls.draftClearance >= 0;
                    const barColor = 
                      cls.vesselClass === 'Panamax' ? 'bg-emerald-600' :
                      cls.vesselClass === 'Supramax' ? 'bg-teal-500' :
                      cls.vesselClass === 'Capesize' ? 'bg-amber-500' : 'bg-orange-500';

                    return (
                      <div key={cls.vesselClass}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className={`font-medium ${isOptimal ? 'font-bold text-emerald-800' : 'text-slate-600'}`}>
                            {cls.vesselClass}
                          </span>
                          <span className={`font-bold font-mono ${isOptimal ? 'text-emerald-800' : 'text-slate-800'}`}>
                            {cls.overallScore}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${barColor} transition-all duration-500`} 
                            style={{ width: `${cls.overallScore}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
