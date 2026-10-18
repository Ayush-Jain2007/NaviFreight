import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronDown, 
  Search, 
  Settings, 
  BarChart2, 
  ShieldCheck, 
  Scale, 
  Compass, 
  Layers, 
  Ship, 
  Anchor,
  Info,
  Sparkles,
  Loader2
} from 'lucide-react';
import { FreightChart } from './FreightChart';
import { SimulationParams, Port } from '../types';
import { naviApi, ForecastApiResponse, AIInsightResponse } from '../services/api';
import { PORTS_DATABASE, COMMODITIES_DATABASE } from '../data/maritimeData';
import { getRouteDistance } from '../utils/freightCalculator';

interface FreightForecastProps {
  simulationParams: SimulationParams;
  onUpdateParams: (newParams: Partial<SimulationParams>) => void;
  onNavigateTab: (tab: any) => void;
}

// Strategic corridor & navigational details generator for selected route
function getRouteDisplayInfo(originPort: Port, destPort: Port) {
  const originCountry = originPort.country;
  const originId = originPort.id;

  if (originCountry === 'United States') {
    if (originId === 'houston' || originId === 'new_orleans') {
      return {
        corridorName: 'via Florida Straits & Suez',
        routingSubtext: 'Gulf of Mexico, Florida Straits, Gibraltar & Suez passage',
        majorWaypoints: 'Florida Straits, Gibraltar, Suez, Bab-el-Mandeb',
        seaCondition: 'Moderate Atlantic Swell',
      };
    }
    if (originId === 'los_angeles') {
      return {
        corridorName: 'via Pacific & Malacca Strait',
        routingSubtext: 'Trans-Pacific deepwater corridor via Malacca & Bay of Bengal',
        majorWaypoints: 'Hawaii, Luzon Strait, Singapore, Six Degree Channel',
        seaCondition: 'Open Pacific Swell',
      };
    }
    return {
      corridorName: 'via Gibraltar & Suez Canal',
      routingSubtext: 'North Atlantic, Gibraltar & Suez deepwater corridor',
      majorWaypoints: 'Gibraltar, Port Said (Suez), Bab-el-Mandeb, Dondra Head',
      seaCondition: 'North Atlantic High Seas',
    };
  }

  if (originCountry === 'Ukraine') {
    return {
      corridorName: 'via Bosporus & Suez Canal',
      routingSubtext: 'Black Sea, Turkish Straits, Suez & Arabian Sea passage',
      majorWaypoints: 'Istanbul (Bosporus), Çanakkale (Dardanelles), Suez, Sri Lanka',
      seaCondition: 'Favorable Mediterranean Seas',
    };
  }

  if (originCountry === 'Australia') {
    if (['newcastle', 'dalrymple_bay', 'gladstone', 'port_kembla'].includes(originId)) {
      return {
        corridorName: 'via Torres Strait & Six Degree',
        routingSubtext: 'Torres Strait, Arafura Sea & Bay of Bengal corridor',
        majorWaypoints: 'Torres Strait, Arafura Sea, Lombok, Great Channel',
        seaCondition: 'Trade Winds / Favorable',
      };
    }
    return {
      corridorName: 'via Lombok Strait',
      routingSubtext: 'Lombok Strait & Bay of Bengal routing',
      majorWaypoints: 'Lombok Strait, Karimata, Six Degree Channel',
      seaCondition: 'Favorable Seas',
    };
  }

  if (originCountry === 'South Africa') {
    return {
      corridorName: 'via Mozambique Channel',
      routingSubtext: 'Mozambique Channel & Indian Ocean Equatorial corridor',
      majorWaypoints: 'Mozambique Channel, Seychelles Basin, Dondra Head TSS',
      seaCondition: 'Agulhas Current / Moderate Swell',
    };
  }

  if (['Singapore', 'Malaysia', 'Indonesia'].includes(originCountry)) {
    return {
      corridorName: 'via Malacca Strait TSS',
      routingSubtext: 'Strait of Malacca TSS & Andaman Sea corridor',
      majorWaypoints: 'Singapore TSS, Malacca Strait, Six Degree Channel',
      seaCondition: 'Calm Equatorial Waters',
    };
  }

  if (['China', 'Japan', 'South Korea', 'Taiwan'].includes(originCountry)) {
    return {
      corridorName: 'via South China Sea & Malacca',
      routingSubtext: 'East Asia shipping lanes via Singapore TSS & Bay of Bengal',
      majorWaypoints: 'Taiwan Strait, Singapore Anchorage, Nicobar Channel',
      seaCondition: 'Seasonal Monsoonal Breeze',
    };
  }

  if (['United Arab Emirates', 'Oman'].includes(originCountry)) {
    return {
      corridorName: 'via Arabian Sea Corridor',
      routingSubtext: 'Gulf of Oman direct deepwater passage to India',
      majorWaypoints: 'Gulf of Oman, Arabian Sea, Western/Eastern approaches',
      seaCondition: 'Calm Arabian Sea',
    };
  }

  if (['Brazil', 'Peru'].includes(originCountry)) {
    return {
      corridorName: 'via Cape of Good Hope',
      routingSubtext: 'South Atlantic & Southern Indian Ocean Valemax corridor',
      majorWaypoints: 'Cape Town, Madagascar passage, Dondra Head TSS',
      seaCondition: 'Roaring Forties Swell',
    };
  }

  return {
    corridorName: 'via International Deepwater Route',
    routingSubtext: 'IMO recommended deepwater navigational corridor',
    majorWaypoints: 'International deepwater navigation waypoints',
    seaCondition: 'Standard Sea State',
  };
}

