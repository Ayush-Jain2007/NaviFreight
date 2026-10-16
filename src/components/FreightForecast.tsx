import React, { useState, useEffect } from 'react';
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
import { SimulationParams } from '../types';
import { naviApi, ForecastApiResponse, AIInsightResponse } from '../services/api';

const originIdMap: Record<string, string> = {
  'Australia': 'port_hedland',
  'Port Hedland': 'port_hedland',
  'Newcastle': 'newcastle',
  'South Africa': 'richards_bay',
};

const destIdMap: Record<string, string> = {
  'Visakhapatnam': 'vizag_outer',
  'Paradip': 'paradip',
  'Dhamra': 'dhamra',
  'Haldia': 'haldia',
};

const commodityIdMap: Record<string, string> = {
  'Iron Ore': 'iron_ore',
  'Coking Coal': 'coking_coal',
  'Thermal Coal': 'thermal_coal',
  'Bauxite': 'bauxite',
};

interface FreightForecastProps {
  simulationParams: SimulationParams;
  onUpdateParams: (newParams: Partial<SimulationParams>) => void;
  onNavigateTab: (tab: any) => void;
}

export const FreightForecast: React.FC<FreightForecastProps> = ({
  simulationParams,
  onUpdateParams,
  onNavigateTab,
}) => {
  const [origin, setOrigin] = useState('Australia');
  const [destination, setDestination] = useState('Visakhapatnam');
  const [commodity, setCommodity] = useState('Iron Ore');
  const [vesselClass, setVesselClass] = useState('Panamax');
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [forecastData, setForecastData] = useState<ForecastApiResponse | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsightResponse | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingForecast(true);

    const originPortId = originIdMap[origin] || 'port_hedland';
    const destPortId = destIdMap[destination] || 'paradip';
    const commodityId = commodityIdMap[commodity] || 'iron_ore';

    naviApi.calculateForecast({
      originPortId,
      destPortId,
      commodityId,
      vesselClass,
      horizonDays: horizon,
      bunkerPricePerMT: simulationParams.bunkerPricePerMT || 624,
      marketVolatilityShock: simulationParams.marketVolatilityShock || 0,
    }).then((res) => {
      if (active) {
        setForecastData(res);
        setLoadingForecast(false);
      }
    }).catch(() => {
      if (active) setLoadingForecast(false);
    });

    naviApi.getAIMaritimeInsight({
      originPort: origin,
      destPort: destination,
      commodity,
      cargoQuantityMT: simulationParams.cargoQuantityMT || 150000,
      currentRateUSD: 24.8,
      projectedRateUSD: 28.5,
      horizonDays: horizon,
      bunkerPriceUSD: simulationParams.bunkerPricePerMT || 624,
      congestionDays: simulationParams.portCongestionDays || 1.5,
    }).then((insight) => {
      if (active) setAiInsight(insight);
    }).catch(console.error);

    return () => {
      active = false;
    };
  }, [origin, destination, commodity, vesselClass, horizon, simulationParams.bunkerPricePerMT, simulationParams.marketVolatilityShock]);

  return (
    <div className="space-y-6">
      {/* Parameter Filter Bar (Screenshot 2) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Origin */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Ship className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  Origin (Loading Port)
                </span>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="font-bold text-xs text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                >
                  <option value="Australia">Australia</option>
                  <option value="Port Hedland">Port Hedland</option>
                  <option value="Newcastle">Newcastle</option>
                  <option value="South Africa">South Africa</option>
                </select>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Destination */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                <Anchor className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  Destination (Discharge Port)
                </span>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="font-bold text-xs text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                >
                  <option value="Visakhapatnam">Visakhapatnam</option>
                  <option value="Paradip">Paradip</option>
                  <option value="Dhamra">Dhamra</option>
                  <option value="Haldia">Haldia</option>
                </select>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Commodity */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  Commodity
                </span>
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="font-bold text-xs text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                >
                  <option value="Iron Ore">Iron Ore</option>
                  <option value="Coking Coal">Coking Coal</option>
                  <option value="Thermal Coal">Thermal Coal</option>
                  <option value="Bauxite">Bauxite</option>
                </select>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Vessel Class */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Ship className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  Vessel Class
                </span>
                <select
                  value={vesselClass}
                  onChange={(e) => setVesselClass(e.target.value)}
                  className="font-bold text-xs text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                >
                  <option value="Panamax">Panamax</option>
                  <option value="Supramax">Supramax</option>
                  <option value="Capesize">Capesize</option>
                  <option value="Handysize">Handysize</option>
                </select>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {}}
              className="w-full bg-[#0d2a4a] hover:bg-[#12365e] text-white font-bold rounded-lg py-2.5 px-3 text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Generate Forecast</span>
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-center gap-1 py-0.5"
            >
              <Settings className="w-3 h-3" />
              <span>Advanced Options</span>
            </button>
          </div>
        </div>
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
                $ {forecastData?.currentRateUSD.toFixed(1) ?? '24.8'} <span className="text-sm font-semibold text-slate-500">/ ton</span>
              </div>
              <div className="text-xs font-bold text-rose-600 flex items-center gap-0.5 mt-0.5">
                <span>▲ {forecastData ? Math.abs(forecastData.deltaPercentage) : 12}%</span>
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
                $ {forecastData ? `${Math.round(forecastData.projectedRateUSD - 3)} – ${Math.round(forecastData.projectedRateUSD + 3)}` : '22 – 28'} <span className="text-sm font-semibold text-slate-500">/ ton</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Target: ${forecastData?.projectedRateUSD.toFixed(1) ?? '28.5'}/t
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
              <span className="text-xs text-slate-500 font-medium block">Expected Arrival Window</span>
              <div className="text-xl font-black text-slate-900 tracking-tight font-sans mt-0.5">
                15 – 28 Mar 2026
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Info className="w-3 h-3 text-slate-400" />
                <span>Based on selected route</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Est. Voyage Duration */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Est. Voyage Duration</span>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-sans mt-0.5">
                22 – 26 <span className="text-sm font-semibold text-slate-500">days</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Info className="w-3 h-3 text-slate-400" />
                <span>Depending on vessel and route</span>
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
            <FreightChart height={260} data={forecastData?.timeSeries} />
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
                    $ {forecastData ? `${Math.round(forecastData.projectedRateUSD - 3)} – ${Math.round(forecastData.projectedRateUSD + 3)}` : '22 – 28'} <span className="text-xs font-normal text-slate-500">/ ton</span>
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
                    {forecastData?.deltaPercentage && forecastData.deltaPercentage > 0 ? 'Upward Forward Pressure' : 'Seasonal Stabilization'}
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
                    ±{forecastData?.confidenceIntervalPercentage ?? 20}%
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
                    <span className="text-[10px] text-slate-400 block font-normal">(for 150,000 tons)</span>
                  </th>
                  <th className="py-2.5 px-3">Expected Arrival</th>
                  <th className="py-2.5 px-3 text-right">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Base Case */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">Base Case</td>
                  <td className="py-3 px-3 text-slate-600">Jan 2026</td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">24.8</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">3.72</td>
                  <td className="py-3 px-3 font-mono text-slate-600">18 Mar 2026</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700">
                      Medium
                    </span>
                  </td>
                </tr>

                {/* Early Booking */}
                <tr className="hover:bg-slate-50/80 transition-colors bg-emerald-50/20">
                  <td className="py-3 px-3 font-bold text-emerald-800">Early Booking</td>
                  <td className="py-3 px-3 text-slate-600">Dec 2025</td>
                  <td className="py-3 px-3 font-mono font-medium text-emerald-700">22.3</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-800">3.35</td>
                  <td className="py-3 px-3 font-mono text-slate-600">10 Mar 2026</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      Low
                    </span>
                  </td>
                </tr>

                {/* Wait and Book */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-rose-800">Wait and Book</td>
                  <td className="py-3 px-3 text-slate-600">Feb 2026</td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">27.1</td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-900">4.07</td>
                  <td className="py-3 px-3 font-mono text-slate-600">28 Mar 2026</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700">
                      High
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
                  13.2 kts • Favorable Seas
                </span>
              </div>

              {/* Waypoint Badges */}
              <div className="relative z-10 flex items-center justify-between gap-2 px-1">
                <div className="bg-slate-900/90 border border-cyan-500/40 px-2.5 py-1.5 rounded-lg text-[11px] text-white backdrop-blur-md">
                  <span className="text-[9px] text-cyan-400 block font-semibold">LOADING HUB</span>
                  <span className="font-bold">Port Hedland (WA)</span>
                </div>

                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] text-cyan-300 font-mono font-bold">~ 4,650 nm</span>
                  <div className="w-full flex items-center gap-1 my-0.5">
                    <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                    <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                  </div>
                  <span className="text-[9px] text-slate-300">via Lombok Strait</span>
                </div>

                <div className="bg-slate-900/90 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg text-[11px] text-white backdrop-blur-md">
                  <span className="text-[9px] text-emerald-400 block font-semibold">DISCHARGE</span>
                  <span className="font-bold">East Coast India</span>
                </div>
              </div>

              {/* Open Interactive Satellite Map CTA */}
              <div className="relative z-10 flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-300 text-[10px]">Lombok Strait & Bay of Bengal routing</span>
                <button
                  onClick={() => onNavigateTab('routes')}
                  className="text-cyan-300 hover:text-white font-bold flex items-center gap-1 text-[11px] cursor-pointer hover:underline"
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
                <span className="font-bold font-mono">~ 5,600 nm</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 py-1 border-b border-slate-100">
                <span className="text-slate-500">Typical Duration</span>
                <span className="font-bold font-mono">22 – 26 days</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 py-1 border-b border-slate-100">
                <span className="text-slate-500">Common Route</span>
                <span className="font-semibold text-slate-800">Australia → East Coast of India</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 py-1">
                <span className="text-slate-500">Major Ports Enroute</span>
                <span className="text-slate-700">Singapore, Colombo (illustrative)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