export const FreightForecast: React.FC<FreightForecastProps> = ({
  simulationParams,
  onUpdateParams,
  onNavigateTab,
}) => {
  const [origin, setOrigin] = useState(simulationParams.originPortId || 'port_hedland');
  const [destination, setDestination] = useState(simulationParams.destPortId || 'paradip');
  const [commodity, setCommodity] = useState(simulationParams.commodityId || 'iron_ore');
  const [vesselClass, setVesselClass] = useState('Panamax');
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [forecastData, setForecastData] = useState<ForecastApiResponse | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsightResponse | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [calculatedRates, setCalculatedRates] = useState<{
    currentRate: number;
    forecastRate: number;
    deltaPct: number;
    uncertainty: number;
    targetMonthLabel: string;
  } | null>(null);

  // Categorize ports for easy, clean browsing
  const indianEastCoastPorts = PORTS_DATABASE.filter(p => p.country === 'India' && p.isIndianEastCoast);
  const indianWestCoastPorts = PORTS_DATABASE.filter(p => p.country === 'India' && !p.isIndianEastCoast);
  const australiaPorts = PORTS_DATABASE.filter(p => p.country === 'Australia');
  const asiaPorts = PORTS_DATABASE.filter(p => ['Singapore', 'Malaysia', 'Indonesia', 'China', 'South Korea', 'Japan', 'Taiwan'].includes(p.country));
  const middleEastAfricaPorts = PORTS_DATABASE.filter(p => ['South Africa', 'United Arab Emirates', 'Oman'].includes(p.country));
  const americasPorts = PORTS_DATABASE.filter(p => ['United States', 'Canada', 'Brazil', 'Peru'].includes(p.country));
  const ukraineEuropePorts = PORTS_DATABASE.filter(p => ['Ukraine', 'Netherlands', 'Belgium', 'Germany'].includes(p.country));

  // Dynamic route economics
  const originPortObj = PORTS_DATABASE.find(p => p.id === origin) || PORTS_DATABASE[0];
  const destPortObj = PORTS_DATABASE.find(p => p.id === destination) || PORTS_DATABASE[1];
  const distanceNM = getRouteDistance(origin, destination);
  const vesselSpeed = vesselClass === 'Capesize' ? 12.6 : vesselClass === 'Supramax' ? 13.5 : vesselClass === 'Handysize' ? 13.8 : 13.2;
  const estVoyageDays = Math.max(2, Math.round(distanceNM / (vesselSpeed * 24)));

  const routeDisplayInfo = useMemo(() => {
    return getRouteDisplayInfo(originPortObj, destPortObj);
  }, [originPortObj, destPortObj]);

  const displayCurrentRate = calculatedRates?.currentRate ?? forecastData?.currentRateUSD ?? 24.8;
  const displayForecastRate = calculatedRates?.forecastRate ?? forecastData?.projectedRateUSD ?? 28.5;
  const displayDelta = calculatedRates ? calculatedRates.deltaPct : (forecastData?.deltaPercentage ?? 12);
  const displayUncertainty = calculatedRates?.uncertainty ?? 3.5;
  const rangeLow = Math.max(1, (displayForecastRate - displayUncertainty)).toFixed(1);
  const rangeHigh = (displayForecastRate + displayUncertainty).toFixed(1);
  const cargoParcelMT = simulationParams.cargoQuantityMT || 150000;

  const handleGenerateForecast = () => {
    setLoadingForecast(true);
    const bunker = simulationParams.bunkerPricePerMT || 624;
    const volatility = simulationParams.marketVolatilityShock || 0;
    const cargoQty = simulationParams.cargoQuantityMT || 150000;

    naviApi.calculateForecast({
      originPortId: origin,
      destPortId: destination,
      commodityId: commodity,
      vesselClass,
      horizonDays: horizon,
      bunkerPricePerMT: bunker,
      marketVolatilityShock: volatility,
    }).then((res) => {
      setForecastData(res);
      setLoadingForecast(false);
    }).catch((err) => {
      console.error('Forecast error:', err);
      setLoadingForecast(false);
    });

    naviApi.getAIMaritimeInsight({
      originPort: originPortObj?.name || origin,
      destPort: destPortObj?.name || destination,
      commodity: COMMODITIES_DATABASE.find(c => c.id === commodity)?.name || commodity,
      cargoQuantityMT: cargoQty,
      currentRateUSD: forecastData?.currentRateUSD || 24.8,
      projectedRateUSD: forecastData?.projectedRateUSD || 28.5,
      horizonDays: horizon,
      bunkerPriceUSD: bunker,
      congestionDays: simulationParams.portCongestionDays || 1.5,
    }).then((insight) => {
      setAiInsight(insight);
    }).catch(console.error);

    onUpdateParams({
      originPortId: origin,
      destPortId: destination,
      commodityId: commodity,
    });
  };

  useEffect(() => {
    handleGenerateForecast();
  }, [origin, destination, commodity, vesselClass, horizon, simulationParams.bunkerPricePerMT, simulationParams.marketVolatilityShock]);

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
      <optgroup label="🇺🇸 United States & Americas Bulk Ports">
        {americasPorts.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
        ))}
      </optgroup>
      <optgroup label="🇺🇦 Ukraine & European Ports">
        {ukraineEuropePorts.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.country})</option>
        ))}
      </optgroup>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Parameter Filter Bar (Screenshot 2) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Origin */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0 w-full">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Ship className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  Origin (Loading Port)
                </span>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full font-bold text-xs text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer truncate"
                >
                  {renderPortOptions()}
                </select>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1 pointer-events-none" />
          </div>

          {/* Destination */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0 w-full">
              <div className="w-8 h-8 rounded bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                <Anchor className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  Destination (Discharge Port)
                </span>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full font-bold text-xs text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer truncate"
                >
                  {renderPortOptions()}
                </select>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1 pointer-events-none" />
          </div>

          {/* Commodity */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0 w-full">
              <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  Commodity
                </span>
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full font-bold text-xs text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                >
                  {COMMODITIES_DATABASE.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1 pointer-events-none" />
          </div>

          {/* Vessel Class */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0 w-full">
              <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Ship className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  Vessel Class
                </span>
                <select
                  value={vesselClass}
                  onChange={(e) => setVesselClass(e.target.value)}
                  className="w-full font-bold text-xs text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                >
                  <option value="Panamax">Panamax (65k–85k DWT)</option>
                  <option value="Capesize">Capesize (120k–200k DWT)</option>
                  <option value="Supramax">Supramax (50k–65k DWT)</option>
                  <option value="Handysize">Handysize (25k–45k DWT)</option>
                </select>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1 pointer-events-none" />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <button
              onClick={handleGenerateForecast}
              disabled={loadingForecast}
              className="w-full bg-[#0d2a4a] hover:bg-[#12365e] text-white font-bold rounded-lg py-2.5 px-3 text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-70"
            >
              {loadingForecast ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Generate Forecast</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-center gap-1 py-0.5 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>{showAdvanced ? 'Hide Advanced' : 'Advanced Options'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Options Panel */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/70 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-600" />
                Advanced Macro & Operational Parameters
              </span>
              <span className="text-[10px] text-slate-500">Fine-tune voyage and economic assumptions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cargo Parcel Size (MT)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={simulationParams.cargoQuantityMT || 150000}
                  onChange={(e) => onUpdateParams({ cargoQuantityMT: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  VLSFO Bunker Fuel ($/MT)
                </label>
                <input
                  type="number"
                  step="10"
                  value={simulationParams.bunkerPricePerMT || 624}
                  onChange={(e) => onUpdateParams({ bunkerPricePerMT: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Port Congestion Allowance (Days)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={simulationParams.portCongestionDays || 1.5}
                  onChange={(e) => onUpdateParams({ portCongestionDays: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Market Shock (% Volatility)
                </label>
                <input
                  type="number"
                  step="1"
                  value={simulationParams.marketVolatilityShock || 0}
                  onChange={(e) => onUpdateParams({ marketVolatilityShock: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono text-slate-800"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleGenerateForecast}
                className="px-3.5 py-1.5 rounded-lg bg-[#0d2a4a] hover:bg-[#12365e] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Search className="w-3 h-3" />
                <span>Apply & Recalculate Forecast</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4 Metric Cards (Screenshot 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current Freight Rate */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Current Freight Rate</span>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-sans mt-0.5">
                $ {displayCurrentRate.toFixed(1)} <span className="text-sm font-semibold text-slate-500">/ ton</span>
              </div>
              <div className={`text-xs font-bold flex items-center gap-0.5 mt-0.5 ${displayDelta >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                <span>{displayDelta >= 0 ? '▲' : '▼'} {Math.abs(displayDelta).toFixed(1)}%</span>
                <span className="text-slate-500 font-normal ml-1">forward delta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Forecasted Rate (Next 3 Months) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Forecasted Rate ({horizon} Days)</span>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-sans mt-0.5">
                $ {rangeLow} – {rangeHigh} <span className="text-sm font-semibold text-slate-500">/ ton</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Target: ${displayForecastRate.toFixed(1)}/t {calculatedRates?.targetMonthLabel ? `(${calculatedRates.targetMonthLabel})` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Expected Arrival Window */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Expected Transit Window</span>
              <div className="text-xl font-black text-slate-900 tracking-tight font-sans mt-0.5">
                {estVoyageDays} – {estVoyageDays + Math.max(2, Math.round(estVoyageDays * 0.15))} Days
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Info className="w-3 h-3 text-slate-400" />
                <span>ETA based on {vesselClass} ({vesselSpeed} kts)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Est. Voyage Distance & Duration */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Nautical Route Distance</span>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-sans mt-0.5">
                {distanceNM.toLocaleString()} <span className="text-sm font-semibold text-slate-500">NM</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-full">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate" title={`${originPortObj.name} → ${destPortObj.name}`}>{originPortObj.name} → {destPortObj.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Historical and Forecasted Chart + Forecast Insights (Screenshot 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>Historical and Forecasted Freight Rate</span>
            </div>

            {/* Forecast Horizon Toggle Buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-xs text-slate-500 font-medium mr-1">Forecast Horizon:</span>
              {( [30, 60, 90] as const ).map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    horizon === h
                      ? 'bg-[#0f2942] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>

          {/* SVG Chart with dynamic data */}
          <div className="pt-2">
            <FreightChart 
              height={260} 
              originId={origin}
              destId={destination}
              vesselClass={vesselClass}
              commodityId={commodity}
              horizonDays={horizon}
              bunkerPriceUSD={simulationParams.bunkerPricePerMT || 624}
              marketVolatilityShock={simulationParams.marketVolatilityShock || 0}
              onRateCalculated={setCalculatedRates}
            />
          </div>
        </div>

        {/* Right Forecast Insights Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Forecast Insights</span>
              </div>
              {loadingForecast && (
                <span className="text-[10px] font-mono text-cyan-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Live calculating
                </span>
              )}
            </div>

            <div className="space-y-3.5 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Expected Range ({horizon} Days)
                  </span>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    $ {rangeLow} – {rangeHigh} <span className="text-xs font-normal text-slate-500">/ ton</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Trend</span>
                  <div className="text-sm font-bold text-slate-800">
                    {displayDelta > 2 ? 'Upward Forward Pressure' : displayDelta < -2 ? 'Downward Rate Softening' : 'Seasonal Stabilization'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Confidence Level</span>
                  <div className="text-sm font-bold text-slate-800 font-mono">
                    ±{((displayUncertainty / (displayForecastRate || 1)) * 100).toFixed(0)}% (±${displayUncertainty.toFixed(1)}/t)
                  </div>
                </div>
              </div>
            </div>

            {/* AI Strategic Intelligence Callout */}
            {aiInsight && (
              <div className="mt-3.5 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-200/70 text-xs shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>{aiInsight.isGeneratedByAI ? 'Gemini 2.5 Live Analysis' : 'Maritime Intelligence Feed'}</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    {aiInsight.riskRating} Risk
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed mb-2">
                  {aiInsight.executiveSummary}
                </p>
                <div className="pt-2 border-t border-blue-200/50 text-[10px] text-blue-900 leading-snug">
                  <strong>Recommendation:</strong> {aiInsight.procurementRecommendation}
                </div>
              </div>
            )}

            {/* Key Factors Influencing Forecast */}
            <div className="mt-3.5">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Key Factors Influencing Forecast
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>Global demand for iron ore</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>Bunker fuel prices</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>Vessel supply availability</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>Seasonal trends (Q1–Q2)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>Port congestion index</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Scenario Comparison + Route Information (Screenshot 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scenario Comparison Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base mb-3">
            <Scale className="w-4 h-4 text-blue-600" />
            <span>Scenario Comparison</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Scenario</th>
                  <th className="py-2.5 px-3">Charter Timing</th>
                  <th className="py-2.5 px-3">Est. Freight Rate (USD/ton)</th>
                  <th className="py-2.5 px-3">
                    Est. Total Cost (USD million)
                    <span className="text-[10px] text-slate-400 block font-normal">(for {cargoParcelMT.toLocaleString()} tons)</span>
                  </th>
                  <th className="py-2.5 px-3">Expected Arrival</th>
                  <th className="py-2.5 px-3 text-right">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Base Case */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">Base Case</td>
                  <td className="py-3 px-3 text-slate-600">Current Window</td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">{displayCurrentRate.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{((displayCurrentRate * cargoParcelMT) / 1_000_000).toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">~{estVoyageDays}d voyage</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700">
                      Medium
                    </span>
                  </td>
                </tr>

                {/* Early Booking */}
                <tr className="hover:bg-slate-50/80 transition-colors bg-emerald-50/20">
                  <td className="py-3 px-3 font-bold text-emerald-800">Early Booking</td>
                  <td className="py-3 px-3 text-slate-600">Spot Advance (-8%)</td>
                  <td className="py-3 px-3 font-mono font-medium text-emerald-700">{(displayCurrentRate * 0.92).toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-800">{(((displayCurrentRate * 0.92) * cargoParcelMT) / 1_000_000).toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">Earliest window</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      Low
                    </span>
                  </td>
                </tr>

                {/* Wait and Book */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-rose-800">Wait and Book</td>
                  <td className="py-3 px-3 text-slate-600">{calculatedRates?.targetMonthLabel || `+${horizon} Days`}</td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">{displayForecastRate.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-900">{((displayForecastRate * cargoParcelMT) / 1_000_000).toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">+{estVoyageDays + Math.round(horizon * 0.6)}d window</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-block px-3 py-0.5 rounded-md text-[11px] font-bold ${displayDelta > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {displayDelta > 0 ? 'High' : 'Favorable'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Route Information (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base mb-3">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Route Information</span>
            </div>

            {/* Realistic Satellite Route Mini Visualizer */}
            <div className="rounded-xl relative overflow-hidden h-40 border border-slate-800 shadow-inner bg-slate-950 flex flex-col justify-between p-3">
              {/* Photorealistic Satellite Texture */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-75"
                style={{
                  backgroundImage: `url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/8/12')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/70" />

              {/* Satellite Top Bar */}
              <div className="relative z-10 flex items-center justify-between text-[10px]">
                <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  ESRI WORLD SATELLITE
                </span>
                <span className="text-cyan-300 font-mono font-semibold">
                  {vesselSpeed} kts • {routeDisplayInfo.seaCondition}
                </span>
              </div>

              {/* Waypoint Badges */}
              <div className="relative z-10 flex items-center justify-between gap-2 px-1">
                <div className="bg-slate-900/90 border border-cyan-500/40 px-2.5 py-1.5 rounded-lg text-[11px] text-white backdrop-blur-md max-w-[36%]">
                  <span className="text-[9px] text-cyan-400 block font-semibold truncate">LOADING HUB</span>
                  <span className="font-bold truncate block" title={`${originPortObj.name} (${originPortObj.country})`}>
                    {originPortObj.name}
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-center min-w-0">
                  <span className="text-[10px] text-cyan-300 font-mono font-bold">~ {distanceNM.toLocaleString()} nm</span>
                  <div className="w-full flex items-center gap-1 my-0.5">
                    <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                    <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                  </div>
                  <span className="text-[9px] text-slate-300 truncate max-w-full text-center" title={routeDisplayInfo.corridorName}>
                    {routeDisplayInfo.corridorName}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg text-[11px] text-white backdrop-blur-md max-w-[36%]">
                  <span className="text-[9px] text-emerald-400 block font-semibold truncate">DISCHARGE</span>
                  <span className="font-bold truncate block" title={`${destPortObj.name} (${destPortObj.country})`}>
                    {destPortObj.name}
                  </span>
                </div>
              </div>

              {/* Open Interactive Satellite Map CTA */}
              <div className="relative z-10 flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-300 text-[10px] truncate max-w-[65%]" title={routeDisplayInfo.routingSubtext}>
                  {routeDisplayInfo.routingSubtext}
                </span>
                <button
                  onClick={() => onNavigateTab('routes')}
                  className="text-cyan-300 hover:text-white font-bold flex items-center gap-1 text-[11px] cursor-pointer hover:underline shrink-0"
                >
                  <span>Open Full Satellite Map</span>
                  <span>↗</span>
                </button>
              </div>
            </div>

            {/* Route Stats */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 py-1 border-b border-slate-100">
                <span className="text-slate-500">Distance</span>
                <span className="font-bold font-mono">~ {distanceNM.toLocaleString()} nm</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 py-1 border-b border-slate-100">
                <span className="text-slate-500">Typical Duration</span>
                <span className="font-bold font-mono">
                  {estVoyageDays} – {estVoyageDays + Math.max(2, Math.round(estVoyageDays * 0.15))} days
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 py-1 border-b border-slate-100">
                <span className="text-slate-500">Common Route</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[60%]" title={`${originPortObj.name} (${originPortObj.country}) → ${destPortObj.name} (${destPortObj.country})`}>
                  {originPortObj.country === destPortObj.country 
                    ? `Domestic coastal (${originPortObj.name} → ${destPortObj.name})`
                    : `${originPortObj.name} (${originPortObj.country}) → ${destPortObj.name} (${destPortObj.country})`}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 py-1">
                <span className="text-slate-500">Major Ports Enroute</span>
                <span className="text-slate-700 text-right truncate max-w-[65%]" title={routeDisplayInfo.majorWaypoints}>
                  {routeDisplayInfo.majorWaypoints}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
